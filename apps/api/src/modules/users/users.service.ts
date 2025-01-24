import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  findAll() {
    return `This action returns all users`;
  }
}
