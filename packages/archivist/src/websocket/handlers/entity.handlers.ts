import { SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { EntityActions, EntityBatchResolveMessage } from '@relica/websocket-contracts';
import { GellishBaseService } from '../../gellish-base/gellish-base.service';
import { EntityRetrievalService } from '../../entity-retrieval/entity-retrieval.service';


@Injectable()
export class EntityHandlers {
  private readonly logger = new Logger(EntityHandlers.name);

  constructor(
    private readonly gellishBaseService: GellishBaseService,
    private readonly entityRetrievalService: EntityRetrievalService
  ) {
    this.logger.log('EntityHandlers initialized');
  }

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

      const result = await this.gellishBaseService.getEntities(data.uids);

      this.logger.log(`✅ Successfully resolved ${result.length} entities`);

      return {
        success: true,
        payload: result
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
      // this.logger.log(`🔍 Getting type for entity UID: ${data.uid}`);

      if (!data.uid || typeof data.uid !== 'number') {
        return {
          success: false,
          error: 'Valid UID is required',
          code: 'missing-required-field'
        };
      }

      const type = await this.entityRetrievalService.getEntityType(data.uid);

      return {
        success: true,
        data: {
          type
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

  @SubscribeMessage(EntityActions.COLLECTIONS_GET)
  async handleEntityCollectionsGet(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): Promise<any> {
    try {
      this.logger.log('🔍 Getting entity collections');

      const collections = await this.entityRetrievalService.getCollections();

      this.logger.log(`✅ Successfully retrieved ${collections.length} collections`);

      return {
        success: true,
        data: collections
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get entity collections: ${error.message}`, error.stack);
      return {
        success: false,
        error: 'Failed to get entity collections',
        code: 'internal-error'
      };
    }
  }
}
