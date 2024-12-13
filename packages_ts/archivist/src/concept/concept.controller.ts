import { Controller, Get, Delete, Query, Inject, Param } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { ConceptService } from './concept.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';

@Controller('concept')
export class ConceptController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly gellishBaseService: GellishBaseService,
    private readonly conceptService: ConceptService,
  ) {}

  /**
   * @openapi
   * /concept/descendants:
   *   get:
   *     description: given uid return list of descendants!
   *     responses:
   *       200:
   *         description: Returns a mysterious string.
   */
  @Get('descendants')
  async descendants(@Query('uid') uid: string): Promise<any> {
    console.log('Fetching descendants for concept with UID:', uid);
    const result = await this.cacheService.allDescendantsOf(parseInt(uid, 10));

    return result;
  }

  /**
   * @openapi
   * /concept/entities:
   *   get:
   *     summary: Retrieve Entities by UIDs
   *     description: Given a list of unique identifiers (UIDs), return the corresponding entity details.
   *     parameters:
   *       - in: query
   *         name: uids
   *         required: true
   *         description: Comma-separated list of unique identifiers for the entities.
   *         schema:
   *           type: string
   *           example: '2850,160170,193671,730044,790229'
   *     responses:
   *       200:
   *         description: A JSON array of entities corresponding to the provided UIDs.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   uid:
   *                     type: string
   *                     description: The unique identifier of the entity.
   *                     example: '123'
   *                   name:
   *                     type: string
   *                     description: The name of the entity.
   *                     example: 'Entity Name'
   *                   description:
   *                     type: string
   *                     description: A brief description of the entity.
   *                     example: 'This is an example entity.'
   *       400:
   *         description: Bad request. The list of UIDs was not provided or was invalid.
   *       404:
   *         description: No entities were found matching the provided UIDs.
   */
  @Get('entities')
  async entities(@Query('uids') uids: string): Promise<any> {
    console.log('getting entities :', uids);
    const result = await this.gellishBaseService.getEntities(JSON.parse(uids));
    return result;
  }

  @Delete('/entity')
  async deleteEntity(@Query('uid') uid: string) {
    if (!uid) {
      //res.status(400).send('UID is required');
    }
    console.log('DELETE ENTITY', uid);
    const result = await this.conceptService.deleteEntity(parseInt(uid));
    return result;
  }
}
