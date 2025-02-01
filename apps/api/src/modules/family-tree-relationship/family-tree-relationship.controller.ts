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
import {
  FamilyTreeRelationshipCreateRequestDto,
  FamilyTreeRelationshipCreateSonOrDaughterRequestDto,
  FamilyTreeRelationshipFamilyTreeIdAndUserIdParamDto,
  FamilyTreeRelationshipFamilyTreeIdParamDto,
  FamilyTreeRelationshipResponseDto,
  FamilyTreeRelationshipUpdateRequestDto,
  FamilyTreeRelationshipUserArrayResponseDto,
  FamilyTreeRelationshipUserResponseDto,
} from './dto/family-tree-relationship.dto';
import {
  FamilyTreeRelationshipResponseSchema,
  FamilyTreeRelationshipUserArrayResponseSchema,
  FamilyTreeRelationshipUserResponseSchema,
} from '@family-tree/shared';
import { FamilyTreeRelationshipService } from './family-tree-relationship.service';
import { ZodSerializerDto } from 'nestjs-zod';

@ApiTags('Family Tree')
@Controller('family-trees')
export class FamilyTreeRelationshipController {
  constructor(
    private readonly familyTreeRelationshipService: FamilyTreeRelationshipService
  ) {}

  // Find family tree relationship by family tree uuid
  @Get(':familyTreeId/relationship')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'familyTreeId', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeRelationshipResponseDto })
  @ZodSerializerDto(FamilyTreeRelationshipResponseSchema)
  async getFamilyTreeRelationshipOfFamilyTree(
    @Param() param: FamilyTreeRelationshipFamilyTreeIdParamDto
  ): Promise<FamilyTreeRelationshipResponseDto> {
    return this.familyTreeRelationshipService.getFamilyTreeRelationshipOfFamilyTree(
      param.familyTreeId
    );
  }

  // Find user of family tree by family tree uuid and user uuid
  @Get(':familyTreeId/relationship/:userId')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'familyTreeId', required: true, type: String })
  @ApiParam({ name: 'userId', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FamilyTreeRelationshipUserResponseDto })
  @ZodSerializerDto(FamilyTreeRelationshipUserResponseSchema)
  async getFamilyTreeRelationshipUserOfFamilyTree(
    @Param() param: FamilyTreeRelationshipFamilyTreeIdAndUserIdParamDto
  ): Promise<FamilyTreeRelationshipUserResponseDto> {
    return this.familyTreeRelationshipService.getFamilyTreeRelationshipUserOfFamilyTree(
      param.familyTreeId,
      param.userId
    );
  }

  // Create parent for target user
  @Post(':familyTreeId/relationship/parent')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'familyTreeId', required: true, type: String })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FamilyTreeRelationshipUserArrayResponseDto })
  @ZodSerializerDto(FamilyTreeRelationshipUserArrayResponseSchema)
  async createFamilyTreeRelationshipUserParentOfFamilyTree(
    @Param() param: FamilyTreeRelationshipFamilyTreeIdParamDto,
    @Body() body: FamilyTreeRelationshipCreateRequestDto
  ): Promise<FamilyTreeRelationshipUserArrayResponseDto> {
    return this.familyTreeRelationshipService.createFamilyTreeRelationshipUserParentOfFamilyTree(
      param.familyTreeId,
      body
    );
  }

  // Create parent for target user
  @Post(':familyTreeId/relationship/spouse')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'familyTreeId', required: true, type: String })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FamilyTreeRelationshipUserResponseDto })
  @ZodSerializerDto(FamilyTreeRelationshipUserResponseSchema)
  async createFamilyTreeRelationshipUserSpouseOfFamilyTree(
    @Param() param: FamilyTreeRelationshipFamilyTreeIdParamDto,
    @Body() body: FamilyTreeRelationshipCreateRequestDto
  ): Promise<FamilyTreeRelationshipUserResponseDto> {
    return this.familyTreeRelationshipService.createFamilyTreeRelationshipUserSpouseOfFamilyTree(
      param.familyTreeId,
      body
    );
  }

  // Create parent for target user
  @Post(':familyTreeId/relationship/daughter')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'familyTreeId', required: true, type: String })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FamilyTreeRelationshipUserResponseDto })
  @ZodSerializerDto(FamilyTreeRelationshipUserResponseSchema)
  async createFamilyTreeRelationshipUserDaughterOfFamilyTree(
    @Param() param: FamilyTreeRelationshipFamilyTreeIdParamDto,
    @Body() body: FamilyTreeRelationshipCreateSonOrDaughterRequestDto
  ): Promise<FamilyTreeRelationshipUserResponseDto> {
    return this.familyTreeRelationshipService.createFamilyTreeRelationshipUserDaughterOfFamilyTree(
      param.familyTreeId,
      body
    );
  }

  // Create parent for target user
  @Post(':familyTreeId/relationship/son')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'familyTreeId', required: true, type: String })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FamilyTreeRelationshipUserResponseDto })
  @ZodSerializerDto(FamilyTreeRelationshipUserResponseSchema)
  async createFamilyTreeRelationshipUserSonOfFamilyTree(
    @Param() param: FamilyTreeRelationshipFamilyTreeIdParamDto,
    @Body() body: FamilyTreeRelationshipCreateSonOrDaughterRequestDto
  ): Promise<FamilyTreeRelationshipUserResponseDto> {
    return this.familyTreeRelationshipService.createFamilyTreeRelationshipUserSonOfFamilyTree(
      param.familyTreeId,
      body
    );
  }

  // Update family tree relationship user of family tree
  @Put(':familyTreeId/relationship/:userId')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'familyTreeId', required: true, type: String })
  @ApiParam({ name: 'userId', required: true, type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async updateFamilyTreeRelationshipUserOfFamilyTree(
    @Param() param: FamilyTreeRelationshipFamilyTreeIdAndUserIdParamDto,
    @Body() body: FamilyTreeRelationshipUpdateRequestDto
  ): Promise<void> {
    return this.familyTreeRelationshipService.updateFamilyTreeRelationshipUserOfFamilyTree(
      param.familyTreeId,
      param.userId,
      body
    );
  }

  // Delete family tree relationship user of family tree
  @Delete(':familyTreeId/relationship/:userId')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'familyTreeId', required: true, type: String })
  @ApiParam({ name: 'userId', required: true, type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async deleteFamilyTreeRelationshipUserOfFamilyTree(
    @Param() param: FamilyTreeRelationshipFamilyTreeIdAndUserIdParamDto
  ): Promise<void> {
    return this.familyTreeRelationshipService.deleteFamilyTreeRelationshipUserOfFamilyTree(
      param.familyTreeId,
      param.userId
    );
  }
}
