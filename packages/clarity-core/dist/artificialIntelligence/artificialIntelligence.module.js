"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtificialIntelligenceModule = void 0;
const common_1 = require("@nestjs/common");
const artificialIntelligence_service_1 = require("./artificialIntelligence.service");
const artificialIntelligence_controller_1 = require("./artificialIntelligence.controller");
const archivist_module_1 = require("../archivist/archivist.module");
let ArtificialIntelligenceModule = class ArtificialIntelligenceModule {
};
exports.ArtificialIntelligenceModule = ArtificialIntelligenceModule;
exports.ArtificialIntelligenceModule = ArtificialIntelligenceModule = __decorate([
    (0, common_1.Module)({
        imports: [archivist_module_1.ArchivistModule],
        providers: [artificialIntelligence_service_1.ArtificialIntelligenceService],
        controllers: [artificialIntelligence_controller_1.ArtificialIntelligenceController],
        exports: [artificialIntelligence_service_1.ArtificialIntelligenceService],
    })
], ArtificialIntelligenceModule);
//# sourceMappingURL=artificialIntelligence.module.js.map