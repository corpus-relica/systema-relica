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
exports.ModelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const clarity_websocket_client_service_1 = require("../services/clarity-websocket-client.service");
const user_decorator_1 = require("../decorators/user.decorator");
let ModelController = class ModelController {
    constructor(clarityClient) {
        this.clarityClient = clarityClient;
    }
    async getModel(user) {
        try {
            const model = await this.clarityClient.getModel();
            return {
                success: true,
                model,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to retrieve model',
            };
        }
    }
    async getKindModel(user, uid) {
        try {
            if (!uid) {
                throw new common_1.BadRequestException('uid parameter is required');
            }
            const kind = await this.clarityClient.getKindModel(uid);
            return {
                success: true,
                kind,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Kind not found',
            };
        }
    }
    async getIndividualModel(user, uid) {
        try {
            if (!uid) {
                throw new common_1.BadRequestException('uid parameter is required');
            }
            const individual = await this.clarityClient.getIndividualModel(uid);
            return {
                success: true,
                individual,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Individual not found',
            };
        }
    }
};
exports.ModelController = ModelController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve model information' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Model information retrieved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ModelController.prototype, "getModel", null);
__decorate([
    (0, common_1.Get)('kind'),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve kind model information' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'uid', description: 'UID of the kind', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Kind model retrieved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Query)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ModelController.prototype, "getKindModel", null);
__decorate([
    (0, common_1.Get)('individual'),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve individual model information' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'uid', description: 'UID of the individual', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Individual model retrieved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Query)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ModelController.prototype, "getIndividualModel", null);
exports.ModelController = ModelController = __decorate([
    (0, swagger_1.ApiTags)('Model'),
    (0, common_1.Controller)('model'),
    __metadata("design:paramtypes", [clarity_websocket_client_service_1.ClarityWebSocketClientService])
], ModelController);
//# sourceMappingURL=model.controller.js.map