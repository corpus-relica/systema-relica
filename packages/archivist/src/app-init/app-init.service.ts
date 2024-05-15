import { Logger, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { GraphService } from 'src/graph/graph.service';
import { CacheService } from 'src/cache/cache.service';
import { RawFactIngestionService } from 'src/raw-fact-ingestion/raw-fact-ingestion.service';
import { XLSService } from 'src/xls/xls.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';
import { readdirSync } from 'fs';

const BATCH_SIZE = 100;

@Injectable()
export class AppInitService implements OnApplicationBootstrap {
    private readonly logger = new Logger(AppInitService.name);

    constructor(
        private readonly graphService: GraphService,
        private readonly rawFactIngestionService: RawFactIngestionService,
        private readonly xlsService: XLSService,
        private readonly cacheService: CacheService,
        private readonly gellishBaseService: GellishBaseService,
    ) {}

    async onApplicationBootstrap() {
        await this.initializeDatabase();
        // Perform other application initialization tasks
    }

    private async initializeDatabase() {
        const isEmpty = await this.graphService.isDatabaseEmpty();
        if (isEmpty) {
            this.logger.debug('Graph database empty');

            //

            // this.logger.log(readdirSync);
            const files = readdirSync('./seed_xls');
            this.logger.log(files);

            this.xlsService.readXLSFixDatesAndSaveCSV(files);

            await this.rawFactIngestionService.loadFromFileCreateNodes('0.csv');

            await this.rawFactIngestionService.loadFromFileCreateRelationships(
                '0.csv',
            );

            // build caches
            await this.buildSubtypesCache();
            await this.buildEntityLineageCache();
            await this.buildEntityFactCache();

            this.logger.debug('datastores initialized');
        } else {
            this.logger.debug('Graph database not empty');
        }
    }

    //////////////////////////////////////////////////////// BUILD SUBTYPES CACHE

    private async fetchPathsToRoot(uid: number) {
        try {
            const query = `
      MATCH path = (start:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(end:Entity)
      WHERE start.uid = $uid AND end.uid = 730000
      RETURN path
      UNION
      MATCH path = (start:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(:Entity)
      ((:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(:Entity)){0,100}
      (:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(end:Entity)
      WHERE start.uid = $uid AND end.uid = 730000
      RETURN path`;

            const result = await this.graphService.execQuery(query, {
                uid: uid,
            });
            return result.map((record) => record.get('path'));
        } catch (error) {
            console.error('Error fetching paths:', error);
            return [];
        }
    }

    private processPath(paths: any[]) {
        // Map to hold node-to-descendants mapping
        const nodeToDescendants = new Map();

        paths.forEach((path) => {
            const origin = path.start;
            const originUid = this.graphService.resolveNeo4jInt(
                origin.properties.uid,
            );

            path.segments.forEach((segment: any) => {
                const entityNode = segment.end;
                const { labels } = entityNode;
                if (labels.includes('Entity')) {
                    const entityNodeUid = this.graphService.resolveNeo4jInt(
                        entityNode.properties.uid,
                    );

                    // If this node doesn't have a descendants list yet, initialize one
                    if (!nodeToDescendants.has(entityNodeUid)) {
                        nodeToDescendants.set(entityNodeUid, new Set());
                    }

                    const descendantsSet = nodeToDescendants.get(entityNodeUid);
                    descendantsSet.add(originUid);
                }
            });
        });

        return nodeToDescendants;
    }

    private async buildSubtypesCache(batchSize = 1000) {
        let skip = 0;
        let hasMore = true;

        while (hasMore) {
            this.logger.verbose(`Processing batch ${skip / batchSize + 1}...`);

            const nodes = await this.graphService.execQuery(`
                MATCH (node:Entity)
                RETURN node
                ORDER BY node.uid
                SKIP ${skip}
                LIMIT ${batchSize}
            `);

            if (nodes.length == 0) {
                hasMore = false;
                continue;
            }

            this.logger.verbose(`Fetched ${nodes.length} nodes`);
            this.logger.verbose('Processing paths...');

            // Step 2: Fetch paths for all nodes in this batch
            const allPaths = [];
            for (const nodeRecord of nodes) {
                const node = nodeRecord.get('node');
                const uid = this.graphService.resolveNeo4jInt(
                    node.properties.uid,
                );
                const paths = await this.fetchPathsToRoot(uid);
                allPaths.push(...paths); // combine all paths into one list
            }

            this.logger.verbose(`Processed ${allPaths.length} paths`);
            this.logger.verbose('Processing descendants...');
            // Step 3: Process all paths for this batch
            const nodeToDescendants = this.processPath(allPaths);

            this.logger.verbose(
                `Processed ${nodeToDescendants.size} descendants`,
            );
            this.logger.verbose('Inserting to cache...');
            // Step 4: Update Neo4j with the descendants for all nodes in this batch
            await this.cacheService.updateDescendantsInDB(nodeToDescendants);

            skip += batchSize;

            this.logger.verbose(
                'COMPLETED BUILDING SUBTYPES CACHE ----------------foo----',
            );
        }
    }

    ////////////////////////////////////////////////// BUILD ENTITY LINEAGE CACHE

    async processNodesLC() {
        let skip = 0;
        let hasMore = true;
        while (hasMore) {
            this.logger.verbose(`Processing batch ${skip / BATCH_SIZE + 1}...`);
            const nodes = await this.graphService.execQuery(`
	  MATCH (n:Fact)
	  WHERE (n.rel_type_uid = 1146) OR (n.rel_type_uid = 1726)
	  RETURN n
	  ORDER BY n.fact_uid ASC
	  SKIP ${skip}
	  LIMIT ${BATCH_SIZE}
`);

            if (nodes.length == 0) {
                hasMore = false;
                continue;
            }

            await Promise.all(
                nodes.map(async (nodeRecord) => {
                    const node = nodeRecord.get('n');
                    const raw_lh_object_uid = node.properties.lh_object_uid;
                    if (raw_lh_object_uid === undefined) {
                        return;
                    }
                    const lh_object_uid =
                        this.graphService.resolveNeo4jInt(raw_lh_object_uid);
                    const lineage: number[] =
                        await this.gellishBaseService.calculateLineage(
                            lh_object_uid,
                        );
                    this.logger.verbose('**** Lineage!!!!');
                    this.logger.verbose(lineage);
                    await this.cacheService.addToEntityLineageCache(
                        lh_object_uid,
                        lineage,
                    );
                }),
            );
            skip += BATCH_SIZE;
        }
        return;
    }

    async countFacts() {
        const result = await this.graphService.execQuery(
            'MATCH (n:Fact) RETURN count(n) as count',
        );
        if (result.length === 0) return 0;
        return this.graphService.resolveNeo4jInt(result[0]?.get('count'));
    }

    private async buildEntityLineageCache() {
        const count = await this.countFacts();

        this.logger.verbose('BUILDING ENTITY LINEAGE CACHE');
        this.logger.verbose(`Total facts: ${count}`);

        await this.cacheService.clearEntityLineageCacheComplete();

        await this.processNodesLC();

        this.logger.verbose('COMPLETED BUILDING ENTITY LINEAGE CACHE');
    }

    ///////////////////////////////////////////////////// BUILD ENTITY FACT CACHE

    async processNodesF() {
        let skip = 0;
        let hasMore = true;

        while (hasMore) {
            this.logger.verbose(`Processing batch ${skip / BATCH_SIZE + 1}...`);

            const nodes = await this.graphService.execQuery(`
      MATCH (n:Fact)
      RETURN n
      ORDER BY n.fact_uid ASC
      SKIP ${skip}
      LIMIT ${BATCH_SIZE}
    `);

            this.logger.verbose(`Fetched ${nodes.length} nodes`);

            if (nodes.length === 0) {
                hasMore = false;
                continue;
            }

            await Promise.all(
                nodes.map(async (nodeRecord) => {
                    const node = nodeRecord.get('n');
                    const raw_lh_object_uid = node.properties.lh_object_uid;
                    const raw_rh_object_uid = node.properties.rh_object_uid;
                    const raw_fact_uid = node.properties.fact_uid;
                    if (
                        raw_lh_object_uid === undefined ||
                        raw_rh_object_uid === undefined ||
                        raw_fact_uid === undefined
                    ) {
                        return;
                    }
                    const lh_object_uid =
                        this.graphService.resolveNeo4jInt(raw_lh_object_uid);
                    const rh_object_uid =
                        this.graphService.resolveNeo4jInt(raw_rh_object_uid);
                    const fact_uid =
                        this.graphService.resolveNeo4jInt(raw_fact_uid);

                    await this.cacheService.addToEntityFactsCache(
                        lh_object_uid,
                        fact_uid,
                    );
                    await this.cacheService.addToEntityFactsCache(
                        rh_object_uid,
                        fact_uid,
                    );
                }),
            );

            skip += BATCH_SIZE;
        }
    }

    async buildEntityFactCache() {
        await this.cacheService.clearEntityFactsCacheComplete();
        await this.processNodesF();
    }
}
