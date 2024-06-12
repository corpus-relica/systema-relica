import { Controller, Delete, Query } from '@nestjs/common';
import { DeletionService } from './deletion.service.js';

@Controller('deletion')
export class DeletionController {
  constructor(private readonly deletionService: DeletionService) {}

  @Delete('/entity')
  async deleteEntity(@Query('uid') uid: string) {
    if (!uid) {
      //res.status(400).send('UID is required');
    }
    console.log('DELETE ENTITY', uid);
    const result = await this.deletionService.deleteEntity(parseInt(uid));
    return result;
  }

  @Delete('/fact')
  async deleteFact(@Query('uid') uid: string) {
    if (!uid) {
      //res.status(400).send('UID is required');
    }
    console.log('DELETE FACT', uid);
    const result = await this.deletionService.deleteFact(parseInt(uid));
    return result;
  }
}
