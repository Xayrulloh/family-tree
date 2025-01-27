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
import { FCMTokenService } from './fcm-token.service';
import {
  FCMTokenCreateDeleteRequestDto,
  FCMTokenResponseDto,
} from './dto/fcm-token.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiTags,
} from '@nestjs/swagger/dist/decorators';
import { JWTAuthGuard } from '../../common/guards/jwt-auth.guard';
import { COOKIES_ACCESS_TOKEN_KEY } from '../../utils/constants';
import { Request } from 'express';

@ApiTags('FCM Token')
@Controller('fcm-token')
export class FCMTokenController {
  constructor(private readonly fcmTokenService: FCMTokenService) {}

  // Client side sends FCM token in order to send push notifications
  @Post()
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FCMTokenResponseDto })
  @ZodSerializerDto(FCMTokenResponseDto)
  createFcmToken(
    @Req() req: Request,
    @Body() body: FCMTokenCreateDeleteRequestDto
  ): Promise<FCMTokenResponseDto> {
    return this.fcmTokenService.createFcmToken(req.user!.id, body);
  }

  // Client may send unused FCM token in order to delete it
  @Delete()
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  deleteFcmToken(
    @Req() req: Request,
    @Body() body: FCMTokenCreateDeleteRequestDto
  ): Promise<void> {
    return this.fcmTokenService.deleteFcmToken(req.user!.id, body);
  }
}
