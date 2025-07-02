import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { EnvironmentService } from "./environment.service";
import { User } from "../shared/decorators/user.decorator";

@ApiTags("Environment")
@Controller("environment")
export class EnvironmentController {
  constructor(private readonly environmentService: EnvironmentService) {}

  @Get("retrieve")
  @ApiOperation({ summary: "Retrieve environment information" })
  @ApiBearerAuth()
  @ApiQuery({
    name: "uid",
    description: "UID of the environment",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Environment retrieved successfully",
  })
  async retrieveEnvironment(
    @User() user: any,
    @Query("userId") userId: number
  ) {
    try {
      if (!userId) {
        throw new BadRequestException("uid parameter is required");
      }

      const result = await this.environmentService.getEnvironment(
        userId.toString()
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || "Environment not found",
      };
    }
  }
}
