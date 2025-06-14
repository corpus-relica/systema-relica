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
exports.EnvironmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const clarity_websocket_client_service_1 = require("../services/clarity-websocket-client.service");
const user_decorator_1 = require("../decorators/user.decorator");
let EnvironmentController = class EnvironmentController {
    constructor(clarityClient) {
        this.clarityClient = clarityClient;
    }
    async retrieveEnvironment(user, uid) {
        try {
            if (!uid) {
                throw new common_1.BadRequestException('uid parameter is required');
            }
            const environment = await this.clarityClient.getEnvironment(uid);
            return {
                success: true,
                environment,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Environment not found',
            };
        }
    }
};
exports.EnvironmentController = EnvironmentController;
__decorate([
    (0, common_1.Get)('retrieve'),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve environment information' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'uid', description: 'UID of the environment', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Environment retrieved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Query)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EnvironmentController.prototype, "retrieveEnvironment", null);
exports.EnvironmentController = EnvironmentController = __decorate([
    (0, swagger_1.ApiTags)('Environment'),
    (0, common_1.Controller)('environment'),
    __metadata("design:paramtypes", [clarity_websocket_client_service_1.ClarityWebSocketClientService])
], EnvironmentController);
//# sourceMappingURL=environment.controller.js.map