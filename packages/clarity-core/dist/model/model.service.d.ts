import { ArchivistService } from 'src/archivist/archivist.service';
export declare class ModelService {
    private readonly archivistService;
    private readonly logger;
    constructor(archivistService: ArchivistService);
    getPhysicalObjectModel(uid: number): Promise<{
        uid: number;
        category: string;
        name: any;
        aspects: any;
        roles: any;
        components: any;
        connections: any;
        facts: any;
    }>;
    getAspectModel(uid: number): Promise<{
        uid: number;
        category: string;
        name: any;
        possessors: any;
        isQuantitative: any;
        unitOfMeasure: {
            uid: any;
            name: any;
        };
        facts: any;
    }>;
    getRoleModel(uid: number): Promise<{
        uid: number;
        category: string;
        name: any;
        rolePlayers: any;
        requiredInRelations: any;
        facts: any;
    }>;
    getRelationModel(uid: number): Promise<{
        uid: number;
        category: string;
        name: any;
        requiredRole1: {
            uid: any;
            name: any;
        };
        requiredRole2: {
            uid: any;
            name: any;
        };
        inverseRelation: {
            uid: any;
            name: any;
        };
        facts: any;
    }>;
    getOccurrenceModel(uid: number): Promise<{
        uid: number;
        category: string;
        name: any;
        aspects: any;
        involved: any;
        temporalAspects: {
            beginTime: {
                uid: any;
                name: any;
                value: any;
            };
            endTime: {
                uid: any;
                name: any;
                value: any;
            };
            duration: {
                uid: any;
                name: any;
                value: any;
            };
        };
        facts: any;
    }>;
    retrieveKindModel(uid: any): Promise<any>;
    retrieveIndividualModel(uid: number): Promise<{
        uid: number;
        name: any;
        collection: {
            uid: any;
            name: any;
        };
        1225: any;
        type: string;
        category: any;
        definition: any;
        facts: any;
    } | {
        value: {
            quant: number;
            uom: {
                uid: any;
                name: any;
            };
        };
        uid: number;
        name: any;
        collection: {
            uid: any;
            name: any;
        };
        1225: any;
        type: string;
        category: any;
        definition: any;
        facts: any;
    }>;
    retrieveQualificationModel(uid: number): Promise<{
        name: any;
        uid: number;
        type: string;
        category: any;
        facts: any;
    }>;
    retrieveModel(uid: number): Promise<any>;
    throttlePromises(funcs: any, limit: any): Promise<any[]>;
    retrieveModels(uids: number[]): Promise<any[]>;
    updateDefinition(fact_uid: any, partial_definition: any, full_definition: any): Promise<any>;
    updateCollection(fact_uid: any, collection_uid: any, collection_name: any): Promise<any>;
    updateName(uid: any, name: any): Promise<any>;
}
