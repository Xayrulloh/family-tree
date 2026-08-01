import {
  FamilyTreePaginationResponseSchema,
  FamilyTreeResponseSchema,
} from '@family-tree/shared';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { PublicGuard } from '~/common/guards/public.guard';
import { FamilyTreeCacheInterceptor } from '~/common/interceptors/family-tree.cache.interceptor';
import {
  FamilyTreeIdParamDto,
  FamilyTreePaginationAndSearchQueryDto,
  FamilyTreePaginationResponseDto,
  FamilyTreeResponseDto,
} from '../dto/family-tree.dto';
import { FamilyTreeService } from '../services/family-tree.service';

@ApiTags('Family Tree (public)')
@Controller('family-trees/public')
@UseInterceptors(FamilyTreeCacheInterceptor)
export class FamilyTreePublicController {
  private readonly logger = new Logger(FamilyTreePublicController.name);

  constructor(private readonly familyTreeService: FamilyTreeService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreePaginationResponseDto })
  @ZodSerializerDto(FamilyTreePaginationResponseSchema)
  async getPublicFamilyTrees(
    @Query() query: FamilyTreePaginationAndSearchQueryDto,
  ): Promise<FamilyTreePaginationResponseDto> {
    return this.familyTreeService.getPublicFamilyTrees(query);
  }

  @Get(':id')
  @UseGuards(PublicGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeResponseDto })
  @ZodSerializerDto(FamilyTreeResponseSchema)
  async getPublicFamilyTreeById(
    @Param() param: FamilyTreeIdParamDto,
  ): Promise<FamilyTreeResponseDto> {
    this.familyTreeService
      .incrementPublicFamilyTreeVisitCount(param.id)
      .catch((err: unknown) =>
        // `error` (not `warn`) so the stack is formatted: a silent failure here
        // stalls the public ranking with no other symptom.
        this.logger.error(
          `Visit count increment failed for tree ${param.id}`,
          err instanceof Error ? err.stack : String(err),
        ),
      );

    return this.familyTreeService.getFamilyTreeById(param.id);
  }
}
