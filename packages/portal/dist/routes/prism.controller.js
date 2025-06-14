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
exports.PrismController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prism_websocket_client_service_1 = require("../services/prism-websocket-client.service");
const user_decorator_1 = require("../decorators/user.decorator");
let PrismController = class PrismController {
    constructor(prismClient) {
        this.prismClient = prismClient;
    }
    async getSetupStatus(user) {
        try {
            const status = await this.prismClient.getSetupStatus();
            return {
                success: true,
                status,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to get setup status',
            };
        }
    }
    async startSetup(user) {
        try {
            const result = await this.prismClient.startSetup();
            return {
                success: true,
                result,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to start setup',
            };
        }
    }
    async createUser(user, body) {
        try {
            if (!body.username || !body.password || !body.confirmPassword) {
                throw new common_1.BadRequestException('Username, password, and confirmPassword are required');
            }
            if (body.password !== body.confirmPassword) {
                throw new common_1.BadRequestException('Password and confirmation do not match');
            }
            const result = await this.prismClient.createUser(body);
            return {
                success: true,
                result,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof common_1.BadRequestException ? error.message : 'Failed to create user',
            };
        }
    }
    async importData(user, body) {
        try {
            if (!body.dataSource) {
                throw new common_1.BadRequestException('dataSource is required');
            }
            const result = await this.prismClient.importData(body);
            return {
                success: true,
                result,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof common_1.BadRequestException ? error.message : 'Failed to start data import',
            };
        }
    }
};
exports.PrismController = PrismController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Prism setup status' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Setup status retrieved successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PrismController.prototype, "getSetupStatus", null);
__decorate([
    (0, common_1.Post)('start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start Prism setup process' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Setup started successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PrismController.prototype, "startSetup", null);
__decorate([
    (0, common_1.Post)('create-user'),
    (0, swagger_1.ApiOperation)({ summary: 'Create user during Prism setup' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiBody)({
        description: 'User creation data',
        schema: {
            type: 'object',
            properties: {
                username: { type: 'string', description: 'Username for the new user' },
                password: { type: 'string', description: 'Password for the new user' },
                confirmPassword: { type: 'string', description: 'Password confirmation' },
            },
            required: ['username', 'password', 'confirmPassword'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User created successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PrismController.prototype, "createUser", null);
__decorate([
    (0, common_1.Post)('import-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Import data during Prism setup' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiBody)({
        description: 'Data import configuration',
        schema: {
            type: 'object',
            properties: {
                dataSource: { type: 'string', description: 'Source of the data to import' },
                options: { type: 'object', description: 'Import options' },
            },
            required: ['dataSource'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Data import started successfully' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PrismController.prototype, "importData", null);
exports.PrismController = PrismController = __decorate([
    (0, swagger_1.ApiTags)('Prism'),
    (0, common_1.Controller)('api/prism/setup'),
    __metadata("design:paramtypes", [prism_websocket_client_service_1.PrismWebSocketClientService])
], PrismController);
//# sourceMappingURL=prism.controller.js.map