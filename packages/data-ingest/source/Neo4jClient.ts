import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config();

const uri: string | undefined = process.env['RELICA_NEO4J_URI'];
const user: string | undefined = process.env['RELICA_NEO4J_USERNAME'];
const password: string | undefined = process.env['RELICA_NEO4J_PASSWORD'];

//@ts-ignore
class Neo4jClient {
	driver: neo4j.Driver;
	constructor() {
		if (!uri || !user || !password) {
			throw new Error('Missing environment variables');
		}
		this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
	}
	// async run(query, params) {
	// 	const session = this.driver.session();
	// 	try {
	// 		const result = await session.run(query, params);
	// 		return result.records.map(record => record.toObject());
	// 	} finally {
	// 		await session.close();
	// 	}
	// }
}

const neo4jClient = new Neo4jClient();
export default neo4jClient;
