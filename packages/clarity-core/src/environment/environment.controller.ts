import {
  Controller,
  Get,
  Query,
  Inject,
  Param,
  Logger,
  Res,
  HttpException,
} from '@nestjs/common';
import { EnvironmentService } from './environment.service';

@Controller('environment')
export class EnvironmentController {
  private readonly logger = new Logger(EnvironmentController.name);

  constructor(private readonly environmentService: EnvironmentService) {}

  @Get('/retrieve')
  async retrieve(
    @Query('envID') envID: string,
    // @Res({ passthrough: true }) res: Response,
  ) {
    // const { envID } = req.query;
    this.logger.log('~~~~~~~~~~~~RETRIEVE~~~~~~~~~~~~');
    this.logger.log(envID);

    try {
      const result = await this.environmentService.retrieveEnvironment(envID);
      return result;
    } catch (e) {
      console.log(e);
      throw new HttpException('Error retrieving environment', 500);
    }
  }

  @Get('/loadEntity')
  async loadEntity(@Param('uid') uid: string) {
    // Extract 'uid' from the request parameters and ensure it's a string
    if (typeof uid === 'string') {
      // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
      const result = await this.loadEntity(uid);
      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('/textSearch')
  async textSearch(@Param('searchTerm') searchTerm: string) {
    // Extract 'searchTerm' from the request parameters and ensure it's a string
    if (typeof searchTerm === 'string') {
      // Now 'searchTerm' is guaranteed to be a string, so we can safely use parseInt
      const result = await this.environmentService.textSearch(searchTerm);
      return result;
    } else {
      // Handle the case where 'searchTerm' is not a string
      throw new HttpException('Invalid search term', 400);
    }
  }

  @Get('/specializeKind')
  async specializeKind(
    @Param('uid') uid: string,
    @Param('supertypeName') supertypeName: string,
    @Param('name') name: string,
  ) {
    if (typeof uid === 'string') {
      // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
      const result = await this.specializeKind(uid, supertypeName, name);
      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('/classifyEntity')
  async classifyEntity(
    @Param('uid') uid: string,
    @Param('name') name: string,
    @Param('typeName') typeName: string,
  ) {
    // Extract 'uid' from the request parameters and ensure it's a string
    if (typeof uid === 'string') {
      // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
      const result = await this.environmentService.classifyIndividual(
        parseInt(uid),
        typeName,
        name,
      );
      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadSpecializationHierarchy')
  async loadSpecializationHierarchy(@Param('uid') uid: string) {
    // Extract 'uid' from the request parameters and ensure it's a string
    if (typeof uid === 'string') {
      // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
      const result = await this.environmentService.getSpecializationHierarchy(
        parseInt(uid),
      );
      return result;
    } else {
      // Handle the case where 'uid' is not a string
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadSpecialization/:uid')
  async loadSpecialization(@Param('uid') uid: string) {
    if (typeof uid === 'string') {
      const result = await this.environmentService.getSpecializationFactByUID(
        parseInt(uid),
      );
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadClassified')
  async loadClassified(@Param('uid') uid: string) {
    if (typeof uid === 'string') {
      const result = await this.environmentService.getClassified(parseInt(uid));
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadClassification')
  async loadClassification(@Param('uid') uid: string) {
    if (typeof uid === 'string') {
      const result = await this.environmentService.getClassificationFactByUID(
        parseInt(uid),
      );
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }

  @Get('loadAllRelatedFacts')
  async loadAllRelatedFacts(@Param('uid') uid: string) {
    // if (typeof uid === 'string') {
    //   const result = await this.environmentService.getAllRelatedFacts(parseInt(uid));
    //   res.json(result);
    // } else {
    //   res.status(400).send('Invalid UID');
    // }
  }

  @Get('listSubtypes/:uid') // Add :uid to the route
  async listSubtypes(@Param('uid') uid: string) {
    console.log('listSubtypes', uid);
    if (!isNaN(Number(uid))) {
      const result = await this.environmentService.listSubtypes(parseInt(uid));
      return result;
    } else {
      throw new HttpException('Invalid UID', 400);
    }
  }
}
