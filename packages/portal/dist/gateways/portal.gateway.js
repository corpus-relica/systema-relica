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
var PortalGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let PortalGateway = PortalGateway_1 = class PortalGateway {
    constructor() {
        this.logger = new common_1.Logger(PortalGateway_1.name);
        this.connectedClients = new Map();
        this.socketTokens = new Map();
        this.errorCodes = {
            'service-unavailable': 1001,
            'internal-error': 1002,
            'timeout': 1003,
            'service-overloaded': 1004,
            'validation-error': 1101,
            'missing-required-field': 1102,
            'invalid-field-format': 1103,
            'invalid-reference': 1104,
            'constraint-violation': 1105,
            'unauthorized': 1301,
            'forbidden': 1302,
            'not-found': 1401,
            'bad-request': 1402,
            'unknown-message-type': 1403,
            'invalid-message-format': 1404,
        };
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }
    createResponse(id, success, data, requestId) {
        if (success) {
            return {
                id,
                type: 'response',
                service: 'portal',
                action: '',
                payload: data,
                success: true,
                request_id: requestId,
            };
        }
        else {
            const errorType = typeof data === 'object' && data.type ? data.type : 'internal-error';
            const errorMsg = typeof data === 'object' && data.message ? data.message : String(data);
            const errorDetails = typeof data === 'object' && data.details ? data.details : null;
            const errorCode = this.errorCodes[errorType] || 1002;
            return {
                id,
                type: 'response',
                service: 'portal',
                action: '',
                payload: null,
                success: false,
                error: `${errorType}: ${errorMsg}`,
                request_id: requestId,
            };
        }
    }
    generateSocketToken() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    validateJWT(jwt) {
        if (jwt && jwt.length > 10) {
            return 'user-123';
        }
        return null;
    }
    broadcastToEnvironment(environmentId, message) {
        for (const [clientId, clientData] of this.connectedClients) {
            if (clientData.environmentId === environmentId) {
                clientData.socket.emit('message', message);
            }
        }
    }
    async handleAuth(client, payload) {
        try {
            const userId = this.validateJWT(payload.jwt);
            if (!userId) {
                return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Invalid JWT' });
            }
            const socketToken = this.generateSocketToken();
            this.socketTokens.set(socketToken, {
                userId,
                createdAt: Date.now(),
            });
            this.connectedClients.set(client.id, {
                userId,
                socketToken,
                socket: client,
            });
            return this.createResponse(client.id, true, {
                token: socketToken,
                user_id: userId,
            });
        }
        catch (error) {
            this.logger.error('Auth error:', error);
            return this.createResponse(client.id, false, { type: 'internal-error', message: 'Authentication failed' });
        }
    }
    async handleGuestAuth(client) {
        try {
            const socketToken = this.generateSocketToken();
            const guestId = 'guest-user';
            this.socketTokens.set(socketToken, {
                userId: guestId,
                createdAt: Date.now(),
                isGuest: true,
            });
            this.connectedClients.set(client.id, {
                userId: guestId,
                socketToken,
                isGuest: true,
                socket: client,
            });
            return this.createResponse(client.id, true, {
                token: socketToken,
                user_id: guestId,
            });
        }
        catch (error) {
            this.logger.error('Guest auth error:', error);
            return this.createResponse(client.id, false, { type: 'internal-error', message: 'Guest authentication failed' });
        }
    }
    async handlePing(client) {
        return this.createResponse(client.id, true, {
            message: 'Pong',
            timestamp: Date.now(),
        });
    }
    async handleSelectEntity(client, payload) {
        try {
            const clientData = this.connectedClients.get(client.id);
            if (!clientData) {
                return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Not authenticated' });
            }
            const environmentId = clientData.environmentId || '1';
            this.broadcastToEnvironment(environmentId, {
                id: 'system',
                type: 'portal:entitySelected',
                payload: {
                    type: 'aperture.entity/selected',
                    entity_uid: payload.uid,
                    user_id: payload.user_id,
                    environment_id: environmentId,
                },
            });
            return this.createResponse(client.id, true, {
                message: 'Entity selected',
            });
        }
        catch (error) {
            this.logger.error('Select entity error:', error);
            return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to select entity' });
        }
    }
    async handleSelectNone(client, payload) {
        try {
            const clientData = this.connectedClients.get(client.id);
            if (!clientData) {
                return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Not authenticated' });
            }
            const environmentId = clientData.environmentId || '1';
            this.broadcastToEnvironment(environmentId, {
                id: 'system',
                type: 'portal:entitySelectedNone',
                payload: {
                    type: 'aperture.entity/deselected',
                    user_id: payload.user_id,
                    environment_id: environmentId,
                },
            });
            return this.createResponse(client.id, true, {
                message: 'Entity deselected',
            });
        }
        catch (error) {
            this.logger.error('Select none error:', error);
            return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to deselect entity' });
        }
    }
    async handleLoadSpecializationHierarchy(client, payload) {
        return this.createResponse(client.id, true, {
            message: 'Specialization hierarchy loaded',
            environment: {},
        });
    }
    async handleClearEnvironmentEntities(client, payload) {
        return this.createResponse(client.id, true, {
            message: 'Environment entities cleared',
        });
    }
    async handleLoadAllRelatedFacts(client, payload) {
        return this.createResponse(client.id, true, {
            message: 'All related facts loaded',
            facts: [],
        });
    }
    async handleChatUserInput(client, payload) {
        return this.createResponse(client.id, true, {
            message: 'Chat user input processed',
            response: {},
        });
    }
    async handlePrismStartSetup(client) {
        return this.createResponse(client.id, true, {
            result: {},
        });
    }
    async handlePrismCreateUser(client, payload) {
        return this.createResponse(client.id, true, {
            result: {},
        });
    }
    handleUnknownMessage(client, data) {
        this.logger.warn(`Unknown message type received from ${client.id}:`, data);
        return this.createResponse(client.id, false, {
            type: 'unknown-message-type',
            message: `Unknown message type`,
        });
    }
};
exports.PortalGateway = PortalGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PortalGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('auth'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PortalGateway.prototype, "handleAuth", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('guest-auth'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], PortalGateway.prototype, "handleGuestAuth", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], PortalGateway.prototype, "handlePing", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('selectEntity'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PortalGateway.prototype, "handleSelectEntity", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('selectNone'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PortalGateway.prototype, "handleSelectNone", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('loadSpecializationHierarchy'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PortalGateway.prototype, "handleLoadSpecializationHierarchy", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('clearEnvironmentEntities'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PortalGateway.prototype, "handleClearEnvironmentEntities", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('loadAllRelatedFacts'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PortalGateway.prototype, "handleLoadAllRelatedFacts", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chatUserInput'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PortalGateway.prototype, "handleChatUserInput", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('prism/startSetup'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], PortalGateway.prototype, "handlePrismStartSetup", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('prism/createUser'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PortalGateway.prototype, "handlePrismCreateUser", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('*'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Object)
], PortalGateway.prototype, "handleUnknownMessage", null);
exports.PortalGateway = PortalGateway = PortalGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: true,
            credentials: true,
        },
        transports: ['websocket'],
    })
], PortalGateway);
//# sourceMappingURL=portal.gateway.js.map