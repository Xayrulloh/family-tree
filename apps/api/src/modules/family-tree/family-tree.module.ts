import { Module } from '@nestjs/common';
import { FamilyTreeService } from './family-tree.service';
import { FamilyTreeController } from './family-tree.controller';
import { DrizzleModule } from '../../database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [FamilyTreeController],
  providers: [FamilyTreeService],
})
export class FamilyTreeModule {}
