import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config();
const uri = process.env['RELICA_NEO4J_URI'];
const user = process.env['RELICA_NEO4J_USERNAME'];
const password = process.env['RELICA_NEO4J_PASSWORD'];
//@ts-ignore
class Neo4jClient {
    constructor() {
        Object.defineProperty(this, "driver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (!uri || !user || !password) {
            throw new Error('Missing environment variables');
        }
        this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    }
}
const neo4jClient = new Neo4jClient();
export default neo4jClient;
