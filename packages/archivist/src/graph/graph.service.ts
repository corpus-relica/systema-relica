import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import neo4j from 'neo4j-driver';

@Injectable()
export class GraphService {
    constructor(private readonly neo4jService: Neo4jService) {}

    async execQuery(query, params = null) {
        const session = this.neo4jService.getReadSession();

        try {
            // Begin a new transaction
            const tx = session.beginTransaction();

            let result;
            if (params === null) {
                result = await tx.run(query);
            } else {
                result = await tx.run(query, params);
            }

            // Commit the transaction
            await tx.commit();
            // console.log("####################### them mutherfucking result", result);
            return result.records;
        } catch (error) {
            // Handle any errors
            console.error(error);
            throw error;
        } finally {
            // Ensure session is closed
            await session.close();
        }
    }

    resolveInt(val) {
        if (neo4j.isInt(val)) {
            if (neo4j.integer.inSafeRange(val)) {
                return val.toNumber();
            } else {
                return val.toString();
            }
        } else {
            return val;
        }
    }

    convertNeo4jInts(node) {
        try {
            node.identity = this.resolveInt(node.identity);
            node.properties = Object.entries(node.properties).reduce(
                (acc, [key, value]) => {
                    acc[key] = this.resolveInt(value);
                    return acc;
                },
                {},
            );
            return node;
        } catch (error) {
            throw error;
        }
    }

    transformPathResults(res) {
        const result = res.map((item) => {
            const path = item.get('path');
            const rels = path.segments.map((seg) => {
                const { start, end } = seg;
                this.convertNeo4jInts(start);
                this.convertNeo4jInts(end);
                if (end.labels.includes('Fact')) {
                    return end.properties;
                }
                return null;
            });
            const filteredRels = rels.filter((rel) => rel !== null);
            return filteredRels;
        });
        return result;
    }

    transformResult(res) {
        const item = this.convertNeo4jInts(res.toObject().r).properties;
        return {
            fact_uid: item.fact_uid,
            lh_object_uid: item.lh_object_uid,
            lh_object_name: item.lh_object_name,
            rel_type_uid: item.rel_type_uid,
            rel_type_name: item.rel_type_name,
            rh_object_uid: item.rh_object_uid,
            rh_object_name: item.rh_object_name,
            collection_uid: item.collection_uid,
            collection_name: item.collection_name,
            partial_definition: item.partial_definition,
            full_definition: item.full_definition,
            uom_uid: item.uom_uid,
            uom_name: item.uom_name,
        };
    }

    transformResults(res) {
        return res.map((item) => {
            return this.transformResult(item);
        });
    }

    async isDatabaseEmpty() {
        const query = 'MATCH (n) RETURN n LIMIT 1';
        const res = await this.execQuery(query);
        return res.length === 0;
    }
}
