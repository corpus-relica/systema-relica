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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ArtificialIntelligenceController_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtificialIntelligenceController = void 0;
const common_1 = require("@nestjs/common");
const artificialIntelligence_service_1 = require("./artificialIntelligence.service");
let ArtificialIntelligenceController = ArtificialIntelligenceController_1 = class ArtificialIntelligenceController {
    constructor(artificialIntelligenceService) {
        this.artificialIntelligenceService = artificialIntelligenceService;
        this.logger = new common_1.Logger(ArtificialIntelligenceController_1.name);
    }
    async chat(apiKey, supertypeUID, newKindName) {
        this.logger.log('~~~~~~~~~~~~CONJURE DEFINITION~~~~~~~~~~~~');
        if (!apiKey) {
            throw new common_1.HttpException('API key is required', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!supertypeUID) {
            throw new common_1.HttpException('Supertype UID is required', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!newKindName) {
            throw new common_1.HttpException('new kind name is required', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.artificialIntelligenceService.conjureDefinition(apiKey, supertypeUID, newKindName);
            return result;
        }
        catch (e) {
            this.logger.error('Error in chat:', e);
            throw new common_1.HttpException('Error chatting', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ArtificialIntelligenceController = ArtificialIntelligenceController;
__decorate([
    (0, common_1.Get)('/conjureDefinition'),
    __param(0, (0, common_1.Query)('apiKey')),
    __param(1, (0, common_1.Query)('supertypeUID')),
    __param(2, (0, common_1.Query)('newKindName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], ArtificialIntelligenceController.prototype, "chat", null);
exports.ArtificialIntelligenceController = ArtificialIntelligenceController = ArtificialIntelligenceController_1 = __decorate([
    (0, common_1.Controller)('artificialIntelligence'),
    __metadata("design:paramtypes", [typeof (_a = typeof artificialIntelligence_service_1.ArtificialIntelligenceService !== "undefined" && artificialIntelligence_service_1.ArtificialIntelligenceService) === "function" ? _a : Object])
], ArtificialIntelligenceController);
//# sourceMappingURL=artificialIntelligence.controller.js.map