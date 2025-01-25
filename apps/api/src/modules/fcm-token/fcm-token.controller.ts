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
import { ApiCookieAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger/dist/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { COOKIES_ACCESS_TOKEN_KEY } from '../../utils/constants';
import { Request } from 'express';

@ApiTags('FCM Token')
@Controller('fcm-token')
export class FCMTokenController {
  constructor(private readonly fcmTokenService: FCMTokenService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FCMTokenResponseDto })
  @ZodSerializerDto(FCMTokenResponseDto)
  post(
    @Req() req: Request,
    @Body() body: FCMTokenCreateDeleteRequestDto,
  ): Promise<FCMTokenResponseDto> {
    return this.fcmTokenService.create(req.user!.id, body);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Req() req: Request,
    @Body() body: FCMTokenCreateDeleteRequestDto): Promise<void> {
    return this.fcmTokenService.delete(req.user!.id, body);
  }
}
