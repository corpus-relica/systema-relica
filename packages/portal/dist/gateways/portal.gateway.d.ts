import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class PortalGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private connectedClients;
    private socketTokens;
    private readonly errorCodes;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    private createResponse;
    private generateSocketToken;
    private validateJWT;
    private broadcastToEnvironment;
    handleAuth(client: Socket, payload: {
        jwt: string;
    }): Promise<any>;
    handleGuestAuth(client: Socket): Promise<any>;
    handlePing(client: Socket): Promise<any>;
    handleSelectEntity(client: Socket, payload: {
        uid: string;
        user_id: string;
    }): Promise<any>;
    handleSelectNone(client: Socket, payload: {
        user_id: string;
    }): Promise<any>;
    handleLoadSpecializationHierarchy(client: Socket, payload: {
        uid: string;
        user_id: string;
    }): Promise<any>;
    handleClearEnvironmentEntities(client: Socket, payload: {
        user_id: string;
    }): Promise<any>;
    handleLoadAllRelatedFacts(client: Socket, payload: {
        uid: string;
        user_id: string;
    }): Promise<any>;
    handleChatUserInput(client: Socket, payload: {
        message: string;
        user_id: string;
    }): Promise<any>;
    handlePrismStartSetup(client: Socket): Promise<any>;
    handlePrismCreateUser(client: Socket, payload: {
        username: string;
        password: string;
        confirmPassword: string;
    }): Promise<any>;
    handleUnknownMessage(client: Socket, data: any): any;
}
