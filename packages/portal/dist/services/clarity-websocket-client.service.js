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
exports.ClarityWebSocketClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const websocket_client_service_1 = require("./websocket-client.service");
let ClarityWebSocketClientService = class ClarityWebSocketClientService extends websocket_client_service_1.BaseWebSocketClient {
    constructor(configService) {
        super(configService, 'clarity', 3001);
    }
    async getModel() {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'clarity',
            action: 'get-model',
            payload: {},
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to get model');
        }
        return response.payload;
    }
    async getKindModel(uid) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'clarity',
            action: 'get-kind-model',
            payload: { uid },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to get kind model');
        }
        return response.payload;
    }
    async getIndividualModel(uid) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'clarity',
            action: 'get-individual-model',
            payload: { uid },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to get individual model');
        }
        return response.payload;
    }
    async getEnvironment(environmentId) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'clarity',
            action: 'get-environment',
            payload: { environmentId },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to get environment');
        }
        return response.payload;
    }
    async createModel(modelData) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'clarity',
            action: 'create-model',
            payload: modelData,
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to create model');
        }
        return response.payload;
    }
    async updateModel(modelId, modelData) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'clarity',
            action: 'update-model',
            payload: { modelId, ...modelData },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to update model');
        }
        return response.payload;
    }
};
exports.ClarityWebSocketClientService = ClarityWebSocketClientService;
exports.ClarityWebSocketClientService = ClarityWebSocketClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ClarityWebSocketClientService);
//# sourceMappingURL=clarity-websocket-client.service.js.map