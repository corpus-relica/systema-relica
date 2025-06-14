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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const archivist_websocket_client_service_1 = require("../services/archivist-websocket-client.service");
const user_decorator_1 = require("../decorators/user.decorator");
let FactsController = class FactsController {
    constructor(archivistClient) {
        this.archivistClient = archivistClient;
    }
    async getClassifiedFacts(user, uid) {
        try {
            if (!uid) {
                throw new common_1.BadRequestException('uid parameter is required');
            }
            const facts = await this.archivistClient.getClassified(uid);
            return {
                success: true,
                facts,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to retrieve classification facts',
            };
        }
    }
    async getSubtypes(user, uid) {
        try {
            if (!uid) {
                throw new common_1.BadRequestException('uid parameter is required');
            }
            const subtypes = await this.archivistClient.getSubtypes(uid);
            return {
                success: true,
                subtypes,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to retrieve subtype relationships',
            };
        }
    }
    async getSubtypesCone(user, uid) {
        try {
            if (!uid) {
                throw new common_1.BadRequestException('uid parameter is required');
            }
            const cone = await this.archivistClient.getSubtypesCone(uid);
            return {
                success: true,
                cone,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to retrieve subtype cone',
            };
        }
    }
};
exports.FactsController = FactsController;
__decorate([
    (0, common_1.Get)('classified'),
    (0, swagger_1.ApiOperation)({ summary: 'Get classification facts for an entity' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'uid', description: 'UID of the entity', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Classification facts retrieved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Query)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FactsController.prototype, "getClassifiedFacts", null);
__decorate([
    (0, common_1.Get)('subtypes'),
    (0, swagger_1.ApiOperation)({ summary: 'Get subtype relationships for an entity' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'uid', description: 'UID of the entity', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subtype relationships retrieved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Query)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FactsController.prototype, "getSubtypes", null);
__decorate([
    (0, common_1.Get)('subtypes-cone'),
    (0, swagger_1.ApiOperation)({ summary: 'Get subtype cone (hierarchy) for an entity' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'uid', description: 'UID of the entity', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subtype cone retrieved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Query)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FactsController.prototype, "getSubtypesCone", null);
exports.FactsController = FactsController = __decorate([
    (0, swagger_1.ApiTags)('Facts'),
    (0, common_1.Controller)('fact'),
    __metadata("design:paramtypes", [archivist_websocket_client_service_1.ArchivistWebSocketClientService])
], FactsController);
//# sourceMappingURL=facts.controller.js.map