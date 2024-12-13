import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import neo4j from 'neo4j-driver';
import { Fact } from '@relica/types';

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

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
      // this.logger.debug("####################### them mutherfucking result", result);
      return result.records;
    } catch (error) {
      // Handle any errors
      this.logger.error(error);
      throw error;
    } finally {
      // Ensure session is closed
      await session.close();
    }
  }

  async execWriteQuery(query, params = null) {
    const session = this.neo4jService.getWriteSession();

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
      // this.logger.debug("####################### them mutherfucking result", result);
      return result.records;
    } catch (error) {
      // Handle any errors
      this.logger.error(error);
      throw error;
    } finally {
      // Ensure session is closed
      await session.close();
    }
  }

  resolveNeo4jInt(val) {
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
      node.identity = this.resolveNeo4jInt(node.identity);
      node.properties = Object.entries(node.properties).reduce(
        (acc, [key, value]) => {
          acc[key] = this.resolveNeo4jInt(value);
          return acc;
        },
        {},
      );
      return node;
    } catch (error) {
      throw error;
    }
  }

  resolveNeo4jDate = (neo4jDate: any): string | undefined => {
    if (!neo4jDate) return undefined;
    const year = this.resolveNeo4jInt(neo4jDate.year);
    const month = this.resolveNeo4jInt(neo4jDate.month);
    const day = this.resolveNeo4jInt(neo4jDate.day);
    const date = new Date(year, month - 1, day);
    return date.toISOString().split('T')[0];
  };

  transformPathResults(res) {
    this.logger.debug('transformPathResults');
    this.logger.debug(res);

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

  //

  async clearDB(batchSize = 10000, nodeThreshold = 0, relThreshold = 0) {
    this.logger.verbose('Clearing db in batches...');
    const session = this.neo4jService.getWriteSession();

    try {
      let result;
      do {
        result = await session.run(
          `
         MATCH (n)
         WHERE n.uid >= $uidThreshold OR n.fact_uid >= $factUIDThreshold
         WITH n
         LIMIT toInteger($batchSize)
         DETACH DELETE n
         RETURN count(n) as deletedNodes
        `,
          {
            batchSize: batchSize,
            uidThreshold: nodeThreshold,
            factUIDThreshold: relThreshold,
          },
        );

        const deletedNodes = result.records[0]?.get('deletedNodes').toNumber();
        this.logger.verbose(`Deleted ${deletedNodes} nodes...`);

        // Repeat until the number of deleted nodes is less than the batch size, indicating all nodes are deleted.
      } while (
        result.records.length > 0 &&
        result.records[0]?.get('deletedNodes').toNumber() === batchSize
      );

      this.logger.verbose('Database cleared.');
    } catch (error) {
      this.logger.error('Error while clearing the database:', error);
    } finally {
      session.close();
    }
  }

  async addFact(fact: Fact) {
    this.logger.verbose(
      `// ADD FACT:  ${fact.fact_uid} - ${fact.lh_object_uid} ${fact.lh_object_name} - ${fact.rel_type_uid} ${fact.rel_type_name} - ${fact.rh_object_uid} ${fact.rh_object_name}`,
    );
    const session = this.neo4jService.getWriteSession();
    // create nodes if they don't exist
    try {
      await session.run(
        `
	  MERGE (lh:Entity {uid: $lh_object_uid})
	  MERGE (rh:Entity {uid: $rh_object_uid})
	  `,
        {
          lh_object_uid: fact.lh_object_uid,
          rh_object_uid: fact.rh_object_uid,
        },
      );
    } catch (error) {
      this.logger.error('Error while adding fact:', error);
    } finally {
      session.close();
    }

    const session2 = this.neo4jService.getWriteSession();
    // then create the relationship
    try {
      // TODO capture more of the auxiliary data about the fact
      await session2.run(
        `
	  MATCH (lh:Entity {uid: $lh_object_uid})
	  MATCH (rh:Entity {uid: $rh_object_uid})
	  CREATE (rel:Fact {
		sequence: $sequence,
		language_uid: $language_uid,
		language: $language,
		lh_context_uid: $lh_context_uid,
		lh_context_name: $lh_context_name,
		lh_object_uid: $lh_object_uid,
		lh_object_name: $lh_object_name,
		fact_uid: $fact_uid,
		rel_type_uid: $rel_type_uid,
		rel_type_name: $rel_type_name,
		rh_object_uid: $rh_object_uid,
		rh_object_name: $rh_object_name,
		partial_definition: $partial_definition,
		full_definition: $full_definition
	  })
      WITH rh, lh, rel
      CALL apoc.create.relationship(lh, "role", {}, rel) YIELD rel as foo
      WITH rh, rel
      CALL apoc.create.relationship(rel, "role", {}, rh) YIELD rel as bar

	  RETURN rel`,
        {
          sequence: fact.sequence,
          language_uid: fact.language_uid,
          language: fact.language,
          lh_context_uid: fact.lh_context_uid,
          lh_context_name: fact.lh_context_name,
          lh_object_uid: fact.lh_object_uid,
          lh_object_name: fact.lh_object_name,
          fact_uid: fact.fact_uid,
          rel_type_uid: fact.rel_type_uid,
          rel_type_name: fact.rel_type_name,
          rh_object_uid: fact.rh_object_uid,
          rh_object_name: fact.rh_object_name,
          partial_definition: fact.partial_definition,
          full_definition: fact.full_definition,
        },
      );
    } catch (error) {
      this.logger.error('Error while adding fact:', error);
    } finally {
      session.close();
    }
  }

  async remFact(fact_uid: number) {
    this.logger.verbose('// REMOVE FACT: ', fact_uid);
    // need to remove the fact node and the two 'role' relationships
    const session = this.neo4jService.getWriteSession();
    try {
      await session.run(
        `
MATCH (n:Fact {fact_uid: $fact_uid})
DETACH DELETE n
`,
        {
          fact_uid: fact_uid,
        },
      );
    } catch (error) {
      this.logger.error('Error while removing fact:', error);
    } finally {
      session.close();
    }
  }

  async remOrphanNodes() {
    this.logger.verbose('// REMOVE ORPHAN NODES');
    const session = this.neo4jService.getWriteSession();
    try {
      await session.run(`
MATCH (n)
WHERE NOT (n)-[]-()
DELETE n
`);
    } catch (error) {
      this.logger.error('Error while removing orphan nodes:', error);
    } finally {
      session.close();
    }
  }

  async getFactsAboveThreshold(threshold: number): Promise<Fact[]> {
    this.logger.verbose('// GET FACTS ABOVE THRESHOLD');
    const session = this.neo4jService.getReadSession();
    try {
      const result = await session.run(
        `
MATCH (n:Fact)
WHERE n.fact_uid >= $threshold
RETURN n
`,
        {
          threshold: threshold,
        },
      );
      return result.records.map((record) => {
        const fact: Fact = record.get('n').properties;
        fact.fact_uid = this.resolveNeo4jInt(fact.fact_uid);
        fact.lh_object_uid = this.resolveNeo4jInt(fact.lh_object_uid);
        fact.rh_object_uid = this.resolveNeo4jInt(fact.rh_object_uid);
        fact.rel_type_uid = this.resolveNeo4jInt(fact.rel_type_uid);
        fact.lh_context_uid = this.resolveNeo4jInt(fact.lh_context_uid);
        fact.sequence = this.resolveNeo4jInt(fact.sequence);
        fact.language_uid = this.resolveNeo4jInt(fact.language_uid);
        fact.latest_update = this.resolveNeo4jDate(fact.latest_update);
        fact.effective_from = this.resolveNeo4jDate(fact.effective_from);
        return fact;
      });
    } catch (error) {
      this.logger.error('Error while getting facts above threshold:', error);
    } finally {
      session.close();
    }
    return [];
  }
}
