import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  UserResponseDto,
  UserUpdateRequestDto,
  UserUsernameParamDto,
} from './dto/user.dto';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger/dist/decorators';
import { JWTAuthGuard } from '../../common/guards/jwt-auth.guard';
import { COOKIES_ACCESS_TOKEN_KEY } from '../../utils/constants';
import { Request } from 'express';
import { UserResponseSchema } from '@family-tree/shared';
import { ZodSerializerDto } from 'nestjs-zod';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Find user themselves
  @Get('me')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserResponseDto })
  @ZodSerializerDto(UserResponseSchema)
  async getUserThemselves(@Req() req: Request): Promise<UserResponseDto> {
    return this.userService.getUserThemselves(req.user!.id);
  }

  // Find exactly one user by its username (instead of mock user, users may connect real users)
  @Get(':username')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @ApiParam({ name: 'username', required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserResponseDto })
  @ZodSerializerDto(UserResponseSchema)
  async getUserByUsername(
    @Param() param: UserUsernameParamDto
  ): Promise<UserResponseDto> {
    return this.userService.getUserByUsername(param.username);
  }

  // Update user themselves info
  @Put()
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  updateUser(
    @Req() req: Request,
    @Body() body: UserUpdateRequestDto
  ): Promise<void> {
    return this.userService.updateUser(req.user!.id, body); // FIXME: instead of using '!' every time I should think something else
  }
}
