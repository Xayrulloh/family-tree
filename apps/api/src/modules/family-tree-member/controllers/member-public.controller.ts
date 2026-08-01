import {
  FamilyTreeMemberGetAllResponseSchema,
  FamilyTreeMemberGetResponseSchema,
} from '@family-tree/shared';
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
  FamilyTreeMemberGetAllParamDto,
  FamilyTreeMemberGetAllResponseDto,
  FamilyTreeMemberGetParamDto,
  FamilyTreeMemberGetResponseDto,
} from '../dto/family-tree-member.dto';
import { FamilyTreeMemberService } from '../services/family-tree-member.service';

@ApiTags('Family Tree Member (public)')
@Controller('family-trees/public/:familyTreeId/members')
@UseGuards(PublicGuard)
@UseInterceptors(FamilyTreeCacheInterceptor)
export class FamilyTreeMemberPublicController {
  constructor(
    private readonly familyTreeMemberService: FamilyTreeMemberService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeMemberGetAllResponseDto })
  @ZodSerializerDto(FamilyTreeMemberGetAllResponseSchema)
  async getAllFamilyTreeMembers(
    @Param() param: FamilyTreeMemberGetAllParamDto,
  ): Promise<FamilyTreeMemberGetAllResponseDto> {
    return this.familyTreeMemberService.getAllFamilyTreeMembers(param);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeMemberGetResponseDto })
  @ZodSerializerDto(FamilyTreeMemberGetResponseSchema)
  async getFamilyTreeMember(
    @Param() param: FamilyTreeMemberGetParamDto,
  ): Promise<FamilyTreeMemberGetResponseDto> {
    return this.familyTreeMemberService.getFamilyTreeMember(param);
  }
}
