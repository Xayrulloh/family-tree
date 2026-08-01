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
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { JWTAuthGuard } from '~/common/guards/jwt-auth.guard';
import { SharedAccessGuard } from '~/common/guards/shared-access.guard';
import { FamilyTreeCacheInterceptor } from '~/common/interceptors/family-tree.cache.interceptor';
import { COOKIES_ACCESS_TOKEN_KEY } from '~/utils/constants';
import {
  FamilyTreeMemberConnectionGetAllParamDto,
  FamilyTreeMemberConnectionGetAllResponseDto,
  FamilyTreeMemberConnectionGetByMemberParamDto,
} from '../dto/family-tree-member-connection.dto';
import { FamilyTreeMemberConnectionService } from '../services/family-tree-member-connection.service';

@ApiTags('Family Tree Member Connection (shared)')
@ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
@Controller('family-trees/shared/:familyTreeId/members')
@UseGuards(JWTAuthGuard, SharedAccessGuard)
@UseInterceptors(FamilyTreeCacheInterceptor)
export class FamilyTreeMemberConnectionSharedController {
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
