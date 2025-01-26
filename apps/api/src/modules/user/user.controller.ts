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
import { UserService } from './user.service';
import {
  UserCreateRequestDto,
  UserFamilyTreeIdParamDto,
  UserGetParamDto,
  UserResponseDto,
  UserUpdateRequestDto,
  UserUsernameParamDto,
} from './dto/user.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger/dist/decorators';
import { JWTAuthGuard } from '../../common/guards/jwt-auth.guard';
import { COOKIES_ACCESS_TOKEN_KEY } from '../../utils/constants';
import { Request } from 'express';

@ApiTags('User')
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Find exactly one user by its username (instead of mock user, users may connect real users)
  @Get('users/:username')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserResponseDto })
  @ZodSerializerDto(UserResponseDto)
  async getUserByUsername(
    @Param() param: UserUsernameParamDto
  ): Promise<UserResponseDto> {
    return this.userService.getUserByUsername(param.username);
  }

  // Find user themselves
  @Get('users/me')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserResponseDto })
  @ZodSerializerDto(UserResponseDto)
  async getUserThemselves(@Req() req: Request): Promise<UserResponseDto> {
    return this.userService.getUserThemselves(req.user!.id);
  }

  // put user which is real user

  // get exactly one user by id and familyTreeId if needed
  @Get('family-trees/:familyTreeId/users/:id')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserResponseDto })
  @ZodSerializerDto(UserResponseDto)
  async getUser(@Param() param: UserGetParamDto): Promise<UserResponseDto> {
    return this.userService.getUser(param);
  }

  // create one user it may be a real or mock user and we can differentiate them by email
  @Post('family-trees/:familyTreeId/users')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: UserResponseDto })
  @ZodSerializerDto(UserResponseDto)
  createFamilyTreeUser(
    @Req() req: Request,
    @Body() body: UserCreateRequestDto,
    @Param() param: UserFamilyTreeIdParamDto
  ): Promise<UserResponseDto> {
    return this.userService.createFamilyTreeUser(
      req.user!.id,
      param.familyTreeId,
      body
    );
  }

  // // Update mock user not real one
  // @Put('family-trees/:familyTreeId/users/:id')
  // @UseGuards(JWTAuthGuard)
  // @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // updateFamilyTreeUser(
  //   @Req() req: Request,
  //   @Body() body: UserUpdateRequestDto,
  //   @Param() param: UserGetParamDto
  // ): Promise<void> {
  //   return this.userService.updateFamilyTreeUser(req.user!.id, param, body);
  // }

  // // Delete mock user not real one and all related data would be lost
  // @Delete('family-trees/:familyTreeId/users/:id')
  // @UseGuards(JWTAuthGuard)
  // @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // deleteFamilyTreeUser(
  //   @Req() req: Request,
  //   @Param() param: UserGetParamDto
  // ): Promise<void> {
  //   return this.userService.deleteFamilyTreeUser(req.user!.id, param);
  // }
}
