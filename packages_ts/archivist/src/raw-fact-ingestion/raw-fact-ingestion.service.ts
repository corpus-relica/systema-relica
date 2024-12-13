import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import { Fact } from '@relica/types';

@Injectable()
export class RawFactIngestionService {
    private readonly logger = new Logger(RawFactIngestionService.name);

    constructor(private readonly neo4jService: Neo4jService) {}

    async loadFromFileCreateNodes(
        fileName: string,
        log: (x: string) => void = (x: string) => this.logger.verbose(x),
    ): Promise<void> {
        const session = this.neo4jService.getWriteSession();
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
    }

    async loadFromFileCreateRelationships(fileName: string) {
        // console.log('loading from csv', fileName, 'creating relationships');
        const session = this.neo4jService.getWriteSession();
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
    }
}
