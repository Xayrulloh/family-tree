import { NotificationResponseSchema } from '@family-tree/shared';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';
import { JWTAuthGuard } from '~/common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '~/shared/types/request-with-user';
import { COOKIES_ACCESS_TOKEN_KEY } from '~/utils/constants';
import { NotificationResponseDto } from './dto/notification.dto';
import { NotificationService } from './notification.service';

@ApiTags('Notification')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly NotificationService: NotificationService) {}

  // Find user Notifications
  @Get()
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: NotificationResponseDto })
  @ZodSerializerDto(NotificationResponseSchema)
  async getUserNotifications(
    @Req() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    return this.NotificationService.getUserNotifications(req.user.id);
  }

  // Mark all notifications as read
  @Get('/read')
  @UseGuards(JWTAuthGuard)
  @ApiCookieAuth(COOKIES_ACCESS_TOKEN_KEY)
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: AuthenticatedRequest): Promise<void> {
    return this.NotificationService.markAllAsRead(req.user.id);
  }
}
