import { Body, Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { FCMTokenService } from './fcm-token.service';
import { FCMTokenCreateDeleteRequestDto, FCMTokenResponseDto } from './dto/fcm-token.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger/dist/decorators';

@ApiTags('FCM Token')
@Controller('fcm-token')
export class FCMTokenController {
  constructor(private readonly fcmTokenService: FCMTokenService) {}

  @Post()
  // @UseGuards(GoogleOauthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FCMTokenResponseDto })
  @ZodSerializerDto(FCMTokenResponseDto)
  post(@Body() body: FCMTokenCreateDeleteRequestDto): Promise<FCMTokenResponseDto> {
    return this.fcmTokenService.create(body);
  }

  @Delete()
  // @UseGuards(GoogleOauthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Body() body: FCMTokenCreateDeleteRequestDto): Promise<void> {
    return this.fcmTokenService.delete(body);
  }
}
