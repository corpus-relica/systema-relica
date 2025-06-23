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
  ) {
    this.logger.log(`🔍 Handling entity batch resolve for UIDs: ${data.uids}`);

    // Validate the request data
    if (!data.uids || !Array.isArray(data.uids)) {
      throw new Error('UIDs array is required');
    }

    if (data.uids.some(uid => typeof uid !== 'number' || isNaN(uid))) {
      throw new Error('All UIDs must be valid numbers');
    }

    const result = await this.gellishBaseService.getEntities(data.uids);
    this.logger.log(`✅ Successfully resolved ${result.length} entities`);

    return result;
  }

  @SubscribeMessage(EntityActions.CATEGORY_GET)
  async handleEntityCategoryGet(
    @MessageBody() data: { uid: number },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.uid || typeof data.uid !== 'number') {
      throw new Error('Valid UID is required');
    }

    return await this.gellishBaseService.getCategory(data.uid);
  }

  @SubscribeMessage(EntityActions.TYPE_GET)
  async handleEntityTypeGet(
    @MessageBody() data: { uid: number },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.uid || typeof data.uid !== 'number') {
      throw new Error('Valid UID is required');
    }

    const type = await this.entityRetrievalService.getEntityType(data.uid);
    return { type };
  }

  @SubscribeMessage(EntityActions.COLLECTIONS_GET)
  async handleEntityCollectionsGet(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log('🔍 Getting entity collections');
    const collections = await this.entityRetrievalService.getCollections();
    this.logger.log(`✅ Successfully retrieved ${collections.length} collections`);
    return collections;
  }
}
