import {
  Controller,
  Get,
  Query,
  Param,
  Logger,
  HttpException,
  Headers,
} from '@nestjs/common';
import { EnvironmentService } from './environment.service.js';

// import { REPLService } from '../repl/repl.service.js';
// const getIdentity = async () => {
//   try {
//     const { data } = await archivistClient.axiosInstance.get('/auth/profile');
//     return {
//       id: data.sub,
//       fullName: data.username,
//       // Add any other user properties you want to expose
//     };
//   } catch {
//     return Promise.reject();
//   }
// };

@Controller('environment')
export class EnvironmentController {
  private readonly logger = new Logger(EnvironmentController.name);

  constructor(private readonly environmentService: EnvironmentService) {}

  @Get('/retrieve')
  async retrieve(
    @Query('envID') envID: string,
    // @Res({ passthrough: true }) res: Response,
  ) {
    const userID = '7';

    // const { envID } = req.query;
    this.logger.log('~~~~~~~~~~~~RETRIEVE~~~~~~~~~~~~');
    console.log('retrieve', envID);

    try {
      const result = await this.environmentService.retrieveEnvironment(userID);
      return result;
    } catch (e) {
      console.log(e);
      throw new HttpException('Error retrieving environment', 500);
    }
  }

  @Get('/setSelectedEntity/:uid')
  async setSelectedEntity(@Param('uid') uid: string) {
    if (typeof uid === 'string') {
      const result = await this.environmentService.setSelectedEntity(
        +uid,
        'entity',
      );
      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('/loadEntity/:uid')
  async loadEntity(@Param('uid') uid: string) {
    if (typeof uid === 'string') {
      const result = await this.environmentService.loadEntity(+uid);
      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('textSearch/:searchTerm')
  async textSearch(@Param('searchTerm') searchTerm: string) {
    console.log('textSearch', searchTerm);
    if (typeof searchTerm === 'string') {
      const result = await this.environmentService.textSearch(searchTerm);
      return result;
    } else {
      // Handle the case where 'searchTerm' is not a string
      throw new HttpException('Invalid search term', 400);
    }
  }

  // TODO: maybe change this to a POST request
  @Get('/specializeKind/:uid/:supertypeName/:name')
  async specializeKind(
    @Param('uid') uid: string,
    @Param('supertypeName') supertypeName: string,
    @Param('name') name: string,
  ) {
    if (typeof uid === 'string') {
      const result = await this.environmentService.specializeKind(
        +uid,
        supertypeName,
        name,
      );

      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  // TODO: maybe change this to a POST request
  @Get('/classifyEntity/:uid/:name/:typeName')
  async classifyEntity(
    @Param('uid') uid: string,
    @Param('name') name: string,
    @Param('typeName') typeName: string,
  ) {
    if (typeof uid === 'string') {
      const result = await this.environmentService.classifyIndividual(
        +uid,
        typeName,
        name,
      );
      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadSpecializationHierarchy/:uid')
  async loadSpecializationHierarchy(@Param('uid') uid: string) {
    if (typeof uid === 'string') {
      const result =
        await this.environmentService.getSpecializationHierarchy(+uid);
      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadSpecialization/:uid')
  async loadSpecialization(@Param('uid') uid: string) {
    if (typeof uid === 'string') {
      const result =
        await this.environmentService.getSpecializationFactByUID(+uid);
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadClassified/:uid')
  async loadClassified(@Param('uid') uid: string) {
    if (typeof uid === 'string') {
      const result = await this.environmentService.getClassified(+uid);
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadClassification/:uid')
  async loadClassification(@Param('uid') uid: string) {
    if (typeof uid === 'string') {
      const result =
        await this.environmentService.getClassificationFactByUID(+uid);
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadAllRelatedFacts/:uid')
  async loadAllRelatedFacts(@Param('uid') uid: string) {
    if (typeof uid === 'string') {
      const result = await this.environmentService.loadAllRelatedFacts(+uid);
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('listSubtypes/:uid')
  async listSubtypes(@Param('uid') uid: string) {
    console.log('listSubtypes', uid);
    if (!isNaN(Number(uid))) {
      const result = await this.environmentService.listSubtypes(+uid);
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }
}
