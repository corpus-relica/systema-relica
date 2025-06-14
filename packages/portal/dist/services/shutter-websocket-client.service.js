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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShutterWebSocketClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const websocket_client_service_1 = require("./websocket-client.service");
let ShutterWebSocketClientService = class ShutterWebSocketClientService extends websocket_client_service_1.BaseWebSocketClient {
    constructor(configService) {
        super(configService, 'shutter', 3000);
    }
    async validateJWT(jwt) {
        const serviceMessage = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'shutter',
            action: 'validate-jwt',
            payload: { jwt },
        };
        const response = await this.sendMessage(serviceMessage);
        if (!response.success) {
            throw new Error(response.error || 'Failed to validate JWT');
        }
        return response.payload;
    }
    async authenticate(credentials) {
        const serviceMessage = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'shutter',
            action: 'authenticate',
            payload: credentials,
        };
        const response = await this.sendMessage(serviceMessage);
        if (!response.success) {
            throw new Error(response.error || 'Authentication failed');
        }
        return response.payload;
    }
    async refreshToken(refreshToken) {
        const serviceMessage = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'shutter',
            action: 'refresh-token',
            payload: { refreshToken },
        };
        const response = await this.sendMessage(serviceMessage);
        if (!response.success) {
            throw new Error(response.error || 'Failed to refresh token');
        }
        return response.payload;
    }
    generateMessageId() {
        return `shutter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.ShutterWebSocketClientService = ShutterWebSocketClientService;
exports.ShutterWebSocketClientService = ShutterWebSocketClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ShutterWebSocketClientService);
//# sourceMappingURL=shutter-websocket-client.service.js.map