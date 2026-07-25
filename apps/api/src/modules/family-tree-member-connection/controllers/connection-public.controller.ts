import { FamilyTreeMemberConnectionGetAllResponseSchema } from '@family-tree/shared';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { PublicGuard } from '~/common/guards/public.guard';
import { FamilyTreeCacheInterceptor } from '~/common/interceptors/family-tree.cache.interceptor';
import {
  FamilyTreeMemberConnectionGetAllParamDto,
  FamilyTreeMemberConnectionGetAllResponseDto,
  FamilyTreeMemberConnectionGetByMemberParamDto,
} from '../dto/family-tree-member-connection.dto';
import { FamilyTreeMemberConnectionService } from '../services/family-tree-member-connection.service';

@ApiTags('Family Tree Member Connection (public)')
@Controller('family-trees/public/:familyTreeId/members')
@UseGuards(PublicGuard)
@UseInterceptors(FamilyTreeCacheInterceptor)
export class FamilyTreeMemberConnectionPublicController {
  constructor(
    private readonly familyTreeMemberConnectionService: FamilyTreeMemberConnectionService,
  ) {}

  @Get('connections')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeMemberConnectionGetAllResponseDto })
  @ZodSerializerDto(FamilyTreeMemberConnectionGetAllResponseSchema)
  async getAllFamilyTreeMemberConnections(
    @Param() param: FamilyTreeMemberConnectionGetAllParamDto,
  ): Promise<FamilyTreeMemberConnectionGetAllResponseDto> {
    return this.familyTreeMemberConnectionService.getAllFamilyTreeMemberConnections(
      param,
    );
  }

  @Get(':memberUserId/connections')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeMemberConnectionGetAllResponseDto })
  @ZodSerializerDto(FamilyTreeMemberConnectionGetAllResponseSchema)
  async getFamilyTreeMemberConnections(
    @Param() param: FamilyTreeMemberConnectionGetByMemberParamDto,
  ): Promise<FamilyTreeMemberConnectionGetAllResponseDto> {
    return this.familyTreeMemberConnectionService.getFamilyTreeMemberConnections(
      param,
    );
  }
}
