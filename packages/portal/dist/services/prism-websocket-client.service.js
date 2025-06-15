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
exports.PrismWebSocketClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const websocket_client_service_1 = require("./websocket-client.service");
let PrismWebSocketClientService = class PrismWebSocketClientService extends websocket_client_service_1.BaseWebSocketClient {
    constructor(configService) {
        super(configService, 'prism', 3004);
    }
    async getSetupStatus() {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'prism',
            action: 'get-setup-status',
            payload: {},
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to get setup status');
        }
        return response.payload;
    }
    async startSetup() {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'prism',
            action: 'start-setup',
            payload: {},
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to start setup');
        }
        return response.payload;
    }
    async createUser(userData) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'prism',
            action: 'create-user',
            payload: userData,
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to create user');
        }
        return response.payload;
    }
    async importData(importData) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'prism',
            action: 'import-data',
            payload: importData,
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to import data');
        }
        return response.payload;
    }
};
exports.PrismWebSocketClientService = PrismWebSocketClientService;
exports.PrismWebSocketClientService = PrismWebSocketClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismWebSocketClientService);
//# sourceMappingURL=prism-websocket-client.service.js.map