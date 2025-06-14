import { ArchivistService } from '../archivist/archivist.service';
export declare class ArtificialIntelligenceService {
    private readonly archivistService;
    private readonly logger;
    constructor(archivistService: ArchivistService);
    conjureDefinition(apiKey: string, supertypeUID: number, newKindName: string): Promise<string>;
}
