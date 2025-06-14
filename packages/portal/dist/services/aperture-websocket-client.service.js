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
exports.ApertureWebSocketClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const websocket_client_service_1 = require("./websocket-client.service");
let ApertureWebSocketClientService = class ApertureWebSocketClientService extends websocket_client_service_1.BaseWebSocketClient {
    constructor(configService) {
        super(configService, 'aperture', 3003);
    }
    async getEnvironment(environmentId) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'aperture',
            action: 'get-environment',
            payload: { environmentId },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to get environment');
        }
        return response.payload;
    }
    async createEnvironment(environmentData) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'aperture',
            action: 'create-environment',
            payload: environmentData,
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to create environment');
        }
        return response.payload;
    }
    async updateEnvironment(environmentId, environmentData) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'aperture',
            action: 'update-environment',
            payload: { environmentId, ...environmentData },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to update environment');
        }
        return response.payload;
    }
    async selectEntity(uid, userId, environmentId) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'aperture',
            action: 'select-entity',
            payload: { uid, userId, environmentId },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to select entity');
        }
        return response.payload;
    }
    async loadEntities(environmentId, filters) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'aperture',
            action: 'load-entities',
            payload: { environmentId, filters },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to load entities');
        }
        return response.payload;
    }
    async loadSpecializationHierarchy(uid, userId) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'aperture',
            action: 'load-specialization-hierarchy',
            payload: { uid, userId },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to load specialization hierarchy');
        }
        return response.payload;
    }
    async clearEnvironmentEntities(userId, environmentId) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'aperture',
            action: 'clear-environment-entities',
            payload: { userId, environmentId },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to clear environment entities');
        }
        return response.payload;
    }
    async loadAllRelatedFacts(uid, userId) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'aperture',
            action: 'load-all-related-facts',
            payload: { uid, userId },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to load all related facts');
        }
        return response.payload;
    }
    generateMessageId() {
        return `aperture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.ApertureWebSocketClientService = ApertureWebSocketClientService;
exports.ApertureWebSocketClientService = ApertureWebSocketClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ApertureWebSocketClientService);
//# sourceMappingURL=aperture-websocket-client.service.js.map