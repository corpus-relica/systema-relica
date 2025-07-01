import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { ModelService } from "./model.service";
import { User } from "../shared/decorators/user.decorator";

@ApiTags("Model")
// @Controller('model')
@Controller("model")
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get()
  @ApiOperation({ summary: "Retrieve model information" })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: "Model information retrieved successfully",
  })
  async getModel(@User() user: any, @Query("uid") uid: number) {
    try {
      console.log("Retrieving model information for user:", user, uid);
      const model = await this.modelService.getModel(uid);

      return {
        success: true,
        model,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to retrieve model",
      };
    }
  }

  @Get("kind")
  @ApiOperation({ summary: "Retrieve kind model information" })
  @ApiBearerAuth()
  @ApiQuery({ name: "uid", description: "UID of the kind", required: true })
  @ApiResponse({
    status: 200,
    description: "Kind model retrieved successfully",
  })
  async getKindModel(@User() user: any, @Query("uid") uid: number) {
    try {
      if (!uid) {
        throw new BadRequestException("uid parameter is required");
      }

      const kind = await this.modelService.getKindModel(uid);

      return {
        success: true,
        kind,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Kind not found",
      };
    }
  }

  @Get("individual")
  @ApiOperation({ summary: "Retrieve individual model information" })
  @ApiBearerAuth()
  @ApiQuery({
    name: "uid",
    description: "UID of the individual",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Individual model retrieved successfully",
  })
  async getIndividualModel(@User() user: any, @Query("uid") uid: string) {
    try {
      if (!uid) {
        throw new BadRequestException("uid parameter is required");
      }

      console.log("Retrieving individual model for user:", user, uid);
      const individual = await this.modelService.getIndividualModel(uid);
      console.log("Individual model retrieved:", individual);

      return {
        success: true,
        individual,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Individual not found",
      };
    }
  }
}
