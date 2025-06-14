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
exports.AuthMiddleware = void 0;
const common_1 = require("@nestjs/common");
const shutter_websocket_client_service_1 = require("../services/shutter-websocket-client.service");
let AuthMiddleware = class AuthMiddleware {
    constructor(shutterClient) {
        this.shutterClient = shutterClient;
    }
    async use(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new common_1.UnauthorizedException('Missing or invalid authorization header');
            }
            const jwt = authHeader.substring(7);
            const validationResult = await this.shutterClient.validateJWT(jwt);
            req.user = {
                userId: validationResult.userId,
                jwt: jwt,
            };
            next();
        }
        catch (error) {
            throw new common_1.UnauthorizedException(error.message || 'Invalid authentication token');
        }
    }
};
exports.AuthMiddleware = AuthMiddleware;
exports.AuthMiddleware = AuthMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [shutter_websocket_client_service_1.ShutterWebSocketClientService])
], AuthMiddleware);
//# sourceMappingURL=auth.middleware.js.map