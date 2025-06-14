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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const archivist_service_1 = require("../archivist/archivist.service");
const model_service_1 = require("../model/model.service");
const common_1 = require("@nestjs/common");
let EventsGateway = class EventsGateway {
    constructor(archivistService, modelService) {
        this.archivistService = archivistService;
        this.modelService = modelService;
        this.logger = new common_1.Logger('EventsGateway');
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
    }
    handleConnection(client, ...args) {
        this.logger.log(`Client connected: ${client.id}`);
        client.emit('connection', { message: 'Successfully connected to server' });
        client.broadcast.emit('clientJoined', { clientId: client.id });
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.server.emit('clientLeft', { clientId: client.id });
    }
    async getModel(uid) {
        this.logger.log('GET MODEL:', uid);
        try {
            const model = await this.modelService.retrieveModel(uid);
            return { success: true, data: model };
        }
        catch (error) {
            this.logger.error('Error retrieving model:', error);
            return { success: false, error: error.message };
        }
    }
    async getModels(uids) {
        this.logger.log('GET MODELS:', uids);
        try {
            const models = await this.modelService.retrieveModels(uids);
            return { success: true, data: models };
        }
        catch (error) {
            this.logger.error('Error retrieving models:', error);
            return { success: false, error: error.message };
        }
    }
    async getKindModel(uid) {
        this.logger.log('GET KIND MODEL:', uid);
        try {
            const model = await this.modelService.retrieveKindModel(uid);
            return { success: true, data: model };
        }
        catch (error) {
            this.logger.error('Error retrieving kind model:', error);
            return { success: false, error: error.message };
        }
    }
    async getIndividualModel(uid) {
        this.logger.log('GET INDIVIDUAL MODEL:', uid);
        try {
            const model = await this.modelService.retrieveIndividualModel(uid);
            return { success: true, data: model };
        }
        catch (error) {
            this.logger.error('Error retrieving individual model:', error);
            return { success: false, error: error.message };
        }
    }
    async updateDefinition(data) {
        this.logger.log('UPDATE DEFINITION:', data);
        try {
            const result = await this.modelService.updateDefinition(data.uid, data.partial_definition, data.full_definition);
            return { success: true, data: result };
        }
        catch (error) {
            this.logger.error('Error updating definition:', error);
            return { success: false, error: error.message };
        }
    }
    async updateName(data) {
        this.logger.log('UPDATE NAME:', data);
        try {
            const result = await this.modelService.updateName(data.uid, data.name);
            return { success: true, data: result };
        }
        catch (error) {
            this.logger.error('Error updating name:', error);
            return { success: false, error: error.message };
        }
    }
    async updateCollection(data) {
        this.logger.log('UPDATE COLLECTION:', data);
        try {
            const result = await this.modelService.updateCollection(data.fact_uid, data.collection_uid, data.collection_name);
            return { success: true, data: result };
        }
        catch (error) {
            this.logger.error('Error updating collection:', error);
            return { success: false, error: error.message };
        }
    }
    async getFactsByEntity(uid) {
        this.logger.log('GET FACTS BY ENTITY:', uid);
        try {
            const facts = await this.archivistService.retrieveAllFacts(uid);
            return { success: true, data: facts };
        }
        catch (error) {
            this.logger.error('Error retrieving facts:', error);
            return { success: false, error: error.message };
        }
    }
    async getPhysicalObjectModel(uid) {
        this.logger.log('GET PHYSICAL OBJECT MODEL:', uid);
        try {
            const model = await this.modelService.getPhysicalObjectModel(uid);
            return { success: true, data: model };
        }
        catch (error) {
            this.logger.error('Error retrieving physical object model:', error);
            return { success: false, error: error.message };
        }
    }
    async getAspectModel(uid) {
        this.logger.log('GET ASPECT MODEL:', uid);
        try {
            const model = await this.modelService.getAspectModel(uid);
            return { success: true, data: model };
        }
        catch (error) {
            this.logger.error('Error retrieving aspect model:', error);
            return { success: false, error: error.message };
        }
    }
    async getRoleModel(uid) {
        this.logger.log('GET ROLE MODEL:', uid);
        try {
            const model = await this.modelService.getRoleModel(uid);
            return { success: true, data: model };
        }
        catch (error) {
            this.logger.error('Error retrieving role model:', error);
            return { success: false, error: error.message };
        }
    }
    async getRelationModel(uid) {
        this.logger.log('GET RELATION MODEL:', uid);
        try {
            const model = await this.modelService.getRelationModel(uid);
            return { success: true, data: model };
        }
        catch (error) {
            this.logger.error('Error retrieving relation model:', error);
            return { success: false, error: error.message };
        }
    }
    async getOccurrenceModel(uid) {
        this.logger.log('GET OCCURRENCE MODEL:', uid);
        try {
            const model = await this.modelService.getOccurrenceModel(uid);
            return { success: true, data: model };
        }
        catch (error) {
            this.logger.error('Error retrieving occurrence model:', error);
            return { success: false, error: error.message };
        }
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.model/get'),
    __param(0, (0, websockets_1.MessageBody)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getModel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.model/get-batch'),
    __param(0, (0, websockets_1.MessageBody)('uids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getModels", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.kind/get'),
    __param(0, (0, websockets_1.MessageBody)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getKindModel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.individual/get'),
    __param(0, (0, websockets_1.MessageBody)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getIndividualModel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.model/update-definition'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "updateDefinition", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.model/update-name'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "updateName", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.model/update-collection'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "updateCollection", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.facts/get-by-entity'),
    __param(0, (0, websockets_1.MessageBody)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getFactsByEntity", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.quintessential/get-physical-object'),
    __param(0, (0, websockets_1.MessageBody)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getPhysicalObjectModel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.quintessential/get-aspect'),
    __param(0, (0, websockets_1.MessageBody)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getAspectModel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.quintessential/get-role'),
    __param(0, (0, websockets_1.MessageBody)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getRoleModel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.quintessential/get-relation'),
    __param(0, (0, websockets_1.MessageBody)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getRelationModel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clarity.quintessential/get-occurrence'),
    __param(0, (0, websockets_1.MessageBody)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getOccurrenceModel", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof archivist_service_1.ArchivistService !== "undefined" && archivist_service_1.ArchivistService) === "function" ? _a : Object, typeof (_b = typeof model_service_1.ModelService !== "undefined" && model_service_1.ModelService) === "function" ? _b : Object])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map