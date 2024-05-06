import neo4jClient from './Neo4jClient.js';
import { convertToInt, convertToDate } from './data/db.js';
const driver = neo4jClient.driver;
export const clearDB = async (batchSize = 10000, nodeThreshold = 0, relThreshold = 0) => {
    console.log('Clearing db in batches...');
    const session = driver.session();
    try {
        let result;
        do {
            result = await session.run(`
         MATCH (n)
         WHERE n.uid >= $uidThreshold OR n.fact_uid >= $factUIDThreshold
         WITH n
         LIMIT toInteger($batchSize)
         DETACH DELETE n
         RETURN count(n) as deletedNodes
        `, {
                batchSize: batchSize,
                uidThreshold: nodeThreshold,
                factUIDThreshold: relThreshold,
            });
            const deletedNodes = result.records[0]?.get('deletedNodes').toNumber();
            console.log(`Deleted ${deletedNodes} nodes...`);
            // Repeat until the number of deleted nodes is less than the batch size, indicating all nodes are deleted.
        } while (result.records.length > 0 &&
            result.records[0]?.get('deletedNodes').toNumber() === batchSize);
        console.log('Database cleared.');
    }
    catch (error) {
        console.error('Error while clearing the database:', error);
    }
    finally {
        session.close();
    }
};
export const addFact = async (fact) => {
    console.log(`// ADD FACT:  ${fact.fact_uid} - ${fact.lh_object_uid} ${fact.lh_object_name} - ${fact.rel_type_uid} ${fact.rel_type_name} - ${fact.rh_object_uid} ${fact.rh_object_name}`);
    const session = driver.session();
    // create nodes if they don't exist
    try {
        await session.run(`
	  MERGE (lh:Entity {uid: $lh_object_uid})
	  MERGE (rh:Entity {uid: $rh_object_uid})
	  `, {
            lh_object_uid: fact.lh_object_uid,
            rh_object_uid: fact.rh_object_uid,
        });
    }
    catch (error) {
        console.error('Error while adding fact:', error);
    }
    finally {
        session.close();
    }
    const session2 = driver.session();
    // then create the relationship
    try {
        // TODO capture more of the auxiliary data about the fact
        await session2.run(`
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

	  RETURN rel`, {
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
        });
    }
    catch (error) {
        console.error('Error while adding fact:', error);
    }
    finally {
        session.close();
    }
};
export const remFact = async (fact_uid) => {
    console.log('// REMOVE FACT: ', fact_uid);
    // need to remove the fact node and the two 'role' relationships
    const session = driver.session();
    try {
        await session.run(`
MATCH (n:Fact {fact_uid: $fact_uid})
DETACH DELETE n
`, {
            fact_uid: fact_uid,
        });
    }
    catch (error) {
        console.error('Error while removing fact:', error);
    }
    finally {
        session.close();
    }
};
export const remOrphanNodes = async () => {
    console.log('// REMOVE ORPHAN NODES');
    const session = driver.session();
    try {
        await session.run(`
MATCH (n)
WHERE NOT (n)-[]-()
DELETE n
`);
    }
    catch (error) {
        console.error('Error while removing orphan nodes:', error);
    }
    finally {
        session.close();
    }
};
export const getFactsAboveThreshold = async (threshold) => {
    console.log('// GET FACTS ABOVE THRESHOLD');
    const session = driver.session();
    try {
        const result = await session.run(`
MATCH (n:Fact)
WHERE n.fact_uid >= $threshold
RETURN n
`, {
            threshold: threshold,
        });
        return result.records.map(record => {
            const fact = record.get('n').properties;
            fact.fact_uid = convertToInt(fact.fact_uid);
            fact.lh_object_uid = convertToInt(fact.lh_object_uid);
            fact.rh_object_uid = convertToInt(fact.rh_object_uid);
            fact.rel_type_uid = convertToInt(fact.rel_type_uid);
            fact.lh_context_uid = convertToInt(fact.lh_context_uid);
            fact.sequence = convertToInt(fact.sequence);
            fact.language_uid = convertToInt(fact.language_uid);
            fact.latest_update = convertToDate(fact.latest_update);
            fact.effective_from = convertToDate(fact.effective_from);
            return fact;
        });
    }
    catch (error) {
        console.error('Error while getting facts above threshold:', error);
    }
    finally {
        session.close();
    }
    return [];
};
