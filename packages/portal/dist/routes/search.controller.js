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
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const archivist_websocket_client_service_1 = require("../services/archivist-websocket-client.service");
const user_decorator_1 = require("../decorators/user.decorator");
let SearchController = class SearchController {
    constructor(archivistClient) {
        this.archivistClient = archivistClient;
    }
    async searchText(user, query, limit, offset) {
        try {
            if (!query) {
                throw new common_1.BadRequestException('query parameter is required');
            }
            const limitNum = limit ? parseInt(limit, 10) : 10;
            const offsetNum = offset ? parseInt(offset, 10) : 0;
            const results = await this.archivistClient.searchText(query, limitNum, offsetNum);
            return {
                success: true,
                results,
                total: results.length,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to perform text search',
            };
        }
    }
    async searchByUid(user, uid) {
        try {
            if (!uid) {
                throw new common_1.BadRequestException('uid parameter is required');
            }
            const entity = await this.archivistClient.searchUid(uid);
            return {
                success: true,
                entity,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Entity not found',
            };
        }
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)('generalSearch/text'),
    (0, swagger_1.ApiOperation)({ summary: 'Search entities by text' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'query', description: 'Text to search for', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: 'Maximum number of results', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', description: 'Offset for pagination', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results retrieved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Query)('query')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchText", null);
__decorate([
    (0, common_1.Get)('generalSearch/uid'),
    (0, swagger_1.ApiOperation)({ summary: 'Search entities by UID' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'uid', description: 'UID to search for', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entity found successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Query)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchByUid", null);
exports.SearchController = SearchController = __decorate([
    (0, swagger_1.ApiTags)('Search'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [archivist_websocket_client_service_1.ArchivistWebSocketClientService])
], SearchController);
//# sourceMappingURL=search.controller.js.map