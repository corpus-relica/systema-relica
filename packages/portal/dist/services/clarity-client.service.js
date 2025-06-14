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
exports.ClarityClientService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const axios_2 = require("axios");
let ClarityClientService = class ClarityClientService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        const host = this.configService.get('CLARITY_HOST', 'clarity-core');
        const port = this.configService.get('CLARITY_PORT', 3001);
        this.baseUrl = `http://${host}:${port}`;
    }
    async getModel() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/model`));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async getKindModel(uid) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/model/kind`, {
                params: { uid },
            }));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async getIndividualModel(uid) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/model/individual`, {
                params: { uid },
            }));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async getEnvironment(environmentId) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/environment/${environmentId}`));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async createModel(modelData) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/model`, modelData));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    handleError(error) {
        if (error instanceof axios_2.AxiosError) {
            throw new Error(`Clarity service error: ${error.response?.data?.error || error.message}`);
        }
        throw error;
    }
};
exports.ClarityClientService = ClarityClientService;
exports.ClarityClientService = ClarityClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], ClarityClientService);
//# sourceMappingURL=clarity-client.service.js.map