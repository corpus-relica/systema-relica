import { SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { EntityActions, EntityBatchResolveMessage } from '@relica/websocket-contracts';

@Injectable()
export class EntityHandlers {
  private readonly logger = new Logger(EntityHandlers.name);

  @SubscribeMessage(EntityActions.BATCH_RESOLVE)
  async handleEntityBatchResolve(
    @MessageBody() data: EntityBatchResolveMessage,
    @ConnectedSocket() client: Socket,
  ): Promise<any> {
    try {
      this.logger.log(`🔍 Handling entity batch resolve for UIDs: ${data.uids}`);

      // Validate the request data
      if (!data.uids || !Array.isArray(data.uids)) {
        return {
          success: false,
          error: 'UIDs array is required',
          code: 'missing-required-field'
        };
      }

      if (data.uids.some(uid => typeof uid !== 'number' || isNaN(uid))) {
        return {
          success: false,
          error: 'All UIDs must be valid numbers',
          code: 'invalid-field-format'
        };
      }

      // TODO: Replace this with actual entity resolution service call
      // For now, return mock data that matches the expected schema
      const mockResolvedEntities = data.uids.map(uid => ({
        uid,
        name: `Entity ${uid}`,
        descendants: [],
        definition: `Definition for entity ${uid}`,
        category: 'Unknown'
      }));

      this.logger.log(`✅ Successfully resolved ${mockResolvedEntities.length} entities`);

      return {
        success: true,
        data: mockResolvedEntities
      };

    } catch (error) {
      this.logger.error(`❌ Failed to resolve entities: ${error.message}`, error.stack);
      return {
        success: false,
        error: 'Failed to resolve entities',
        code: 'internal-error'
      };
    }
  }

  @SubscribeMessage(EntityActions.CATEGORY_GET)
  async handleEntityCategoryGet(
    @MessageBody() data: { uid: number },
    @ConnectedSocket() client: Socket,
  ): Promise<any> {
    try {
      this.logger.log(`🔍 Getting category for entity UID: ${data.uid}`);

      if (!data.uid || typeof data.uid !== 'number') {
        return {
          success: false,
          error: 'Valid UID is required',
          code: 'missing-required-field'
        };
      }

      // TODO: Replace with actual entity category service call
      const mockCategory = 'Physical Object';

      return {
        success: true,
        data: {
          category: mockCategory
        }
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get entity category: ${error.message}`, error.stack);
      return {
        success: false,
        error: 'Failed to get entity category',
        code: 'internal-error'
      };
    }
  }

  @SubscribeMessage(EntityActions.TYPE_GET)
  async handleEntityTypeGet(
    @MessageBody() data: { uid: number },
    @ConnectedSocket() client: Socket,
  ): Promise<any> {
    try {
      this.logger.log(`🔍 Getting type for entity UID: ${data.uid}`);

      if (!data.uid || typeof data.uid !== 'number') {
        return {
          success: false,
          error: 'Valid UID is required',
          code: 'missing-required-field'
        };
      }

      // TODO: Replace with actual entity type service call
      const mockType = 'Kind';

      return {
        success: true,
        data: {
          type: mockType
        }
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get entity type: ${error.message}`, error.stack);
      return {
        success: false,
        error: 'Failed to get entity type',
        code: 'internal-error'
      };
    }
  }
}