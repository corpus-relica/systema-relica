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
exports.ArchivistWebSocketClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const websocket_client_service_1 = require("./websocket-client.service");
let ArchivistWebSocketClientService = class ArchivistWebSocketClientService extends websocket_client_service_1.BaseWebSocketClient {
    constructor(configService) {
        super(configService, 'archivist', 3000);
    }
    async getKinds() {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'archivist',
            action: 'get-kinds',
            payload: {},
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to get kinds');
        }
        return response.payload;
    }
    async searchText(query, limit, offset) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'archivist',
            action: 'search-text',
            payload: { query, limit, offset },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to search text');
        }
        return response.payload;
    }
    async searchUid(uid) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'archivist',
            action: 'search-uid',
            payload: { uid },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to search UID');
        }
        return response.payload;
    }
    async resolveUids(uids) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'archivist',
            action: 'resolve-uids',
            payload: { uids },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to resolve UIDs');
        }
        return response.payload;
    }
    async getClassified(uid) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'archivist',
            action: 'get-classified',
            payload: { uid },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to get classified');
        }
        return response.payload;
    }
    async getSubtypes(uid) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'archivist',
            action: 'get-subtypes',
            payload: { uid },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to get subtypes');
        }
        return response.payload;
    }
    async getSubtypesCone(uid) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'archivist',
            action: 'get-subtypes-cone',
            payload: { uid },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to get subtypes cone');
        }
        return response.payload;
    }
    async submitFact(factData) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'archivist',
            action: 'submit-fact',
            payload: factData,
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to submit fact');
        }
        return response.payload;
    }
    async deleteFact(factId) {
        const message = {
            id: this.generateMessageId(),
            type: 'request',
            service: 'archivist',
            action: 'delete-fact',
            payload: { factId },
        };
        const response = await this.sendMessage(message);
        if (!response.success) {
            throw new Error(response.error || 'Failed to delete fact');
        }
        return response.payload;
    }
};
exports.ArchivistWebSocketClientService = ArchivistWebSocketClientService;
exports.ArchivistWebSocketClientService = ArchivistWebSocketClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ArchivistWebSocketClientService);
//# sourceMappingURL=archivist-websocket-client.service.js.map