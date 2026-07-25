import { UserResponseSchema } from '@family-tree/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { JWTAuthGuard } from '~/common/guards/jwt-auth.guard';
import { UserCacheInterceptor } from '~/common/interceptors/user.cache.interceptor';
import type { AuthenticatedRequest } from '~/shared/types/request-with-user';
import { COOKIES_ACCESS_TOKEN_KEY } from '~/utils/constants';
import {
  UserIdParamDto,
  UserResponseDto,
  UserUpdateRequestDto,
} from './dto/user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('users')
@UseInterceptors(UserCacheInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Find user themselves
  @Get('me')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserResponseDto })
  @ZodSerializerDto(UserResponseSchema)
  async getUserThemselves(
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    return this.userService.getUserThemselves(req.user.id);
  }

  // Find exactly one user by its id
  @Get(':id')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserResponseDto })
  @ZodSerializerDto(UserResponseSchema)
  async getUserById(@Param() param: UserIdParamDto): Promise<UserResponseDto> {
    return this.userService.getUserById(param.id);
  }

  // Update user themselves info
  @Put()
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Body() body: UserUpdateRequestDto,
  ): Promise<void> {
    await this.userService.updateUser(req.user.id, body);
  }

  // Random image for user
  @Patch('/avatar')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserResponseDto })
  @ZodSerializerDto(UserResponseSchema)
  async updateUserAvatar(
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    return this.userService.updateUserAvatar(req.user.id);
  }
}
