import { Server, Socket } from 'socket.io';
import { ArchivistService } from '../archivist/archivist.service';
import { ModelService } from '../model/model.service';
export declare class EventsGateway {
    private readonly archivistService;
    private readonly modelService;
    private logger;
    server: Server;
    constructor(archivistService: ArchivistService, modelService: ModelService);
    afterInit(server: Server): void;
    handleConnection(client: Socket, ...args: any[]): void;
    handleDisconnect(client: Socket): void;
    getModel(uid: number): Promise<any>;
    getModels(uids: number[]): Promise<any>;
    getKindModel(uid: number): Promise<any>;
    getIndividualModel(uid: number): Promise<any>;
    updateDefinition(data: {
        uid: number;
        partial_definition: string;
        full_definition: string;
    }): Promise<any>;
    updateName(data: {
        uid: number;
        name: string;
    }): Promise<any>;
    updateCollection(data: {
        fact_uid: number;
        collection_uid: number;
        collection_name: string;
    }): Promise<any>;
    getFactsByEntity(uid: number): Promise<any>;
    getPhysicalObjectModel(uid: number): Promise<any>;
    getAspectModel(uid: number): Promise<any>;
    getRoleModel(uid: number): Promise<any>;
    getRelationModel(uid: number): Promise<any>;
    getOccurrenceModel(uid: number): Promise<any>;
}
