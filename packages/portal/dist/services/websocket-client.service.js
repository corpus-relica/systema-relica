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
exports.BaseWebSocketClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const socket_io_client_1 = require("socket.io-client");
let BaseWebSocketClient = class BaseWebSocketClient {
    constructor(configService, serviceName, defaultPort) {
        this.configService = configService;
        this.serviceName = serviceName;
        this.defaultPort = defaultPort;
        this.socket = null;
        this.logger = new common_1.Logger(this.constructor.name);
        this.pendingRequests = new Map();
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        this.disconnect();
    }
    async connect() {
        if (this.socket?.connected) {
            return;
        }
        const host = this.configService.get(`${this.serviceName.toUpperCase()}_HOST`, 'localhost');
        const port = this.configService.get(`${this.serviceName.toUpperCase()}_PORT`, this.defaultPort);
        const url = `ws://${host}:${port}`;
        this.socket = (0, socket_io_client_1.io)(url, {
            transports: ['websocket'],
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        this.setupEventHandlers();
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Failed to connect to ${this.serviceName} service`));
            }, 5000);
            this.socket.on('connect', () => {
                clearTimeout(timeout);
                this.logger.log(`Connected to ${this.serviceName} service at ${url}`);
                resolve();
            });
            this.socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                this.logger.error(`Failed to connect to ${this.serviceName} service:`, error);
                reject(error);
            });
            this.socket.connect();
        });
    }
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.logger.log(`Disconnected from ${this.serviceName} service`);
        }
        for (const [id, request] of this.pendingRequests) {
            clearTimeout(request.timeout);
            request.reject(new Error(`Connection closed while waiting for response`));
        }
        this.pendingRequests.clear();
    }
    isConnected() {
        return this.socket?.connected || false;
    }
    async sendMessage(message) {
        if (!this.socket?.connected) {
            throw new Error(`Not connected to ${this.serviceName} service`);
        }
        const messageId = message.id || this.generateMessageId();
        const messageWithId = { ...message, id: messageId };
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(messageId);
                reject(new Error(`Request timeout for ${this.serviceName} service`));
            }, 30000);
            this.pendingRequests.set(messageId, { resolve, reject, timeout });
            this.socket.emit('message', messageWithId);
        });
    }
    setupEventHandlers() {
        if (!this.socket)
            return;
        this.socket.on('message', (response) => {
            const pendingRequest = this.pendingRequests.get(response.id);
            if (pendingRequest) {
                clearTimeout(pendingRequest.timeout);
                this.pendingRequests.delete(response.id);
                pendingRequest.resolve(response);
            }
        });
        this.socket.on('disconnect', () => {
            this.logger.warn(`Disconnected from ${this.serviceName} service`);
        });
        this.socket.on('reconnect', () => {
            this.logger.log(`Reconnected to ${this.serviceName} service`);
        });
        this.socket.on('error', (error) => {
            this.logger.error(`${this.serviceName} service error:`, error);
        });
    }
    generateMessageId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.BaseWebSocketClient = BaseWebSocketClient;
exports.BaseWebSocketClient = BaseWebSocketClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, String, Number])
], BaseWebSocketClient);
//# sourceMappingURL=websocket-client.service.js.map