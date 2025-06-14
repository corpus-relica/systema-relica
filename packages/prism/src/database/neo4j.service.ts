import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as neo4j from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: neo4j.Driver;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get<string>('NEO4J_URI', 'bolt://neo4j:7687');
    const user = this.configService.get<string>('NEO4J_USER', 'neo4j');
    const password = this.configService.get<string>('NEO4J_PASSWORD', 'password');

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    
    // Test connection
    try {
      await this.driver.verifyConnectivity();
      console.log('✅ Connected to Neo4j database');
    } catch (error) {
      console.error('❌ Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }

  getSession() {
    return this.driver.session();
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if it's a transient error
        if (error.code === 'Neo.TransientError' && retry < maxRetries) {
          console.warn(`Transient Neo4j error, retrying (${retry + 1}/${maxRetries}): ${error.message}`);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 200 + (retry * 100)));
        } else {
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  async executeQuery(cypher: string, params: Record<string, any> = {}): Promise<{ success: boolean; results?: any[]; error?: string }> {
    const session = this.getSession();
    try {
      const result = await session.run(cypher, params);
      return { 
        success: true, 
        results: result.records.map(record => record.toObject())
      };
    } catch (error) {
      console.error('Failed to execute Cypher query:', error);
      return { success: false, error: error.message };
    } finally {
      await session.close();
    }
  }

  async isDatabaseEmpty(): Promise<boolean> {
    console.log('Checking if database is empty...');
    
    return this.withRetry(async () => {
      const session = this.getSession();
      try {
        const result = await session.run('MATCH (n) RETURN count(n) AS node_count LIMIT 1');
        const count = result.records[0]?.get('node_count').toNumber() || 0;
        console.log(`Database node count: ${count}`);
        return count === 0;
      } finally {
        await session.close();
      }
    });
  }

  async loadNodesFromCsv(fileName: string): Promise<{ success: boolean; error?: string }> {
    console.log(`Creating nodes from CSV file: ${fileName}`);
    const fileUrl = `file:///${fileName}`;
    
    // This query matches the Clojure version - it creates Entity nodes from specific columns
    const query = `
      LOAD CSV WITH HEADERS FROM $file_url AS line
      MERGE (lh:Entity {uid: toInteger(replace(line['2'], ',', ''))})
      MERGE (rh:Entity {uid: toInteger(replace(line['15'], ',', ''))})
      RETURN count(lh) + count(rh) as count
    `;

    return this.withRetry(async () => {
      const session = this.getSession();
      try {
        const result = await session.run(query, { file_url: fileUrl });
        const count = result.records[0]?.get('count').toNumber() || 0;
        console.log(`Successfully loaded nodes from CSV file. Created/matched ${count} nodes.`);
        return { success: true };
      } catch (error) {
        console.error('Failed to load nodes from CSV file:', error);
        return { success: false, error: error.message };
      } finally {
        await session.close();
      }
    });
  }

  async loadRelationshipsFromCsv(fileName: string): Promise<{ success: boolean; error?: string }> {
    console.log(`Creating relationships from CSV file: ${fileName}`);
    const fileUrl = `file:///${fileName}`;
    
    // This complex query matches the Clojure version exactly
    const query = `
      LOAD CSV WITH HEADERS FROM $file_url AS line
      MATCH (lh:Entity {uid: toInteger(replace(line['2'], ',', ''))})
      MATCH (rh:Entity {uid: toInteger(replace(line['15'], ',', ''))})
      CREATE (rel:Fact {
          sequence: toInteger(replace(line['0'], ',', '')),
          language_uid: toInteger(replace(line['69'], ',', '')),
          language: line['54'],
          lh_context_uid: toInteger(replace(line['71'], ',', '')),
          lh_context_name: line['16'],
          lh_reality: line['39'],
          lh_object_uid: toInteger(replace(line['2'], ',', '')),
          lh_cardinalities: line['44'],
          lh_object_name: line['101'],
          lh_role_uid: toInteger(replace(line['72'], ',', '')),
          lh_role_name: line['73'],
          intention_uid: toInteger(replace(line['5'], ',', '')),
          intention: line['43'],
          val_context_uid: toInteger(replace(line['19'], ',', '')),
          val_context_name: line['18'],
          fact_uid: toInteger(replace(line['1'], ',', '')),
          fact_description: line['42'],
          rel_type_uid: toInteger(replace(line['60'], ',', '')),
          rel_type_name: line['3'],
          rh_role_uid: toInteger(replace(line['74'], ',', '')),
          rh_role_name: line['75'],
          rh_object_uid: toInteger(replace(line['15'], ',', '')),
          rh_cardinalities: line['45'],
          rh_object_name: line['201'],
          partial_definition: line['65'],
          full_definition: line['4'],
          uom_uid: toInteger(replace(line['66'], ',', '')),
          uom_name: line['7'],
          accuracy_uid: toInteger(replace(line['76'], ',', '')),
          accuracy_name: line['77'],
          picklist_uid: toInteger(replace(line['70'], ',', '')),
          picklist_name: line['20'],
          remarks: line['14'],
          approval_status: line['8'],
          successor_uid: toInteger(replace(line['78'], ',', '')),
          reason: line['24'],
          effective_from: date(
              CASE
                  WHEN apoc.date.parse(line['9'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['9'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(line['9'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['9'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(line['9'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['9'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
                  ELSE NULL
              END
          ),
          creator_uid: toInteger(replace(line['13'], ',', '')),
          latest_update: date(
              CASE
                  WHEN apoc.date.parse(line['10'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['10'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(line['10'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['10'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(line['10'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['10'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
                  ELSE NULL
              END
          ),
          author_uid: toInteger(replace(line['6'], ',', '')),
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
          addressee_uid: toInteger(replace(line['178'], ',', '')),
          addressee_name: line['179'],
          reference: line['13'],
          line_uid: toInteger(replace(line['53'], ',', '')),
          collection_uid: toInteger(replace(line['50'], ',', '')),
          collection_name: line['68'],
          lh_commonality: line['80'],
          rh_commonality: line['81']
      })
      
      WITH rh, lh, rel
      CALL apoc.create.relationship(lh, 'role', {}, rel) YIELD rel AS foo
      WITH rh, rel
      CALL apoc.create.relationship(rel, 'role', {}, rh) YIELD rel AS bar
      
      RETURN count(rel) as count
    `;

    return this.withRetry(async () => {
      const session = this.getSession();
      try {
        const result = await session.run(query, { file_url: fileUrl });
        const count = result.records[0]?.get('count').toNumber() || 0;
        console.log(`Successfully loaded relationships from CSV file. Created ${count} relationships.`);
        return { success: true };
      } catch (error) {
        console.error('Failed to load relationships from CSV file:', error);
        return { success: false, error: error.message };
      } finally {
        await session.close();
      }
    });
  }

  async clearDatabase(): Promise<{ success: boolean; error?: string }> {
    console.log('Clearing database...');
    
    const query = `
      MATCH (n)
      DETACH DELETE n
      RETURN count(n) AS count
    `;

    return this.withRetry(async () => {
      const session = this.getSession();
      try {
        const result = await session.run(query);
        const count = result.records[0]?.get('count').toNumber() || 0;
        console.log(`Successfully cleared database. Deleted ${count} nodes and relationships.`);
        return { success: true };
      } catch (error) {
        console.error('Failed to clear database:', error);
        return { success: false, error: error.message };
      } finally {
        await session.close();
      }
    });
  }
}