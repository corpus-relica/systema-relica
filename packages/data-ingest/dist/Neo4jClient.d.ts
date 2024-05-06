import neo4j from 'neo4j-driver';
declare class Neo4jClient {
    driver: neo4j.Driver;
    constructor();
}
declare const neo4jClient: Neo4jClient;
export default neo4jClient;
