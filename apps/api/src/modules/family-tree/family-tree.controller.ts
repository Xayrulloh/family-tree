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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger/dist/decorators';
import { JWTAuthGuard } from '../../common/guards/jwt-auth.guard';
import { COOKIES_ACCESS_TOKEN_KEY } from '../../utils/constants';
import { Request } from 'express';
import {
  FamilyTreeArrayResponseDto,
  FamilyTreeCreateRequestDto,
  FamilyTreeIdParamDto,
  FamilyTreeNameParamDto,
  FamilyTreeResponseDto,
  FamilyTreeUpdateRequestDto,
} from './dto/family-tree.dto';
import { FamilyTreeService } from './family-tree.service';
import {
  FamilyTreeArrayResponseSchema,
  FamilyTreeResponseSchema,
} from '@family-tree/shared';
import { FamilyTreeRelationshipService } from '../family-tree-relationship/family-tree-relationship.service';
import { ZodSerializerDto } from 'nestjs-zod';

@ApiTags('Family Tree')
@Controller('family-trees')
export class FamilyTreeController {
  constructor(private readonly familyTreeService: FamilyTreeService, private readonly familyTreeRelationshipService: FamilyTreeRelationshipService) {}

  // Find family trees of user
  @Get()
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeArrayResponseDto })
  @ZodSerializerDto(FamilyTreeArrayResponseSchema)
  async getFamilyTreesOfUser(
    @Req() req: Request
  ): Promise<FamilyTreeArrayResponseDto> {
    return this.familyTreeService.getFamilyTreesOfUser(req.user!.id);
  }

  // Find family trees by name (only public [visibility = true]) only 10 of them (name length must be at least 3)
  @Get('public/:name')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'name', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeArrayResponseDto })
  @ZodSerializerDto(FamilyTreeArrayResponseSchema)
  async getFamilyTreesByName(
    @Param() param: FamilyTreeNameParamDto
  ): Promise<FamilyTreeArrayResponseDto> {
    return this.familyTreeService.getFamilyTreesByName(param.name);
  }

  // Find family tree by id
  @Get(':id')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'id', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeResponseDto })
  @ZodSerializerDto(FamilyTreeResponseSchema)
  async getFamilyTreeById(
    @Param() param: FamilyTreeIdParamDto
  ): Promise<FamilyTreeResponseDto> {
    return this.familyTreeService.getFamilyTreeById(param.id);
  }

  // Create family tree for user
  @Post()
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FamilyTreeResponseDto })
  @ZodSerializerDto(FamilyTreeResponseSchema)
  async createFamilyTree(
    @Req() req: Request,
    @Body() body: FamilyTreeCreateRequestDto
  ): Promise<FamilyTreeResponseDto> {
    const familyTree = await this.familyTreeService.createFamilyTree(req.user!.id, body);

    // creating default parent
    await this.familyTreeRelationshipService.createFamilyTreeRelationshipUserParentOfFamilyTree(
      familyTree.id, {targetUserId: ''})

    return familyTree;
  }

  // Update family tree by id
  @Put(':id')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'id', required: true, type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async updateFamilyTree(
    @Req() req: Request,
    @Param() param: FamilyTreeIdParamDto,
    @Body() body: FamilyTreeUpdateRequestDto
  ): Promise<void> {
    return this.familyTreeService.updateFamilyTree(
      req.user!.id,
      param.id,
      body
    );
  }

  // Delete family tree by id
  @Delete(':id')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'id', required: true, type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async deleteFamilyTree(
    @Req() req: Request,
    @Param() param: FamilyTreeIdParamDto
  ): Promise<void> {
    return this.familyTreeService.deleteFamilyTree(req.user!.id, param.id);
  }
}
