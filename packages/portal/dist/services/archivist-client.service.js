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
exports.ArchivistClientService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const axios_2 = require("axios");
let ArchivistClientService = class ArchivistClientService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        const host = this.configService.get('ARCHIVIST_HOST', 'archivist');
        const port = this.configService.get('ARCHIVIST_PORT', 3000);
        this.baseUrl = `http://${host}:${port}`;
    }
    async getKinds(params) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/kinds`, { params }));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async searchText(query, limit, offset) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/generalSearch/text`, {
                params: { query, limit, offset },
            }));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async searchByUid(uid) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/generalSearch/uid`, {
                params: { uid },
            }));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async resolveUids(uids) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/concept/entities`, { uids }));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async getClassifiedFacts(uid) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/fact/classified`, {
                params: { uid },
            }));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async getSubtypes(uid) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/fact/subtypes`, {
                params: { uid },
            }));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    async getSubtypesCone(uid) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/fact/subtypes-cone`, {
                params: { uid },
            }));
            return response.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }
    handleError(error) {
        if (error instanceof axios_2.AxiosError) {
            throw new Error(`Archivist service error: ${error.response?.data?.error || error.message}`);
        }
        throw error;
    }
};
exports.ArchivistClientService = ArchivistClientService;
exports.ArchivistClientService = ArchivistClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], ArchivistClientService);
//# sourceMappingURL=archivist-client.service.js.map