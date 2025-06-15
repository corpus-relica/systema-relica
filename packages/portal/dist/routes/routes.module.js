"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutesModule = void 0;
const common_1 = require("@nestjs/common");
const auth_controller_1 = require("./auth.controller");
const search_controller_1 = require("./search.controller");
const entities_controller_1 = require("./entities.controller");
const facts_controller_1 = require("./facts.controller");
const system_controller_1 = require("./system.controller");
const model_controller_1 = require("./model.controller");
const environment_controller_1 = require("./environment.controller");
const prism_controller_1 = require("./prism.controller");
const websocket_clients_module_1 = require("../services/websocket-clients.module");
let RoutesModule = class RoutesModule {
};
exports.RoutesModule = RoutesModule;
exports.RoutesModule = RoutesModule = __decorate([
    (0, common_1.Module)({
        imports: [websocket_clients_module_1.WebSocketClientsModule],
        controllers: [
            auth_controller_1.AuthController,
            search_controller_1.SearchController,
            entities_controller_1.EntitiesController,
            facts_controller_1.FactsController,
            system_controller_1.SystemController,
            model_controller_1.ModelController,
            environment_controller_1.EnvironmentController,
            prism_controller_1.PrismController,
        ],
    })
], RoutesModule);
//# sourceMappingURL=routes.module.js.map