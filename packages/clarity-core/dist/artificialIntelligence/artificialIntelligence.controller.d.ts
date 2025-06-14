import { ArtificialIntelligenceService } from './artificialIntelligence.service';
export declare class ArtificialIntelligenceController {
    private readonly artificialIntelligenceService;
    private readonly logger;
    constructor(artificialIntelligenceService: ArtificialIntelligenceService);
    chat(apiKey: string, supertypeUID: number, newKindName: string): Promise<any>;
}
