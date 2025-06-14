import { HttpService } from '@nestjs/axios';
export declare class ArchivistService {
    private httpService;
    private readonly logger;
    constructor(httpService: HttpService);
    getSpecializationHierarchy(uid: number): Promise<any>;
    getSpecializationFact(uid: number): Promise<any>;
    getSubtypes(uid: number): Promise<any>;
    getSubtypesCone(uid: number): Promise<any>;
    getFact(uid: number): Promise<any>;
    getFacts(factUIDs: number[]): Promise<any>;
    getEntity(uid: number): Promise<any>;
    retrieveAllFacts(uid: number): Promise<any>;
    getCategory(uid: number): Promise<any>;
    getDefinitiveFacts(uid: number): Promise<any>;
    getRelatedOnUIDSubtypeCone(lh_object_uid: number, rel_type_uid: number): Promise<any>;
    getEntityType(uid: number): Promise<any>;
    getFactsRelatingEntities(uid1: number, uid2: number): Promise<any>;
    textSearchExact(searchTerm: string): Promise<any>;
    createKind(parentUID: number, parentName: string, name: string, definition: string): Promise<any>;
    createIndividual(kindUID: number, kindName: string, name: string, definition: string): Promise<any>;
    deleteEntity(uid: number): Promise<any>;
    deleteFact(uid: number): Promise<any>;
    getClassified(uid: number): Promise<any>;
    getClassificationFact(uid: number): Promise<any>;
    submitDefinition(fact_uid: number, partial_definition: string, full_definition: string): Promise<any>;
    submitCollection(fact_uid: number, collection_uid: number, collection_name: string): Promise<any>;
    submitName(fact_uid: number, name: string): Promise<any>;
}
