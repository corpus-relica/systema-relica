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
//   const token = localStorage.getItem('access_token');
//   if (!token) {
//     return Promise.reject();
//   }

//   try {
//     // The token will be automatically injected by the axiosInstance interceptor
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
    @Headers('authorization') authHeader: string,
    @Query('envID') envID: string,
    // @Res({ passthrough: true }) res: Response,
  ) {
    const token = authHeader?.split(' ')[1];
    const [header, payload, signature] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    const userID = decodedPayload.sub;
    const username = decodedPayload.username;

    // const { envID } = req.query;
    this.logger.log('~~~~~~~~~~~~RETRIEVE~~~~~~~~~~~~');
    this.logger.log(token);
    console.log('retrieve', userID, username, envID);

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
  async loadEntity(
    @Headers('authorization') authHeader: string,
    @Param('uid') uid: string,
  ) {
    const token = authHeader?.split(' ')[1];

    if (typeof uid === 'string') {
      const result = await this.environmentService.loadEntity(+uid, token);
      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('textSearch/:searchTerm')
  async textSearch(
    @Headers('authorization') authHeader: string,
    @Param('searchTerm') searchTerm: string,
  ) {
    const token = authHeader?.split(' ')[1];

    console.log('textSearch', searchTerm);
    if (typeof searchTerm === 'string') {
      const result = await this.environmentService.textSearch(
        searchTerm,
        token,
      );
      return result;
    } else {
      // Handle the case where 'searchTerm' is not a string
      throw new HttpException('Invalid search term', 400);
    }
  }

  // TODO: maybe change this to a POST request
  @Get('/specializeKind/:uid/:supertypeName/:name')
  async specializeKind(
    @Headers('authorization') authHeader: string,
    @Param('uid') uid: string,
    @Param('supertypeName') supertypeName: string,
    @Param('name') name: string,
  ) {
    const token = authHeader?.split(' ')[1];

    if (typeof uid === 'string') {
      const result = await this.environmentService.specializeKind(
        +uid,
        supertypeName,
        name,
        token,
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
    @Headers('authorization') authHeader: string,
    @Param('uid') uid: string,
    @Param('name') name: string,
    @Param('typeName') typeName: string,
  ) {
    const token = authHeader?.split(' ')[1];

    if (typeof uid === 'string') {
      const result = await this.environmentService.classifyIndividual(
        +uid,
        typeName,
        name,
        token,
      );
      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadSpecializationHierarchy/:uid')
  async loadSpecializationHierarchy(
    @Headers('authorization') authHeader: string,
    @Param('uid') uid: string,
  ) {
    const token = authHeader?.split(' ')[1];

    if (typeof uid === 'string') {
      const result = await this.environmentService.getSpecializationHierarchy(
        +uid,
        token,
      );
      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadSpecialization/:uid')
  async loadSpecialization(
    @Headers('authorization') authHeader: string,
    @Param('uid') uid: string,
  ) {
    const token = authHeader?.split(' ')[1];

    if (typeof uid === 'string') {
      const result = await this.environmentService.getSpecializationFactByUID(
        +uid,
        token,
      );
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadClassified/:uid')
  async loadClassified(
    @Headers('authorization') authHeader: string,
    @Param('uid') uid: string,
  ) {
    const token = authHeader?.split(' ')[1];

    if (typeof uid === 'string') {
      const result = await this.environmentService.getClassified(+uid, token);
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadClassification/:uid')
  async loadClassification(
    @Headers('authorization') authHeader: string,
    @Param('uid') uid: string,
  ) {
    const token = authHeader?.split(' ')[1];

    if (typeof uid === 'string') {
      const result = await this.environmentService.getClassificationFactByUID(
        +uid,
        token,
      );
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadAllRelatedFacts/:uid')
  async loadAllRelatedFacts(
    @Headers('authorization') authHeader: string,
    @Param('uid') uid: string,
  ) {
    const token = authHeader?.split(' ')[1];

    if (typeof uid === 'string') {
      const result = await this.environmentService.loadAllRelatedFacts(
        +uid,
        token,
      );
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('listSubtypes/:uid')
  async listSubtypes(
    @Headers('authorization') authHeader: string,
    @Param('uid') uid: string,
  ) {
    const token = authHeader?.split(' ')[1];

    console.log('listSubtypes', uid);
    if (!isNaN(Number(uid))) {
      const result = await this.environmentService.listSubtypes(+uid, token);
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }
}
