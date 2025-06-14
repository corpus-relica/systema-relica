"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const events_module_1 = require("./events/events.module");
const model_module_1 = require("./model/model.module");
const archivist_module_1 = require("./archivist/archivist.module");
const artificialIntelligence_module_1 = require("./artificialIntelligence/artificialIntelligence.module");
const modelling_module_1 = require("./modelling/modelling.module");
const modellingSession_entity_1 = require("./modelling/modellingSession.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['../../.env', '../../.env.local'],
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.POSTGRES_HOST || 'localhost',
                port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
                username: process.env.POSTGRES_USER || 'postgres',
                password: process.env.POSTGRES_PASSWORD || 'password',
                database: process.env.POSTGRES_DB || 'postgres',
                entities: [
                    modellingSession_entity_1.ModellingSession,
                ],
                synchronize: true,
                dropSchema: false,
            }),
            events_module_1.EventsModule,
            model_module_1.ModelModule,
            archivist_module_1.ArchivistModule,
            artificialIntelligence_module_1.ArtificialIntelligenceModule,
            modelling_module_1.ModellingModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map