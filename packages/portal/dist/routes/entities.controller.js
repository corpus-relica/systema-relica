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
exports.EntitiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const archivist_websocket_client_service_1 = require("../services/archivist-websocket-client.service");
const user_decorator_1 = require("../decorators/user.decorator");
let EntitiesController = class EntitiesController {
    constructor(archivistClient) {
        this.archivistClient = archivistClient;
    }
    async getKinds(user) {
        try {
            const kinds = await this.archivistClient.getKinds();
            return {
                success: true,
                kinds,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to retrieve kinds',
            };
        }
    }
    async resolveEntitiesGet(user, uids) {
        try {
            if (!uids) {
                throw new common_1.BadRequestException('uids query parameter is required');
            }
            const uidArray = uids.split(',').map(uid => uid.trim());
            const entities = await this.archivistClient.resolveUids(uidArray);
            return {
                success: true,
                entities,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to resolve entities',
            };
        }
    }
    async resolveEntitiesPost(user, body) {
        try {
            if (!body.uids || !Array.isArray(body.uids)) {
                throw new common_1.BadRequestException('uids array is required in request body');
            }
            const entities = await this.archivistClient.resolveUids(body.uids);
            return {
                success: true,
                entities,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Failed to resolve entities',
            };
        }
    }
};
exports.EntitiesController = EntitiesController;
__decorate([
    (0, common_1.Get)('kinds'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available kinds' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of kinds retrieved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "getKinds", null);
__decorate([
    (0, common_1.Get)('concept/entities'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve UIDs to entity information (GET)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'uids', description: 'Comma-separated list of UIDs', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entities resolved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Query)('uids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "resolveEntitiesGet", null);
__decorate([
    (0, common_1.Post)('concept/entities'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve UIDs to entity information (POST)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                uids: { type: 'array', items: { type: 'string' } }
            },
            required: ['uids']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entities resolved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "resolveEntitiesPost", null);
exports.EntitiesController = EntitiesController = __decorate([
    (0, swagger_1.ApiTags)('Entities'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [archivist_websocket_client_service_1.ArchivistWebSocketClientService])
], EntitiesController);
//# sourceMappingURL=entities.controller.js.map