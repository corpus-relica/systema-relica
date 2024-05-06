import neo4jClient from '../Neo4jClient.js';
// @ts-ignore
import {linearize} from 'c3-linearization';

const driver = neo4jClient.driver;

export const convertToInt = (neo4jInt: any) => {
	if (typeof neo4jInt === 'number') return neo4jInt;
	if (typeof neo4jInt === 'string') return parseInt(neo4jInt);

	if (neo4jInt.low === undefined || neo4jInt.high === undefined) {
		// console.log('WHAT THE FUCK');
		// console.log(typeof neo4jInt);
		// return 0;
	}
	// console.log(neo4jInt.low);
	return neo4jInt.low + neo4jInt.high * Math.pow(2, 32);
};

export const convertToDate = (neo4jDate: any): string | undefined => {
	if (!neo4jDate) return undefined;
	const year = convertToInt(neo4jDate.year);
	const month = convertToInt(neo4jDate.month);
	const day = convertToInt(neo4jDate.day);
	const date = new Date(year, month - 1, day);
	return date.toISOString().split('T')[0];
};

export const loadFromFileCreateNodes = async (
	fileName: string,
	log: (x: string) => void = console.log,
): Promise<void> => {
	const session = driver.session();
	log(`loading ${fileName}...creating nodes...`);
	try {
		await session.run(`
LOAD CSV WITH HEADERS FROM 'file:///${fileName}' AS line
MERGE (lh:Entity {uid: toInteger(replace(line['2'], ",", ""))})
MERGE (rh:Entity {uid: toInteger(replace(line['15'], ",", ""))})
`);
	} catch (error) {
		console.error('Error while loading from file:', error);
	} finally {
		log('loading from csv' + fileName + 'completed creating nodes');
		session.close();
	}
};

export const loadFromFileCreateRelationships = async (fileName: string) => {
	// console.log('loading from csv', fileName, 'creating relationships');
	const session = driver.session();
	try {
		await session.run(`
LOAD CSV WITH HEADERS FROM 'file:///${fileName}' AS line
MATCH (lh:Entity {uid: toInteger(replace(line['2'], ",", ""))})
MATCH (rh:Entity {uid: toInteger(replace(line['15'], ",", ""))})
CREATE (rel:Fact {
    sequence: toInteger(replace(line['0'], ",", "")),
    language_uid: toInteger(replace(line['69'], ",", "")),
    language: line['54'],
    lh_context_uid: toInteger(replace(line['71'], ",", "")),
    lh_context_name: line['16'],
    lh_reality: line['39'],
    lh_object_uid: toInteger(replace(line['2'], ",", "")),
    lh_cardinalities: line['44'],
    lh_object_name: line['101'],
    lh_role_uid: toInteger(replace(line['72'], ",", "")),
    lh_role_name: line['73'],
    intention_uid: toInteger(replace(line['5'], ",", "")),
    intention: line['43'],
    val_context_uid: toInteger(replace(line['19'], ",", "")),
    val_context_name: line['18'],
    fact_uid: toInteger(replace(line['1'], ",", "")),
    fact_description: line['42'],
    rel_type_uid: toInteger(replace(line['60'], ",", "")),
    rel_type_name: line['3'],
    rh_role_uid: toInteger(replace(line['74'], ",", "")),
    rh_role_name: line['75'],
    rh_object_uid: toInteger(replace(line['15'], ",", "")),
    rh_cardinalities: line['45'],
    rh_object_name: line['201'],
    partial_definition: line['65'],
    full_definition: line['4'],
    uom_uid: toInteger(replace(line['66'], ",", "")),
    uom_name: line['7'],
    accuracy_uid: toInteger(replace(line['76'], ",", "")),
    accuracy_name: line['77'],
    picklist_uid: toInteger(replace(line['70'], ",", "")),
    picklist_name: line['20'],
    remarks: line['14'],
    approval_status: line['8'],
    successor_uid: toInteger(replace(line['78'], ",", "")),
    reason: line['24'],
    effective_from: date(
        CASE
            WHEN apoc.date.parse(line['9'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['9'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['9'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['9'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['9'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['9'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
            ELSE NULL
        END
    ),
    creator_uid: toInteger(replace(line['13'], ",", "")),
    latest_update: date(
        CASE
            WHEN apoc.date.parse(line['10'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['10'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['10'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['10'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['10'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['10'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
            ELSE NULL
        END
    ),
    author_uid: toInteger(replace(line['6'], ",", "")),
    author: line['12'],
    copy_date: date(
        CASE
            WHEN apoc.date.parse(line['22'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['22'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['22'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['22'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['22'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['22'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
            ELSE NULL
        END
    ),
    availability_date: date(
        CASE
            WHEN apoc.date.parse(line['23'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['23'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['23'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['23'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['23'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['23'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
            ELSE NULL
        END
    ),
    addressee_uid: toInteger(replace(line['178'], ",", "")),
    addressee_name: line['179'],
    reference: line['13'],
    line_uid: toInteger(replace(line['53'], ",", "")),
    collection_uid: toInteger(replace(line['50'], ",", "")),
    collection_name: line['68'],
    lh_commonality: line['80'],
    rh_commonality: line['81']
})

WITH rh, lh, rel
CALL apoc.create.relationship(lh, "role", {}, rel) YIELD rel AS foo
WITH rh, rel
CALL apoc.create.relationship(rel, "role", {}, rh) YIELD rel AS bar

RETURN rel`);
	} catch (error) {
		console.error('Error while loading from file:', error);
	} finally {
		session.close();
	}
};

