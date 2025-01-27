import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as schema from '../../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../../database/drizzle.provider';
import { and, eq, ilike, isNull } from 'drizzle-orm';
import {
  FamilyTreeArrayResponseDto,
  FamilyTreeCreateRequestDto,
  FamilyTreeResponseDto,
  FamilyTreeUpdateRequestDto,
} from './dto/family-tree.dto';

@Injectable()
export class FamilyTreeService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>
  ) {}

  async getFamilyTreesOfUser(
    userId: string
  ): Promise<FamilyTreeArrayResponseDto> {
    return this.db
      .select()
      .from(schema.familyTreesSchema)
      .where(and(eq(schema.familyTreesSchema.createdBy, userId)));
  }

  async getFamilyTreesByName(
    name: string
  ): Promise<FamilyTreeArrayResponseDto> {
    return this.db
      .select()
      .from(schema.familyTreesSchema)
      .where(
        and(
          ilike(schema.familyTreesSchema.name, `%${name}%`),
          eq(schema.familyTreesSchema.visibility, true),
          isNull(schema.familyTreesSchema.deletedAt)
        )
      )
      .limit(10);
  }

  async getFamilyTreeById(id: string): Promise<FamilyTreeResponseDto> {
    const [familyTree] = await this.db
      .select()
      .from(schema.familyTreesSchema)
      .where(
        and(
          eq(schema.familyTreesSchema.id, id),
          isNull(schema.familyTreesSchema.deletedAt)
        )
      )
      .limit(1);

    if (!familyTree) {
      throw new NotFoundException(`Family tree with id ${id} not found`);
    }

    return familyTree;
  }

  async createFamilyTree(
    userId: string,
    body: FamilyTreeCreateRequestDto
  ): Promise<FamilyTreeResponseDto> {
    const [isFamilyTreeExist] = await this.db
      .select()
      .from(schema.familyTreesSchema)
      .where(
        and(
          eq(schema.familyTreesSchema.createdBy, userId),
          ilike(schema.familyTreesSchema.name, `%${body.name}%`)
        )
      );

    if (isFamilyTreeExist) {
      throw new BadRequestException(
        `Family tree with name ${body.name} already exist`
      );
    }

    const [familyTree] = await this.db
      .insert(schema.familyTreesSchema)
      .values({
        createdBy: userId,
        name: body.name,
        image: body.image,
        visibility: body.visibility || false,
      })
      .returning();

    return familyTree;
  }

  async updateFamilyTree(
    userId: string,
    id: string,
    body: FamilyTreeUpdateRequestDto
  ): Promise<void> {
    const [familyTree] = await this.db
      .select()
      .from(schema.familyTreesSchema)
      .where(
        and(
          eq(schema.familyTreesSchema.id, id),
          eq(schema.familyTreesSchema.createdBy, userId),
          isNull(schema.familyTreesSchema.deletedAt)
        )
      )
      .limit(1);

    if (!familyTree) {
      throw new NotFoundException(`Family tree with id ${id} not found`);
    }

    if (familyTree.image !== body.image) {
      // FIXME: must delete the old image
    }

    await this.db
      .update(schema.familyTreesSchema)
      .set({
        name: body.name,
        image: body.image,
        visibility: body.visibility || false,
      })
      .where(eq(schema.familyTreesSchema.id, id));
  }

  async deleteFamilyTree(userId: string, id: string): Promise<void> {
    const [familyTree] = await this.db
      .select()
      .from(schema.familyTreesSchema)
      .where(
        and(
          eq(schema.familyTreesSchema.id, id),
          eq(schema.familyTreesSchema.createdBy, userId)
        )
      )
      .limit(1);

    if (!familyTree) {
      throw new NotFoundException(`Family tree with id ${id} not found`);
    }

    if (familyTree.deletedAt) {
      await this.db
        .delete(schema.familyTreesSchema)
        .where(eq(schema.familyTreesSchema.id, id));
    } else {
      await this.db
        .update(schema.familyTreesSchema)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(schema.familyTreesSchema.id, id));
    }
  }
}
