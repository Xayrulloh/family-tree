import {
  FamilyTreeSharedPaginationResponseSchema,
  FamilyTreeSharedResponseSchema,
  FamilyTreeSharedUsersPaginationResponseSchema,
} from '@family-tree/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { JWTAuthGuard } from '~/common/guards/jwt-auth.guard';
import { OwnerGuard } from '~/common/guards/owner.guard';
import type { AuthenticatedRequest } from '~/shared/types/request-with-user';
import { COOKIES_ACCESS_TOKEN_KEY } from '~/utils/constants';
import {
  FamilyTreeSharedIdParamDto,
  FamilyTreeSharedPaginationAndSearchQueryDto,
  FamilyTreeSharedPaginationResponseDto,
  FamilyTreeSharedResponseDto,
  FamilyTreeSharedUpdateParamDto,
  FamilyTreeSharedUpdateRequestDto,
  FamilyTreeSharedUsersPaginationResponseDto,
} from '../dto/shared-family-tree.dto';
import { FamilyTreeSharedService } from '../services/shared-family-tree.service';

@ApiTags('Family Tree (shared)')
@ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
@Controller('family-trees/shared')
@UseGuards(JWTAuthGuard)
export class FamilyTreeSharedController {
  constructor(
    private readonly familyTreeSharedService: FamilyTreeSharedService,
  ) {}

  // List trees shared with me
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeSharedPaginationResponseDto })
  @ZodSerializerDto(FamilyTreeSharedPaginationResponseSchema)
  async getSharedFamilyTrees(
    @Req() req: AuthenticatedRequest,
    @Query() query: FamilyTreeSharedPaginationAndSearchQueryDto,
  ): Promise<FamilyTreeSharedPaginationResponseDto> {
    return this.familyTreeSharedService.getSharedFamilyTrees(
      req.user.id,
      query,
    );
  }

  // Get single shared tree record (RBAC flags + tree metadata)
  @Get(':familyTreeId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeSharedResponseDto })
  @ZodSerializerDto(FamilyTreeSharedResponseSchema)
  async getSharedFamilyTreeById(
    @Req() req: AuthenticatedRequest,
    @Param() param: FamilyTreeSharedIdParamDto,
  ): Promise<FamilyTreeSharedResponseDto> {
    return this.familyTreeSharedService.getSharedFamilyTreeById(
      req.user.id,
      param.familyTreeId,
    );
  }

  // Users who have access to a tree (owner-only)
  @Get(':familyTreeId/users')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeSharedUsersPaginationResponseDto })
  @ZodSerializerDto(FamilyTreeSharedUsersPaginationResponseSchema)
  async getSharedFamilyTreeUsersById(
    @Req() req: AuthenticatedRequest,
    @Param() param: FamilyTreeSharedIdParamDto,
    @Query() query: FamilyTreeSharedPaginationAndSearchQueryDto,
  ): Promise<FamilyTreeSharedUsersPaginationResponseDto> {
    return this.familyTreeSharedService.getSharedFamilyTreeUsersById(
      req.user.id,
      param.familyTreeId,
      query,
    );
  }

  // Update RBAC for a shared user — owner only
  @Put(':familyTreeId/users/:userId')
  @UseGuards(OwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async updateSharedFamilyTreeById(
    @Param() param: FamilyTreeSharedUpdateParamDto,
    @Body() body: FamilyTreeSharedUpdateRequestDto,
  ): Promise<void> {
    return this.familyTreeSharedService.updateSharedFamilyTreeById(
      param.userId,
      param.familyTreeId,
      body,
    );
  }
}
