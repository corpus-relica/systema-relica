"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ArtificialIntelligenceService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtificialIntelligenceService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = require("openai");
const archivist_service_1 = require("../archivist/archivist.service");
let ArtificialIntelligenceService = ArtificialIntelligenceService_1 = class ArtificialIntelligenceService {
    constructor(archivistService) {
        this.archivistService = archivistService;
        this.logger = new common_1.Logger(ArtificialIntelligenceService_1.name);
    }
    async conjureDefinition(apiKey, supertypeUID, newKindName) {
        this.logger.log('~~~~~~~~~~~~CONJURE DEFINITION~~~~~~~~~~~~');
        const SH = await this.archivistService.getSpecializationHierarchy(supertypeUID);
        const shStr = SH.facts
            .map((f) => `${f.lh_object_name} : is a specialization of : ${f.rh_object_name} :: ${f.partial_definition}`)
            .join('\n');
        let sysPrompt = `
You are an expert in ontology and concept hierarchies. You've been given a hierarchical structure of concepts, each defined in the format:

[Specific Concept] : is a specialization of : [General Concept] :: [Definition]

Your task is to generate a logical and consistent definition for a new concept that follows this pattern. The definition should:
1. Be consistent with the existing hierarchy
2. Add specific characteristics that distinguish it from its parent concept
3. Be concise but informative
4. Use similar language and style as the existing definitions

Here's the hierarchy for context:

${shStr}

Now, complete the following new entry in the same style:

[New Concept] : is a specialization of : [Parent Concept] ::

Provide only the definition, starting after the double colon (::).
`;
        this.logger.log('sysPrompt--->', sysPrompt);
        const userPrompt = `${newKindName} : is a specialization of : ${SH.facts[SH.facts.length - 1].lh_object_name} ::`;
        this.logger.log('userPrompt--->', userPrompt);
        const client = new openai_1.default({
            apiKey,
        });
        const chatCompletion = await client.chat.completions.create({
            messages: [
                { role: 'system', content: sysPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'gpt-4o-mini',
        });
        return chatCompletion.choices[0].message.content;
    }
};
exports.ArtificialIntelligenceService = ArtificialIntelligenceService;
exports.ArtificialIntelligenceService = ArtificialIntelligenceService = ArtificialIntelligenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof archivist_service_1.ArchivistService !== "undefined" && archivist_service_1.ArchivistService) === "function" ? _a : Object])
], ArtificialIntelligenceService);
//# sourceMappingURL=artificialIntelligence.service.js.map