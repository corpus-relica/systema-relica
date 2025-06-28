import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as neo4j from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: neo4j.Driver;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get<string>('NEO4J_URI', 'bolt://localhost:7687');
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

  async loadNodesFromCsv(fileName: string): Promise<{ success: boolean; error?: string; loaded?: number; skipped?: number; total?: number }> {
    console.log(`Creating nodes from CSV file: ${fileName}`);
    const fileUrl = `file:///${fileName}`;
    
    // Modified query to skip rows with null UIDs and track statistics
    const query = `
      LOAD CSV WITH HEADERS FROM $file_url AS line
      WITH line, 
           toInteger(replace(line['2'], ',', '')) AS lh_uid,
           toInteger(replace(line['15'], ',', '')) AS rh_uid
      // Count total rows
      WITH collect({line: line, lh_uid: lh_uid, rh_uid: rh_uid}) AS allRows
      WITH allRows, size(allRows) AS totalRows
      
      // Process valid rows
      UNWIND allRows AS row
      WITH row, totalRows
      WHERE row.lh_uid IS NOT NULL AND row.rh_uid IS NOT NULL
      
      MERGE (lh:Entity {uid: row.lh_uid})
      MERGE (rh:Entity {uid: row.rh_uid})
      
      WITH count(DISTINCT row.lh_uid) + count(DISTINCT row.rh_uid) as loadedCount, totalRows
      
      // Calculate skipped rows
      RETURN loadedCount, totalRows, (totalRows * 2) - loadedCount as skippedCount
    `;

    return this.withRetry(async () => {
      const session = this.getSession();
      try {
        const result = await session.run(query, { file_url: fileUrl });
        const record = result.records[0];
        
        if (record) {
          const loaded = record.get('loadedCount').toNumber();
          const total = record.get('totalRows').toNumber() * 2; // Each row can create 2 nodes
          const skipped = record.get('skippedCount').toNumber();
          
          console.log(`CSV Node Loading Summary for ${fileName}:`);
          console.log(`  - Total potential nodes: ${total}`);
          console.log(`  - Successfully loaded/matched: ${loaded}`);
          console.log(`  - Skipped (null UIDs): ${skipped}`);
          
          if (skipped > 0) {
            console.warn(`⚠️  Warning: Skipped ${skipped} nodes due to null UIDs`);
          }
          
          return { success: true, loaded, skipped, total };
        } else {
          return { success: true, loaded: 0, skipped: 0, total: 0 };
        }
      } catch (error) {
        console.error('Failed to load nodes from CSV file:', error);
        return { success: false, error: error.message };
      } finally {
        await session.close();
      }
    });
  }

  async loadRelationshipsFromCsv(fileName: string): Promise<{ success: boolean; error?: string; loaded?: number; skipped?: number; total?: number }> {
    console.log(`Creating relationships from CSV file: ${fileName}`);
    const fileUrl = `file:///${fileName}`;
    
    // Modified query to handle null values and track statistics
    const query = `
      LOAD CSV WITH HEADERS FROM $file_url AS line
      WITH line,
           toInteger(replace(line['2'], ',', '')) AS lh_uid,
           toInteger(replace(line['15'], ',', '')) AS rh_uid,
           toInteger(replace(line['1'], ',', '')) AS fact_uid
      
      // Count total rows
      WITH collect({line: line, lh_uid: lh_uid, rh_uid: rh_uid, fact_uid: fact_uid}) AS allRows
      WITH allRows, size(allRows) AS totalRows
      
      // Process only rows where both entities exist and have valid UIDs
      UNWIND allRows AS row
      WITH row, totalRows
      WHERE row.lh_uid IS NOT NULL 
        AND row.rh_uid IS NOT NULL 
        AND row.fact_uid IS NOT NULL
      
      // Check if entities exist
      OPTIONAL MATCH (lh:Entity {uid: row.lh_uid})
      OPTIONAL MATCH (rh:Entity {uid: row.rh_uid})
      
      WITH row, lh, rh, totalRows
      WHERE lh IS NOT NULL AND rh IS NOT NULL
      
      // Create the Fact node with all properties
      CREATE (rel:Fact {
          sequence: toInteger(replace(row.line['0'], ',', '')),
          language_uid: toInteger(replace(row.line['69'], ',', '')),
          language: row.line['54'],
          lh_context_uid: toInteger(replace(row.line['71'], ',', '')),
          lh_context_name: row.line['16'],
          lh_reality: row.line['39'],
          lh_object_uid: row.lh_uid,
          lh_cardinalities: row.line['44'],
          lh_object_name: row.line['101'],
          lh_role_uid: toInteger(replace(row.line['72'], ',', '')),
          lh_role_name: row.line['73'],
          intention_uid: toInteger(replace(row.line['5'], ',', '')),
          intention: row.line['43'],
          val_context_uid: toInteger(replace(row.line['19'], ',', '')),
          val_context_name: row.line['18'],
          fact_uid: row.fact_uid,
          fact_description: row.line['42'],
          rel_type_uid: toInteger(replace(row.line['60'], ',', '')),
          rel_type_name: row.line['3'],
          rh_role_uid: toInteger(replace(row.line['74'], ',', '')),
          rh_role_name: row.line['75'],
          rh_object_uid: row.rh_uid,
          rh_cardinalities: row.line['45'],
          rh_object_name: row.line['201'],
          partial_definition: row.line['65'],
          full_definition: row.line['4'],
          uom_uid: toInteger(replace(row.line['66'], ',', '')),
          uom_name: row.line['7'],
          accuracy_uid: toInteger(replace(row.line['76'], ',', '')),
          accuracy_name: row.line['77'],
          picklist_uid: toInteger(replace(row.line['70'], ',', '')),
          picklist_name: row.line['20'],
          remarks: row.line['14'],
          approval_status: row.line['8'],
          successor_uid: toInteger(replace(row.line['78'], ',', '')),
          reason: row.line['24'],
          effective_from: date(
              CASE
                  WHEN apoc.date.parse(row.line['9'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['9'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(row.line['9'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['9'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(row.line['9'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['9'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
                  ELSE NULL
              END
          ),
          creator_uid: toInteger(replace(row.line['13'], ',', '')),
          latest_update: date(
              CASE
                  WHEN apoc.date.parse(row.line['10'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['10'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(row.line['10'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['10'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(row.line['10'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['10'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
                  ELSE NULL
              END
          ),
          author_uid: toInteger(replace(row.line['6'], ',', '')),
          author: row.line['12'],
          copy_date: date(
              CASE
                  WHEN apoc.date.parse(row.line['22'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['22'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(row.line['22'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['22'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(row.line['22'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['22'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
                  ELSE NULL
              END
          ),
          availability_date: date(
              CASE
                  WHEN apoc.date.parse(row.line['23'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['23'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(row.line['23'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['23'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
                  WHEN apoc.date.parse(row.line['23'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(row.line['23'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
                  ELSE NULL
              END
          ),
          addressee_uid: toInteger(replace(row.line['178'], ',', '')),
          addressee_name: row.line['179'],
          reference: row.line['13'],
          line_uid: toInteger(replace(row.line['53'], ',', '')),
          collection_uid: toInteger(replace(row.line['50'], ',', '')),
          collection_name: row.line['68'],
          lh_commonality: row.line['80'],
          rh_commonality: row.line['81']
      })
      
      WITH rh, lh, rel, totalRows
      CALL apoc.create.relationship(lh, 'role', {}, rel) YIELD rel AS foo
      WITH rh, rel, totalRows
      CALL apoc.create.relationship(rel, 'role', {}, rh) YIELD rel AS bar
      
      WITH count(rel) as loadedCount, totalRows
      RETURN loadedCount, totalRows, totalRows - loadedCount as skippedCount
    `;

    return this.withRetry(async () => {
      const session = this.getSession();
      try {
        const result = await session.run(query, { file_url: fileUrl });
        const record = result.records[0];
        
        if (record) {
          const loaded = record.get('loadedCount').toNumber();
          const total = record.get('totalRows').toNumber();
          const skipped = record.get('skippedCount').toNumber();
          
          console.log(`CSV Relationship Loading Summary for ${fileName}:`);
          console.log(`  - Total rows: ${total}`);
          console.log(`  - Successfully created relationships: ${loaded}`);
          console.log(`  - Skipped rows: ${skipped}`);
          
          if (skipped > 0) {
            console.warn(`⚠️  Warning: Skipped ${skipped} relationships due to:`);
            console.warn(`     - Null UIDs in source data`);
            console.warn(`     - Missing Entity nodes (not created in node loading phase)`);
          }
          
          return { success: true, loaded, skipped, total };
        } else {
          return { success: true, loaded: 0, skipped: 0, total: 0 };
        }
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
