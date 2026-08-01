import {
  FamilyTreeMemberConnectionEnum,
  type FamilyTreeMemberDeletePreviewType,
  generateRandomAvatar,
  UserGenderEnum,
  type UserSchemaType,
} from '@family-tree/shared';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, asc, eq, inArray, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CloudflareConfig } from '~/config/cloudflare/cloudflare.config';
import type { EnvType } from '~/config/env/env-validation';
import { DrizzleAsyncProvider } from '~/database/drizzle.provider';
import * as schema from '~/database/schema';
import type { FamilyTreeResponseDto } from '../../family-tree/dto/family-tree.dto';
import type {
  FamilyTreeMemberCreateChildRequestDto,
  FamilyTreeMemberCreateParentsRequestDto,
  FamilyTreeMemberCreateSpouseRequestDto,
  FamilyTreeMemberGetAllParamDto,
  FamilyTreeMemberGetAllResponseDto,
  FamilyTreeMemberGetParamDto,
  FamilyTreeMemberGetResponseDto,
  FamilyTreeMemberUpdateRequestDto,
} from '../dto/family-tree-member.dto';

@Injectable()
export class FamilyTreeMemberService {
  protected cloudflareR2Path: string;

  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    protected cloudflareConfig: CloudflareConfig,
    configService: ConfigService<EnvType>,
  ) {
    this.cloudflareR2Path =
      configService.getOrThrow<EnvType['CLOUDFLARE_URL']>('CLOUDFLARE_URL');
  }

  async createFamilyTreeMemberChild(
    familyTreeId: string,
    body: FamilyTreeMemberCreateChildRequestDto,
  ): Promise<FamilyTreeMemberGetResponseDto> {
    const parents =
      await this.db.query.familyTreeMemberConnectionsSchema.findFirst({
        where: and(
          eq(
            schema.familyTreeMemberConnectionsSchema.familyTreeId,
            familyTreeId,
          ),
          eq(
            schema.familyTreeMemberConnectionsSchema.type,
            FamilyTreeMemberConnectionEnum.SPOUSE,
          ),
          or(
            eq(
              schema.familyTreeMemberConnectionsSchema.fromMemberId,
              body.fromMemberId,
            ),
            eq(
              schema.familyTreeMemberConnectionsSchema.toMemberId,
              body.fromMemberId,
            ),
          ),
        ),
      });

    if (!parents) {
      throw new BadRequestException(
        `Family tree member with id ${body.fromMemberId} has no spouse`,
      );
    }

    const [child] = await this.db
      .insert(schema.familyTreeMembersSchema)
      .values({
        gender: body.gender,
        name: body.gender === UserGenderEnum.MALE ? 'Son' : 'Daughter',
        image: generateRandomAvatar(body.gender),
        familyTreeId,
      })
      .returning();

    await Promise.all([
      await this.db.insert(schema.familyTreeMemberConnectionsSchema).values({
        familyTreeId: familyTreeId,
        fromMemberId: parents?.fromMemberId,
        toMemberId: child.id,
        type: FamilyTreeMemberConnectionEnum.PARENT,
      }),
      await this.db.insert(schema.familyTreeMemberConnectionsSchema).values({
        familyTreeId: familyTreeId,
        fromMemberId: parents?.toMemberId,
        toMemberId: child.id,
        type: FamilyTreeMemberConnectionEnum.PARENT,
      }),
    ]);

    return child;
  }

  async createFamilyTreeMemberSpouse(
    familyTreeId: string,
    body: FamilyTreeMemberCreateSpouseRequestDto,
  ): Promise<FamilyTreeMemberGetResponseDto> {
    const partner1 = await this.getFamilyTreeMember({
      id: body.fromMemberId,
      familyTreeId,
    });

    const memberConnections =
      await this.db.query.familyTreeMemberConnectionsSchema.findFirst({
        where: and(
          eq(
            schema.familyTreeMemberConnectionsSchema.familyTreeId,
            familyTreeId,
          ),
          eq(
            schema.familyTreeMemberConnectionsSchema.type,
            FamilyTreeMemberConnectionEnum.SPOUSE,
          ),
          or(
            eq(
              schema.familyTreeMemberConnectionsSchema.fromMemberId,
              partner1.id,
            ),
            eq(
              schema.familyTreeMemberConnectionsSchema.toMemberId,
              partner1.id,
            ),
          ),
        ),
      });

    if (memberConnections) {
      throw new BadRequestException(
        `Family tree member with id ${body.fromMemberId} is already married`,
      );
    }

    const partnerGender =
      partner1.gender === UserGenderEnum.MALE
        ? UserGenderEnum.FEMALE
        : UserGenderEnum.MALE;

    const [spouse] = await this.db
      .insert(schema.familyTreeMembersSchema)
      .values({
        gender: partnerGender,
        name: partner1.gender === UserGenderEnum.MALE ? 'Wife' : 'Husband',
        image: generateRandomAvatar(partnerGender),
        familyTreeId,
      })
      .returning();

    await this.db.insert(schema.familyTreeMemberConnectionsSchema).values({
      familyTreeId: familyTreeId,
      fromMemberId: partner1.id,
      toMemberId: spouse.id,
      type: FamilyTreeMemberConnectionEnum.SPOUSE,
    });

    return spouse;
  }

  async createFamilyTreeMemberParents(
    familyTreeId: string,
    body: FamilyTreeMemberCreateParentsRequestDto,
  ): Promise<FamilyTreeMemberGetResponseDto> {
    const member = await this.getFamilyTreeMember({
      id: body.fromMemberId,
      familyTreeId,
    });

    const memberParents =
      await this.db.query.familyTreeMemberConnectionsSchema.findFirst({
        where: and(
          eq(
            schema.familyTreeMemberConnectionsSchema.familyTreeId,
            familyTreeId,
          ),
          eq(
            schema.familyTreeMemberConnectionsSchema.type,
            FamilyTreeMemberConnectionEnum.PARENT,
          ),
          eq(schema.familyTreeMemberConnectionsSchema.toMemberId, member.id),
        ),
      });

    if (memberParents) {
      throw new BadRequestException(
        `Family tree member with id ${body.fromMemberId} has already parents`,
      );
    }

    const [[father], [mother]] = await Promise.all([
      this.db
        .insert(schema.familyTreeMembersSchema)
        .values({
          gender: UserGenderEnum.MALE,
          image: generateRandomAvatar(UserGenderEnum.MALE),
          name: 'Father',
          familyTreeId,
        })
        .returning(),
      this.db
        .insert(schema.familyTreeMembersSchema)
        .values({
          gender: UserGenderEnum.FEMALE,
          image: generateRandomAvatar(UserGenderEnum.FEMALE),
          name: 'Mother',
          familyTreeId,
        })
        .returning(),
    ]);

    await this.db.insert(schema.familyTreeMemberConnectionsSchema).values([
      {
        familyTreeId: familyTreeId,
        fromMemberId: father.id,
        toMemberId: member.id,
        type: FamilyTreeMemberConnectionEnum.PARENT,
      },
      {
        familyTreeId: familyTreeId,
        fromMemberId: mother.id,
        toMemberId: member.id,
        type: FamilyTreeMemberConnectionEnum.PARENT,
      },
      {
        familyTreeId: familyTreeId,
        fromMemberId: father.id,
        toMemberId: mother.id,
        type: FamilyTreeMemberConnectionEnum.SPOUSE,
      },
    ]);

    return member;
  }

  async createFamilyTreeMemberInitial(
    user: UserSchemaType,
    familyTreeId: string,
  ): Promise<void> {
    if (user.gender !== UserGenderEnum.UNKNOWN) {
      await this.db.insert(schema.familyTreeMembersSchema).values({
        name: user.name,
        gender: user.gender,
        image: user.image,
        description: user.description,
        dob: user.dob,
        dod: user.dod,
        familyTreeId,
      });
    } else {
      const [[husband], [wife]] = await Promise.all([
        this.db
          .insert(schema.familyTreeMembersSchema)
          .values({
            name: 'John Doe',
            gender: UserGenderEnum.MALE,
            image: generateRandomAvatar(UserGenderEnum.MALE),
            description: 'Husband',
            dob: '1990-01-01',
            dod: null,
            familyTreeId,
          })
          .returning(),
        this.db
          .insert(schema.familyTreeMembersSchema)
          .values({
            name: 'Jane Doe',
            gender: UserGenderEnum.FEMALE,
            image: generateRandomAvatar(UserGenderEnum.FEMALE),
            description: 'Wife',
            dob: '1990-01-01',
            dod: null,
            familyTreeId,
          })
          .returning(),
      ]);

      await this.db.insert(schema.familyTreeMemberConnectionsSchema).values({
        familyTreeId,
        fromMemberId: husband.id,
        toMemberId: wife.id,
        type: FamilyTreeMemberConnectionEnum.SPOUSE,
      });
    }
  }

  async updateFamilyTreeMember(
    param: FamilyTreeMemberGetParamDto,
    body: FamilyTreeMemberUpdateRequestDto,
  ) {
    const familyTreeMember = await this.getFamilyTreeMember(param);

    if (
      body.image &&
      familyTreeMember?.image &&
      familyTreeMember.image !== body.image
    ) {
      this.cloudflareConfig.deleteFile(familyTreeMember.image);
    }

    await this.db
      .update(schema.familyTreeMembersSchema)
      .set({ ...body })
      .where(and(eq(schema.familyTreeMembersSchema.id, param.id)));
  }

  private async computeDeletePreview(
    member: FamilyTreeMemberGetResponseDto,
    familyTreeId: string,
  ): Promise<FamilyTreeMemberDeletePreviewType> {
    const blocked = (reason: string): FamilyTreeMemberDeletePreviewType => ({
      canDelete: false,
      blockReason: reason,
      spouseToDelete: null,
    });

    const [children, hasParents, spouseConn] = await Promise.all([
      this.db.query.familyTreeMemberConnectionsSchema.findMany({
        where: and(
          eq(
            schema.familyTreeMemberConnectionsSchema.familyTreeId,
            familyTreeId,
          ),
          eq(schema.familyTreeMemberConnectionsSchema.fromMemberId, member.id),
          eq(
            schema.familyTreeMemberConnectionsSchema.type,
            FamilyTreeMemberConnectionEnum.PARENT,
          ),
        ),
        limit: 2,
      }),
      this.db.query.familyTreeMemberConnectionsSchema.findFirst({
        where: and(
          eq(
            schema.familyTreeMemberConnectionsSchema.familyTreeId,
            familyTreeId,
          ),
          eq(schema.familyTreeMemberConnectionsSchema.toMemberId, member.id),
          eq(
            schema.familyTreeMemberConnectionsSchema.type,
            FamilyTreeMemberConnectionEnum.PARENT,
          ),
        ),
      }),
      this.db.query.familyTreeMemberConnectionsSchema.findFirst({
        where: and(
          eq(
            schema.familyTreeMemberConnectionsSchema.familyTreeId,
            familyTreeId,
          ),
          or(
            eq(
              schema.familyTreeMemberConnectionsSchema.fromMemberId,
              member.id,
            ),
            eq(schema.familyTreeMemberConnectionsSchema.toMemberId, member.id),
          ),
          eq(
            schema.familyTreeMemberConnectionsSchema.type,
            FamilyTreeMemberConnectionEnum.SPOUSE,
          ),
        ),
        with: { fromMember: true, toMember: true },
      }),
    ]);

    // 2+ children always splits the tree
    if (children.length >= 2) {
      return blocked(
        `Cannot delete ${member.name}: they have multiple children — removing them would split the tree`,
      );
    }

    // Middle member: has parents above AND a child below.
    // Co-deleting the couple would disconnect the child-subtree from the grandparents.
    if (hasParents && children.length >= 1) {
      return blocked(
        `Cannot delete ${member.name}: they have parents above and children below — only members at the top or bottom of the tree can be deleted`,
      );
    }

    const potentialSpouse = spouseConn
      ? spouseConn.fromMemberId === member.id
        ? spouseConn.toMember
        : spouseConn.fromMember
      : null;

    let spouseToDelete = null;

    if (potentialSpouse) {
      const spouseHasParents =
        await this.db.query.familyTreeMemberConnectionsSchema.findFirst({
          where: and(
            eq(
              schema.familyTreeMemberConnectionsSchema.familyTreeId,
              familyTreeId,
            ),
            eq(
              schema.familyTreeMemberConnectionsSchema.toMemberId,
              potentialSpouse.id,
            ),
            eq(
              schema.familyTreeMemberConnectionsSchema.type,
              FamilyTreeMemberConnectionEnum.PARENT,
            ),
          ),
        });

      // Block when spouse has parents and removing the couple would disconnect parts of the tree:
      // - target also has parents: two separate parent groups joined only through this couple
      // - couple has a shared child: spouse's parents would be cut off from the child
      if (spouseHasParents && (hasParents || children.length >= 1)) {
        return blocked(
          `Cannot delete ${member.name}: their spouse has parents — removing this couple would disconnect parts of the family tree`,
        );
      }

      // Co-delete spouse when:
      // - shared child (each child has PARENT connections to both parents)
      // - no shared children but spouse has no parents (spouse would become isolated)
      if (children.length >= 1 || !spouseHasParents) {
        spouseToDelete = potentialSpouse;
      }
      // else: spouse has parents, no shared children → delete target only (spouse stays connected)
    }

    // Ensure at least 1 member survives (need 2 if no spouse, 3 if deleting couple)
    const minRequired = spouseToDelete ? 3 : 2;
    const memberSample = await this.db.query.familyTreeMembersSchema.findMany({
      where: eq(schema.familyTreeMembersSchema.familyTreeId, familyTreeId),
      limit: minRequired,
    });

    if (memberSample.length < minRequired) {
      if (spouseToDelete && children.length === 0) {
        // Leaf couple with no other members: co-deletion would empty the tree.
        // Fall back to deleting only the target; spouse becomes the sole survivor.
        spouseToDelete = null;
      } else {
        return blocked('Cannot delete the last member of the family tree');
      }
    }

    return { canDelete: true, blockReason: null, spouseToDelete };
  }

  async getFamilyTreeMemberDeletePreview(
    param: FamilyTreeMemberGetParamDto,
  ): Promise<FamilyTreeMemberDeletePreviewType> {
    const member = await this.getFamilyTreeMember(param);

    return this.computeDeletePreview(member, param.familyTreeId);
  }

  async deleteFamilyTreeMember(param: FamilyTreeMemberGetParamDto) {
    const member = await this.getFamilyTreeMember(param);
    const preview = await this.computeDeletePreview(member, param.familyTreeId);

    if (!preview.canDelete) {
      throw new BadRequestException(preview.blockReason);
    }

    if (member.image) {
      this.cloudflareConfig.deleteFile(member.image);
    }

    const idsToDelete = [member.id];

    if (preview.spouseToDelete) {
      if (preview.spouseToDelete.image) {
        this.cloudflareConfig.deleteFile(preview.spouseToDelete.image);
      }

      idsToDelete.push(preview.spouseToDelete.id);
    }

    await this.db
      .delete(schema.familyTreeMembersSchema)
      .where(
        and(
          eq(schema.familyTreeMembersSchema.familyTreeId, param.familyTreeId),
          inArray(schema.familyTreeMembersSchema.id, idsToDelete),
        ),
      );
  }

  async getAllFamilyTreeMembers(
    param: FamilyTreeMemberGetAllParamDto,
  ): Promise<FamilyTreeMemberGetAllResponseDto> {
    return this.db.query.familyTreeMembersSchema.findMany({
      where: and(
        eq(schema.familyTreeMembersSchema.familyTreeId, param.familyTreeId),
      ),
      orderBy: [asc(schema.familyTreeMembersSchema.dob)],
    });
  }

  async getFamilyTreeMember(
    param: FamilyTreeMemberGetParamDto,
  ): Promise<FamilyTreeMemberGetResponseDto> {
    const familyTreeMember =
      await this.db.query.familyTreeMembersSchema.findFirst({
        where: and(
          eq(schema.familyTreeMembersSchema.id, param.id),
          eq(schema.familyTreeMembersSchema.familyTreeId, param.familyTreeId),
        ),
      });

    if (!familyTreeMember) {
      throw new NotFoundException(
        `Family tree member with id ${param.id} not found`,
      );
    }

    return familyTreeMember;
  }

  async getFamilyTreeById(
    familyTreeId: string,
  ): Promise<FamilyTreeResponseDto> {
    const familyTree = await this.db.query.familyTreesSchema.findFirst({
      where: eq(schema.familyTreesSchema.id, familyTreeId),
    });

    if (!familyTree) {
      throw new NotFoundException(
        `Family tree with id ${familyTreeId} not found`,
      );
    }

    return familyTree;
  }
}
