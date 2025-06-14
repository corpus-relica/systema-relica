"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketClientsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const archivist_websocket_client_service_1 = require("./archivist-websocket-client.service");
const clarity_websocket_client_service_1 = require("./clarity-websocket-client.service");
const aperture_websocket_client_service_1 = require("./aperture-websocket-client.service");
const prism_websocket_client_service_1 = require("./prism-websocket-client.service");
const nous_websocket_client_service_1 = require("./nous-websocket-client.service");
const shutter_websocket_client_service_1 = require("./shutter-websocket-client.service");
let WebSocketClientsModule = class WebSocketClientsModule {
};
exports.WebSocketClientsModule = WebSocketClientsModule;
exports.WebSocketClientsModule = WebSocketClientsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            archivist_websocket_client_service_1.ArchivistWebSocketClientService,
            clarity_websocket_client_service_1.ClarityWebSocketClientService,
            aperture_websocket_client_service_1.ApertureWebSocketClientService,
            prism_websocket_client_service_1.PrismWebSocketClientService,
            nous_websocket_client_service_1.NousWebSocketClientService,
            shutter_websocket_client_service_1.ShutterWebSocketClientService,
        ],
        exports: [
            archivist_websocket_client_service_1.ArchivistWebSocketClientService,
            clarity_websocket_client_service_1.ClarityWebSocketClientService,
            aperture_websocket_client_service_1.ApertureWebSocketClientService,
            prism_websocket_client_service_1.PrismWebSocketClientService,
            nous_websocket_client_service_1.NousWebSocketClientService,
            shutter_websocket_client_service_1.ShutterWebSocketClientService,
        ],
    })
], WebSocketClientsModule);
//# sourceMappingURL=websocket-clients.module.js.map