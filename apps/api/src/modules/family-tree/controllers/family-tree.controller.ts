import {
  FamilyTreePaginationResponseSchema,
  FamilyTreePreviewResponseSchema,
  FamilyTreeResponseSchema,
} from '@family-tree/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { JWTAuthGuard } from '~/common/guards/jwt-auth.guard';
import { OwnerGuard } from '~/common/guards/owner.guard';
import { FamilyTreeCacheInterceptor } from '~/common/interceptors/family-tree.cache.interceptor';
import type { AuthenticatedRequest } from '~/shared/types/request-with-user';
import { COOKIES_ACCESS_TOKEN_KEY } from '~/utils/constants';
import { FamilyTreeMemberService } from '../../family-tree-member/services/family-tree-member.service';
import {
  FamilyTreeCreateRequestDto,
  FamilyTreeIdParamDto,
  FamilyTreePaginationAndSearchQueryDto,
  FamilyTreePaginationResponseDto,
  FamilyTreePreviewResponseDto,
  FamilyTreeResponseDto,
  FamilyTreeUpdateRequestDto,
} from '../dto/family-tree.dto';
import { FamilyTreeService } from '../services/family-tree.service';

@ApiTags('Family Tree')
@Controller('family-trees')
@UseInterceptors(FamilyTreeCacheInterceptor)
export class FamilyTreeOwnerController {
  constructor(
    private readonly familyTreeService: FamilyTreeService,
    private readonly familyTreeMemberService: FamilyTreeMemberService,
  ) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreePaginationResponseDto })
  @ZodSerializerDto(FamilyTreePaginationResponseSchema)
  async getFamilyTreesOfUser(
    @Req() req: AuthenticatedRequest,
    @Query() query: FamilyTreePaginationAndSearchQueryDto,
  ): Promise<FamilyTreePaginationResponseDto> {
    return this.familyTreeService.getFamilyTreesOfUser(req.user.id, query);
  }

  // Public preview metadata for share-link crawlers (Telegram, OG, etc.)
  @Get(':id/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreePreviewResponseDto })
  @ZodSerializerDto(FamilyTreePreviewResponseSchema)
  async getFamilyTreePreview(
    @Param() param: FamilyTreeIdParamDto,
  ): Promise<FamilyTreePreviewResponseDto> {
    return this.familyTreeService.getFamilyTreeById(param.id);
  }

  @Get(':id')
  @UseGuards(JWTAuthGuard, OwnerGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeResponseDto })
  @ZodSerializerDto(FamilyTreeResponseSchema)
  async getFamilyTreeById(
    @Param() param: FamilyTreeIdParamDto,
  ): Promise<FamilyTreeResponseDto> {
    return this.familyTreeService.getFamilyTreeById(param.id);
  }

  @Post()
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FamilyTreeResponseDto })
  @ZodSerializerDto(FamilyTreeResponseSchema)
  async createFamilyTree(
    @Req() req: AuthenticatedRequest,
    @Body() body: FamilyTreeCreateRequestDto,
  ): Promise<FamilyTreeResponseDto> {
    const familyTree = await this.familyTreeService.createFamilyTree(
      req.user.id,
      body,
    );

    await this.familyTreeMemberService.createFamilyTreeMemberInitial(
      req.user,
      familyTree.id,
    );

    return familyTree;
  }

  @Put(':id')
  @UseGuards(JWTAuthGuard, OwnerGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async updateFamilyTree(
    @Param() param: FamilyTreeIdParamDto,
    @Body() body: FamilyTreeUpdateRequestDto,
  ): Promise<void> {
    return this.familyTreeService.updateFamilyTree(param.id, body);
  }

  @Delete(':id')
  @UseGuards(JWTAuthGuard, OwnerGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async deleteFamilyTree(@Param() param: FamilyTreeIdParamDto): Promise<void> {
    return this.familyTreeService.deleteFamilyTree(param.id);
  }
}
