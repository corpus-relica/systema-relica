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
  async loadEntity() {
    // // Extract 'uid' from the request parameters and ensure it's a string
    // const uid = req.params.uid;
    // if (typeof uid === 'string') {
    //   // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
    //   const result = await loadEntity(parseInt(uid));
    //   res.json(result);
    // } else {
    //   // Handle the case where 'uid' is not a string
    //   res.status(400).send('Invalid UID');
    // }
  }

  @Get('/textSearch')
  async textSearch() {
    // // Extract 'searchTerm' from the request parameters and ensure it's a string
    // const searchTerm = req.params.searchTerm;
    // if (typeof searchTerm === "string") {
    //   // Now 'searchTerm' is guaranteed to be a string, so we can safely use parseInt
    //   const result = await textSearch(searchTerm);
    //   res.json(result);
    // } else {
    //   // Handle the case where 'searchTerm' is not a string
    //   res.status(400).send("Invalid search term");
    // }
  }

  @Get('/specializeKind')
  async specializeKind() {
    // // Extract 'uid' from the request parameters and ensure it's a string
    // const uid = req.params.uid;
    // const supertypeName = req.params.supertypeName;
    // const name = req.params.name;
    // if (typeof uid === "string") {
    //   // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
    //   const result = await specializeKind(parseInt(uid), supertypeName, name);
    //   res.json(result);
    // } else {
    //   // Handle the case where 'uid' is not a string
    //   res.status(400).send("Invalid UID");
    // }
  }

  @Get('/classifyEntity')
  async classifyEntity() {
    // // Extract 'uid' from the request parameters and ensure it's a string
    // const uid = req.params.uid;
    // const typeName = req.params.typeName;
    // const name = req.params.name;
    // if (typeof uid === "string") {
    //   // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
    //   const result = await classifyIndividual(parseInt(uid), typeName, name);
    //   res.json(result);
    // } else {
    //   // Handle the case where 'uid' is not a string
    //   res.status(400).send("Invalid UID");
    // }
  }

  @Get('loadSpecializationHierarchy')
  async loadSpecializationHierarchy() {
    // // Extract 'uid' from the request parameters and ensure it's a string
    // const uid = req.params.uid;
    // if (typeof uid === 'string') {
    //   // Now 'uid' is guaranteed to be a string, so we can safely use parseInt
    //   const result = await getSpecializationHierarchy(parseInt(uid));
    //   res.json(result);
    // } else {
    //   // Handle the case where 'uid' is not a string
    //   res.status(400).send('Invalid UID');
    // }
  }

  @Get('loadSpecialization')
  async loadSpecialization() {
    // const uid = req.params.uid;
    // if (typeof uid === "string") {
    //   const result = await getSpecializationFactByUID(parseInt(uid));
    //   res.json(result);
    // } else {
    //   res.status(400).send("Invalid UID");
    // }
  }

  @Get('loadClassified')
  async loadClassified() {
    // const uid = req.params.uid;
    // if (typeof uid === "string") {
    //   const result = await getClassified(parseInt(uid));
    //   res.json(result);
    // } else {
    //   res.status(400).send("Invalid UID");
    // }
  }

  @Get('loadClassification')
  async loadClassification() {
    // const uid = req.params.uid;
    // if (typeof uid === "string") {
    //   const result = await getClassificationFactByUID(parseInt(uid));
    //   res.json(result);
    // } else {
    //   res.status(400).send("Invalid UID");
    // }
  }

  @Get('loadAllRelatedFacts')
  async loadAllRelatedFacts() {
    // const uid = req.params.uid;
    // if (typeof uid === "string") {
    //   const result = await getAllRelatedFacts(parseInt(uid));
    //   res.json(result);
    // } else {
    //   res.status(400).send("Invalid UID");
    // }
  }

  @Get('listSubtypes')
  async listSubtypes() {
    // const uid = req.params.uid;
    // if (typeof uid === "string") {
    //   const result = await listSubtypes(parseInt(uid));
    //   res.json(result);
    // } else {
    //   res.status(400).send("Invalid UID");
    // }
  }
}
