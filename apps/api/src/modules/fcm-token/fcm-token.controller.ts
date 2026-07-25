import { FCMTokenResponseSchema } from '@family-tree/shared';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { JWTAuthGuard } from '~/common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '~/shared/types/request-with-user';
import { COOKIES_ACCESS_TOKEN_KEY } from '~/utils/constants';
import {
  FCMTokenCreateDeleteRequestDto,
  FCMTokenResponseDto,
} from './dto/fcm-token.dto';
import { FCMTokenService } from './fcm-token.service';

@ApiTags('FCM Token')
@Controller('fcm-tokens')
export class FCMTokenController {
  constructor(private readonly fcmTokenService: FCMTokenService) {}

  // Client side sends FCM token in order to send push notifications
  @Post()
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FCMTokenResponseDto })
  @ZodSerializerDto(FCMTokenResponseSchema)
  createFcmToken(
    @Req() req: AuthenticatedRequest,
    @Body() body: FCMTokenCreateDeleteRequestDto,
  ): Promise<FCMTokenResponseDto> {
    return this.fcmTokenService.createFcmToken(req.user.id, body);
  }

  // Client may send unused FCM token in order to delete it
  @Delete()
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  deleteFcmToken(
    @Req() req: AuthenticatedRequest,
    @Body() body: FCMTokenCreateDeleteRequestDto,
  ): Promise<void> {
    return this.fcmTokenService.deleteFcmToken(req.user.id, body);
  }
}
