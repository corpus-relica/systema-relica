"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModellingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const modelling_service_1 = require("./modelling.service");
const modellingSession_entity_1 = require("./modellingSession.entity");
const modelling_controller_1 = require("./modelling.controller");
let ModellingModule = class ModellingModule {
};
exports.ModellingModule = ModellingModule;
exports.ModellingModule = ModellingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([modellingSession_entity_1.ModellingSession])],
        providers: [modelling_service_1.ModellingService],
        controllers: [modelling_controller_1.ModellingController],
        exports: [],
    })
], ModellingModule);
//# sourceMappingURL=modelling.module.js.map