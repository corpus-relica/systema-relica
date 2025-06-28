import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { FactsService } from "./facts.service";
import { User } from "../shared/decorators/user.decorator";

@ApiTags("Facts")
@Controller("fact")
export class FactsController {
  constructor(private readonly factsService: FactsService) {}

  @Get("classified")
  @ApiOperation({ summary: "Get classification facts for an entity" })
  @ApiBearerAuth()
  @ApiQuery({ name: "uid", description: "UID of the entity", required: true })
  @ApiResponse({
    status: 200,
    description: "Classification facts retrieved successfully",
  })
  async getClassifiedFacts(@User() user: any, @Query("uid") uid: string) {
    try {
      if (!uid) {
        throw new BadRequestException("uid parameter is required");
      }

      const uidNumber = parseInt(uid, 10);
      if (isNaN(uidNumber)) {
        throw new BadRequestException("uid must be a valid number");
      }

      const facts = await this.factsService.getClassified(uidNumber);

      return {
        success: true,
        facts,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to retrieve classification facts",
      };
    }
  }

  @Get("subtypes")
  @ApiOperation({ summary: "Get subtype relationships for an entity" })
  @ApiBearerAuth()
  @ApiQuery({ name: "uid", description: "UID of the entity", required: true })
  @ApiResponse({
    status: 200,
    description: "Subtype relationships retrieved successfully",
  })
  async getSubtypes(@User() user: any, @Query("uid") uid: string) {
    try {
      if (!uid) {
        throw new BadRequestException("uid parameter is required");
      }

      const uidNumber = parseInt(uid, 10);
      if (isNaN(uidNumber)) {
        throw new BadRequestException("uid must be a valid number");
      }

      const subtypes = await this.factsService.getSubtypes(uidNumber);

      return {
        success: true,
        subtypes,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to retrieve subtype relationships",
      };
    }
  }

  @Get("subtypes-cone")
  @ApiOperation({ summary: "Get subtype cone (hierarchy) for an entity" })
  @ApiBearerAuth()
  @ApiQuery({ name: "uid", description: "UID of the entity", required: true })
  @ApiResponse({
    status: 200,
    description: "Subtype cone retrieved successfully",
  })
  async getSubtypesCone(@User() user: any, @Query("uid") uid: string) {
    try {
      if (!uid) {
        throw new BadRequestException("uid parameter is required");
      }

      const uidNumber = parseInt(uid, 10);
      if (isNaN(uidNumber)) {
        throw new BadRequestException("uid must be a valid number");
      }

      const cone = await this.factsService.getSubtypesCone(uidNumber);

      return {
        success: true,
        cone,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to retrieve subtype cone",
      };
    }
  }
}