export const fetchPathsToRoot = async (uid: number) => {
	const session = driver.session();
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

		const result = await session.run(query, {uid: uid});
		return result.records.map(record => record.get('path'));
	} catch (error) {
		console.error('Error fetching paths:', error);
		return [];
	} finally {
		session.close();
	}
};

// -----------------------------------------------------------

const specializationHierarchy = `
MATCH path = (start:Entity)-[]->(f1:Fact)-[]->(end:Entity)
WHERE start.uid = $uid AND end.uid = 730000 AND f1.rel_type_uid IN $rel_type_uids
RETURN path

UNION

MATCH path = (start:Entity)-[]->(f2:Fact)-[]->(:Entity)
((:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(:Entity)){0,100}
(:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(end:Entity)
WHERE start.uid = $uid AND end.uid = 730000 AND f2.rel_type_uid IN $rel_type_uids
RETURN path`;

const getSpecializationHierarchy = async (uid: number) => {
	const session = driver.session();
	try {
		const result = await session.run(specializationHierarchy, {
			uid,
			rel_type_uids: [1146, 1726],
		});
		return result.records.map(record => record.get('path'));
	} catch {
		console.error('Error fetching specialization hierarchy:', error);
		return [];
	} finally {
		session.close();
	}
};

export const getLineage = async (uid: number) => {
	const result = await getSpecializationHierarchy(uid);

	if (result.length === 0) {
		return [];
	}

	const factsSet = new Set();
	const facts: any[] = [];

	// console.log(result);
	result.forEach(path => {
		// @ts-ignore
		path.segments.forEach(segment => {
			// @ts-ignore
			const {start, relationship, end} = segment;

			// Assuming that if a node has the label 'Fact', it is a Fact node
			if (start.labels.includes('Fact')) {
				convertToInt(start); // Convert Neo4j integers to JS integers if needed
				const startProps = start.properties;
				const factUID = startProps.fact_uid;

				// Use a Set for unique checking
				if (!factsSet.has(factUID)) {
					factsSet.add(factUID);
					facts.push(startProps);
				}
			}

			// Repeat the check for the end node
			if (end.labels.includes('Fact')) {
				convertToInt(end); // Convert Neo4j integers to JS integers if needed
				const endProps = end.properties;
				const factUID = endProps.fact_uid;

				if (!factsSet.has(factUID)) {
					factsSet.add(factUID);
					facts.push(endProps);
				}
			}
		});
	});

	const graph = facts.reduce((acc, fact) => {
		const lh_uid = fact.lh_object_uid;
		const rh_uid = fact.rh_object_uid;
		if (!acc[lh_uid]) acc[lh_uid] = [];
		acc[lh_uid].push(rh_uid);
		return acc;
	}, {});

	// Object.keys(graph).forEach(key => {
	// 	graph[key] = graph[key].sort((a: any, b: any) => {
	// 		return a - b;
	// 	});
	// });

	const lineage = linearize(graph);

	Object.keys(lineage).forEach(key => {
		// @ts-ignore
		lineage[key] = lineage[key].map(uid => parseInt(uid));
	});

	return lineage[uid];
};
