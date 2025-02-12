import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as schema from '../../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '../../database/drizzle.provider';
import { and, asc, desc, eq, gte, inArray, isNull, not, or } from 'drizzle-orm';
import {
  FamilyTreeRelationshipCreateRequestDto,
  FamilyTreeRelationshipCreateSonOrDaughterRequestDto,
  FamilyTreeRelationshipResponseDto,
  FamilyTreeRelationshipUpdateRequestDto,
  FamilyTreeRelationshipUserArrayResponseDto,
  FamilyTreeRelationshipUserResponseDto,
} from './dto/family-tree-relationship.dto';
import { UserGenderEnum, UserResponseType } from '@family-tree/shared';
import { CloudflareConfig } from '../../config/cloudflare/cloudflare.config';
import { CLOUDFLARE_USER_FOLDER } from '../../utils/constants';

@Injectable()
export class FamilyTreeRelationshipService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private cloudflareConfig: CloudflareConfig
  ) {}

  // return nested json object
  async getFamilyTreeRelationshipOfFamilyTree(
    familyTreeId: string
  ): Promise<FamilyTreeRelationshipResponseDto> {
    const response: FamilyTreeRelationshipResponseDto = {
      parents: [],
      children: [],
    };

    // get all family tree relationship
    const familyTreeRelationships =
      await this.db.query.familyTreeRelationshipsSchema.findMany({
        orderBy: asc(schema.familyTreeRelationshipsSchema.depth),
        where: eq(
          schema.familyTreeRelationshipsSchema.familyTreeId,
          familyTreeId
        ),
      });

    // get all users info
    const users: Set<string> = new Set();

    familyTreeRelationships.forEach((data) => {
      users.add(data.ancestorId);
      users.add(data.descendantId);
    });

    const usersInfo = await this.db.query.usersSchema.findMany({
      where: inArray(schema.usersSchema.id, [...users]),
    });

    const usersInfoMap = new Map<string, UserResponseType>();

    usersInfo.forEach((data) => {
      usersInfoMap.set(data.id, data);
    });

    // parents part
    const allParentsMixed = familyTreeRelationships.filter(
      (data) => data.depth === 0 && data.ancestorId !== data.descendantId
    );
    const parentMap: Map<
      string,
      { father: UserResponseType; mother: UserResponseType }
    > = new Map<
      string,
      { father: UserResponseType; mother: UserResponseType }
    >();

    for (let i = 0; i < allParentsMixed.length; i++) {
      for (let j = i; j < allParentsMixed.length; j++) {
        if (allParentsMixed[i].ancestorId === allParentsMixed[j].descendantId) {
          const spouse1 = usersInfoMap.get(allParentsMixed[i].descendantId);
          const spouse2 = usersInfoMap.get(allParentsMixed[j].descendantId);

          if (
            spouse1?.gender == UserGenderEnum.MALE &&
            spouse2?.gender == UserGenderEnum.FEMALE
          ) {
            response.parents.push({
              mergedParentId: `${spouse1.id}$${spouse2.id}`,
              father: spouse1,
              mother: spouse2,
            });

            parentMap.set(spouse1.id, {
              father: spouse1,
              mother: spouse2,
            });

            parentMap.set(spouse2.id, {
              father: spouse1,
              mother: spouse2,
            });
          } else if (
            spouse1?.gender == UserGenderEnum.FEMALE &&
            spouse2?.gender == UserGenderEnum.MALE
          ) {
            response.parents.push({
              mergedParentId: `${spouse2.id}$${spouse1.id}`,
              father: spouse2,
              mother: spouse1,
            });

            parentMap.set(spouse2.id, {
              father: spouse2,
              mother: spouse1,
            });

            parentMap.set(spouse1.id, {
              father: spouse2,
              mother: spouse1,
            });
          }

          break;
        }
      }
    }

    // children part
    const allChildrenMixed = familyTreeRelationships.filter(
      (data) => data.depth === 1
    );
    const registeredChild = new Map<string, boolean>();
    const childrenOfParent = new Map<string, UserResponseType[]>();

    for (const child of allChildrenMixed) {
      // find parent of child
      const parent = parentMap.get(child.ancestorId);

      // if parent exist
      if (parent) {
        // check child registered
        if (!registeredChild.has(child.descendantId)) {
          registeredChild.set(child.descendantId, true);

          const registeredChildrenOfParent = childrenOfParent.get(
            `${parent.father.id}&${parent.mother.id}`
          );

          if (registeredChildrenOfParent?.length) {
            childrenOfParent.set(`${parent.father.id}&${parent.mother.id}`, [
              ...registeredChildrenOfParent,
              usersInfoMap.get(child.descendantId)!,
            ]);
          } else {
            childrenOfParent.set(`${parent.father.id}&${parent.mother.id}`, [
              usersInfoMap.get(child.descendantId)!,
            ]);
          }
        }
      }
    }

    response.children = Array.from(childrenOfParent, ([key, value]) => {
      return {
        mergedParentId: key,
        children: value,
      };
    });

    return response;
  }

  // return only one user info
  async getFamilyTreeRelationshipUserOfFamilyTree(
    familyTreeId: string,
    userId: string
  ): Promise<FamilyTreeRelationshipUserResponseDto> {
    // Find the user from family tree relationship
    const familyTreeRelationshipData =
      await this.db.query.familyTreeRelationshipsSchema.findFirst({
        where: and(
          eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId),
          eq(schema.familyTreeRelationshipsSchema.descendantId, userId),
          eq(schema.familyTreeRelationshipsSchema.ancestorId, userId),
          eq(schema.familyTreeRelationshipsSchema.depth, 0)
        ),
        with: {
          descendant: true,
        },
      });

    // check its existence
    if (!familyTreeRelationshipData) {
      throw new NotFoundException(
        `User with id ${userId} not found in family tree with id ${familyTreeId}`
      );
    }

    return familyTreeRelationshipData.descendant;
  }

  // create son relationship
  async createFamilyTreeRelationshipUserSonOfFamilyTree(
    familyTreeId: string,
    body: FamilyTreeRelationshipCreateSonOrDaughterRequestDto
  ): Promise<FamilyTreeRelationshipUserResponseDto> {
    await this.checkExistenceOfFamilyTree(familyTreeId);

    // find parents from user table
    const father = await this.db.query.usersSchema.findFirst({
      where: and(
        eq(schema.usersSchema.id, body.fatherId),
        eq(schema.usersSchema.gender, UserGenderEnum.MALE)
      ),
    });

    if (!father) {
      throw new NotFoundException(`Father with id ${body.fatherId} not found`);
    }

    const mother = await this.db.query.usersSchema.findFirst({
      where: and(
        eq(schema.usersSchema.id, body.motherId),
        eq(schema.usersSchema.gender, UserGenderEnum.FEMALE)
      ),
    });

    if (!mother) {
      throw new NotFoundException(`Mother with id ${body.motherId} not found`);
    }

    // parents relationship
    const parentFamilyTreeRelationship =
      await this.db.query.familyTreeRelationshipsSchema.findMany({
        where: or(
          and(
            eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId),
            eq(schema.familyTreeRelationshipsSchema.ancestorId, body.fatherId),
            eq(
              schema.familyTreeRelationshipsSchema.descendantId,
              body.motherId
            ),
            eq(schema.familyTreeRelationshipsSchema.depth, 0)
          ),
          and(
            eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId),
            eq(schema.familyTreeRelationshipsSchema.ancestorId, body.motherId),
            eq(
              schema.familyTreeRelationshipsSchema.descendantId,
              body.fatherId
            ),
            eq(schema.familyTreeRelationshipsSchema.depth, 0)
          )
        ),
      });

    if (parentFamilyTreeRelationship.length != 2) {
      throw new BadRequestException(
        `Relationship between ${body.fatherId} and ${body.motherId} not found`
      );
    }

    // create mock son
    const [son] = await this.db
      .insert(schema.usersSchema)
      .values({
        gender: UserGenderEnum.MALE,
        name: 'UNKNOWN',
      })
      .returning();

    // take ancestors and connect to new user
    const ancestors =
      await this.db.query.familyTreeRelationshipsSchema.findMany({
        where: and(
          eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId),
          gte(schema.familyTreeRelationshipsSchema.depth, 1),
          or(
            eq(
              schema.familyTreeRelationshipsSchema.descendantId,
              body.fatherId
            ),
            eq(schema.familyTreeRelationshipsSchema.descendantId, body.motherId)
          )
        ),
      });

    // little family
    await this.db.insert(schema.familyTreeRelationshipsSchema).values([
      {
        familyTreeId,
        ancestorId: son.id,
        depth: 0,
        descendantId: son.id,
      },
      {
        familyTreeId,
        ancestorId: father.id,
        depth: 1,
        descendantId: son.id,
      },
      {
        familyTreeId,
        ancestorId: mother.id,
        depth: 1,
        descendantId: son.id,
      },
    ]);

    // all related family
    await Promise.all(
      ancestors.map(async (ancestor) => {
        await this.db.insert(schema.familyTreeRelationshipsSchema).values({
          familyTreeId,
          ancestorId: ancestor.ancestorId,
          depth: ancestor.depth + 1,
          descendantId: son.id,
        });
      })
    );

    return son;
  }

  // create daughter relationship
  async createFamilyTreeRelationshipUserDaughterOfFamilyTree(
    familyTreeId: string,
    body: FamilyTreeRelationshipCreateSonOrDaughterRequestDto
  ): Promise<FamilyTreeRelationshipUserResponseDto> {
    await this.checkExistenceOfFamilyTree(familyTreeId);

    // find parents from user table
    const father = await this.db.query.usersSchema.findFirst({
      where: and(
        eq(schema.usersSchema.id, body.fatherId),
        eq(schema.usersSchema.gender, UserGenderEnum.MALE)
      ),
    });

    if (!father) {
      throw new NotFoundException(`Father with id ${body.fatherId} not found`);
    }

    const mother = await this.db.query.usersSchema.findFirst({
      where: and(
        eq(schema.usersSchema.id, body.motherId),
        eq(schema.usersSchema.gender, UserGenderEnum.FEMALE)
      ),
    });

    if (!mother) {
      throw new NotFoundException(`Mother with id ${body.motherId} not found`);
    }

    // parents relationship
    const parentFamilyTreeRelationship =
      await this.db.query.familyTreeRelationshipsSchema.findMany({
        where: or(
          and(
            eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId),
            eq(schema.familyTreeRelationshipsSchema.ancestorId, body.fatherId),
            eq(
              schema.familyTreeRelationshipsSchema.descendantId,
              body.motherId
            ),
            eq(schema.familyTreeRelationshipsSchema.depth, 0)
          ),
          and(
            eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId),
            eq(schema.familyTreeRelationshipsSchema.ancestorId, body.motherId),
            eq(
              schema.familyTreeRelationshipsSchema.descendantId,
              body.fatherId
            ),
            eq(schema.familyTreeRelationshipsSchema.depth, 0)
          )
        ),
      });

    if (parentFamilyTreeRelationship.length != 2) {
      throw new BadRequestException(
        `Relationship between ${body.fatherId} and ${body.motherId} not found`
      );
    }

    // create mock daughter
    const [daughter] = await this.db
      .insert(schema.usersSchema)
      .values({
        gender: UserGenderEnum.FEMALE,
        name: 'UNKNOWN',
      })
      .returning();

    // take ancestors and connect to new user
    const ancestors =
      await this.db.query.familyTreeRelationshipsSchema.findMany({
        where: and(
          eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId),
          gte(schema.familyTreeRelationshipsSchema.depth, 1),
          or(
            eq(
              schema.familyTreeRelationshipsSchema.descendantId,
              body.fatherId
            ),
            eq(schema.familyTreeRelationshipsSchema.descendantId, body.motherId)
          )
        ),
      });

    // little family
    await this.db.insert(schema.familyTreeRelationshipsSchema).values([
      {
        familyTreeId,
        ancestorId: daughter.id,
        depth: 0,
        descendantId: daughter.id,
      },
      {
        familyTreeId,
        ancestorId: father.id,
        depth: 1,
        descendantId: daughter.id,
      },
      {
        familyTreeId,
        ancestorId: mother.id,
        depth: 1,
        descendantId: daughter.id,
      },
    ]);

    // all related family
    await Promise.all(
      ancestors.map(async (ancestor) => {
        await this.db.insert(schema.familyTreeRelationshipsSchema).values({
          familyTreeId,
          ancestorId: ancestor.ancestorId,
          depth: ancestor.depth + 1,
          descendantId: daughter.id,
        });
      })
    );

    return daughter;
  }

  // create parent relationship
  async createFamilyTreeRelationshipUserParentOfFamilyTree(
    familyTreeId: string,
    body: FamilyTreeRelationshipCreateRequestDto
  ): Promise<FamilyTreeRelationshipUserArrayResponseDto> {
    // check is family tree exist
    await this.checkExistenceOfFamilyTree(familyTreeId);
    const parentOfTargetUser = await this.findParentOfTargetUser(
      familyTreeId,
      body.targetUserId
    );

    if (parentOfTargetUser) {
      throw new BadRequestException(`User already has parent`);
    }

    // create mock parent
    const [father, mother] = await this.db
      .insert(schema.usersSchema)
      .values([
        { gender: UserGenderEnum.MALE, name: 'UNKNOWN' },
        { gender: UserGenderEnum.FEMALE, name: 'UNKNOWN' },
      ])
      .returning();

    // self initialize
    await this.db.insert(schema.familyTreeRelationshipsSchema).values([
      {
        familyTreeId,
        ancestorId: father.id,
        descendantId: father.id,
        depth: 0,
      },
      {
        familyTreeId,
        ancestorId: mother.id,
        descendantId: mother.id,
        depth: 0,
      },
      {
        familyTreeId,
        ancestorId: father.id,
        descendantId: mother.id,
        depth: 0,
      },
      {
        familyTreeId,
        ancestorId: mother.id,
        descendantId: father.id,
        depth: 0,
      },
    ]);

    // take children of target user
    if (body.targetUserId) {
      // it's also called from family-tree controller when it's created
      // take children of targetUser
      const targetUserChildren =
        await this.db.query.familyTreeRelationshipsSchema.findMany({
          where: and(
            gte(schema.familyTreeRelationshipsSchema.depth, 1),
            eq(
              schema.familyTreeRelationshipsSchema.ancestorId,
              body.targetUserId
            ),
            eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId)
          ),
        });

      // connect parents
      await this.db.insert(schema.familyTreeRelationshipsSchema).values([
        {
          familyTreeId,
          ancestorId: father.id,
          descendantId: body.targetUserId,
          depth: 1,
        },
        {
          familyTreeId,
          ancestorId: mother.id,
          descendantId: body.targetUserId,
          depth: 1,
        },
      ]);

      // bind target children to new parents
      await Promise.all(
        targetUserChildren.map((child) => {
          this.db.insert(schema.familyTreeRelationshipsSchema).values([
            {
              familyTreeId,
              ancestorId: father.id,
              descendantId: child.descendantId,
              depth: child.depth + 1,
            },
            {
              familyTreeId,
              ancestorId: mother.id,
              descendantId: child.descendantId,
              depth: child.depth + 1,
            },
          ]);
        })
      );
    }

    // new parent
    return [father, mother];
  }

  // create spouse relationship
  async createFamilyTreeRelationshipUserSpouseOfFamilyTree(
    familyTreeId: string,
    body: FamilyTreeRelationshipCreateRequestDto
  ): Promise<FamilyTreeRelationshipUserResponseDto> {
    // check is family tree exist
    await this.checkExistenceOfFamilyTree(familyTreeId);

    // find target user
    const targetUser = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.id, body.targetUserId),
    });

    // check its existence
    if (!targetUser) {
      throw new NotFoundException(
        `Target user with id ${body.targetUserId} not found`
      );
    }

    const existSpouses = await this.findSpouseOfTargetUser(
      familyTreeId,
      body.targetUserId
    );

    if (targetUser.gender === UserGenderEnum.MALE && existSpouses.length >= 4) {
      throw new BadRequestException(
        `Target user with id ${body.targetUserId} already has 4 wives`
      );
    } else if (
      targetUser.gender === UserGenderEnum.FEMALE &&
      existSpouses.length >= 1
    ) {
      throw new BadRequestException(
        `Target user with id ${body.targetUserId} already has 1 husband`
      );
    }

    // declare outer scope
    const [spouse] = await this.db
      .insert(schema.usersSchema)
      .values({
        gender:
          targetUser.gender === UserGenderEnum.MALE
            ? UserGenderEnum.FEMALE
            : UserGenderEnum.MALE,
        name: 'UNKNOWN',
      })
      .returning();

    // initializing necessary relationship
    await this.db.insert(schema.familyTreeRelationshipsSchema).values([
      {
        familyTreeId,
        ancestorId: spouse.id,
        descendantId: spouse.id,
        depth: 0,
      },
      {
        familyTreeId,
        ancestorId: spouse.id,
        descendantId: targetUser.id,
        depth: 0,
      },
      {
        familyTreeId,
        ancestorId: targetUser.id,
        descendantId: spouse.id,
        depth: 0,
      },
    ]);

    // new user
    return spouse;
  }

  // update mock user or bind real user
  // Logically when user bind real user don't immediately connect but send notification to real user and when he/she approves then add and delete mock user
  async updateFamilyTreeRelationshipUserOfFamilyTree(
    familyTreeId: string,
    userId: string,
    body: FamilyTreeRelationshipUpdateRequestDto
  ): Promise<void> {
    // check is family tree exist
    await this.checkExistenceOfFamilyTree(familyTreeId);

    // take user
    const user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.id, userId),
    });

    // check is it really exist
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    // real user can't be updated
    if (user.email) {
      throw new BadRequestException(`User with id ${userId} is real user`);
    }

    // connect to real user
    if (body.email) {
      // find new user
      const newUser = await this.db.query.usersSchema.findFirst({
        where: eq(schema.usersSchema.email, body.email),
      });

      // check its existence
      if (!newUser) {
        throw new NotFoundException(`User with email ${body.email} not found`);
      }

      // check is gender match
      if (newUser.gender !== user.gender) {
        throw new BadRequestException(
          `Gender mismatch between user with id ${userId} and user with email ${body.email}`
        );
      }

      // check is new user doesn't already exist in family tree
      const relationship =
        await this.db.query.familyTreeRelationshipsSchema.findFirst({
          where: and(
            eq(schema.familyTreeRelationshipsSchema.ancestorId, newUser.id),
            eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId)
          ),
        });

      if (relationship) {
        throw new BadRequestException(
          `User with email ${body.email} already exist in family tree with id ${familyTreeId}`
        );
      }

      // update all descendants of old user to new user
      await this.db
        .update(schema.familyTreeRelationshipsSchema)
        .set({
          descendantId: newUser.id,
        })
        .where(
          and(
            eq(schema.familyTreeRelationshipsSchema.descendantId, userId),
            eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId)
          )
        );

      // update all ancestors of old user to new user
      await this.db
        .update(schema.familyTreeRelationshipsSchema)
        .set({
          ancestorId: newUser.id,
        })
        .where(
          and(
            eq(schema.familyTreeRelationshipsSchema.ancestorId, userId),
            eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId)
          )
        );

      // delete old user image from cloudflare
      if (user.image) {
        this.cloudflareConfig.deleteFile(CLOUDFLARE_USER_FOLDER, user.image);
      }

      // delete old user
      await this.db
        .delete(schema.usersSchema)
        .where(eq(schema.usersSchema.id, userId));
    } else {
      // update other user info

      // delete old user image from cloudflare
      if (user.image && body.image !== user.image) {
        this.cloudflareConfig.deleteFile(CLOUDFLARE_USER_FOLDER, user.image);
      }

      // update user info
      await this.db
        .update(schema.usersSchema)
        .set(body)
        .where(eq(schema.usersSchema.id, userId));
    }
  }

  // delete relationship if there's no relationship and if user is mock than delete it from user table
  async deleteFamilyTreeRelationshipUserOfFamilyTree(
    familyTreeId: string,
    userId: string
  ): Promise<void> {
    const userChildren = await this.findChildrenOfTargetUser(
      familyTreeId,
      userId
    );
    const userSpouse = await this.findSpouseOfTargetUser(familyTreeId, userId);

    if (userChildren.length) {
      throw new BadRequestException(`User with id ${userId} has children`);
    } else if (userSpouse.length > 1) {
      throw new BadRequestException(`User with id ${userId} has spouse`);
    }

    const user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.id, userId),
    });

    if (user?.email) {
      // FIXME: notify user that he removed from family tree (FCM)
    }

    // delete user if it's mock
    await this.db
      .delete(schema.usersSchema)
      .where(
        and(eq(schema.usersSchema.id, userId), isNull(schema.usersSchema.email))
      );

    // delete relationship
    await this.db
      .delete(schema.familyTreeRelationshipsSchema)
      .where(
        and(
          or(
            eq(schema.familyTreeRelationshipsSchema.ancestorId, userId),
            eq(schema.familyTreeRelationshipsSchema.descendantId, userId)
          ),
          eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId)
        )
      );
  }

  // helpful methods
  async findRootParent(
    familyTreeId: string
  ): Promise<FamilyTreeRelationshipUserArrayResponseDto> {
    const familyTreeRelationships =
      await this.db.query.familyTreeRelationshipsSchema.findMany({
        with: {
          ancestor: true,
        },
        orderBy: [
          desc(schema.familyTreeRelationshipsSchema.depth),
          asc(schema.familyTreeRelationshipsSchema.createdAt),
        ],
        limit: 2,
        where: eq(
          schema.familyTreeRelationshipsSchema.familyTreeId,
          familyTreeId
        ),
      });

    return familyTreeRelationships.map((data) => data.ancestor);
  }

  async findParentOfTargetUser(
    familyTreeId: string,
    targetUserId: string
  ): Promise<FamilyTreeRelationshipUserArrayResponseDto> {
    const parents = await this.db.query.familyTreeRelationshipsSchema.findMany({
      with: {
        ancestor: true,
      },
      limit: 2,
      where: and(
        eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId),
        eq(schema.familyTreeRelationshipsSchema.depth, 1),
        eq(schema.familyTreeRelationshipsSchema.descendantId, targetUserId)
      ),
    });

    return parents.map((data) => data.ancestor);
  }

  async findSpouseOfTargetUser(
    familyTreeId: string,
    targetUserId: string
  ): Promise<FamilyTreeRelationshipUserArrayResponseDto> {
    const spouses = await this.db.query.familyTreeRelationshipsSchema.findMany({
      with: {
        ancestor: true,
      },
      where: and(
        eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId),
        eq(schema.familyTreeRelationshipsSchema.depth, 0),
        eq(schema.familyTreeRelationshipsSchema.descendantId, targetUserId),
        not(eq(schema.familyTreeRelationshipsSchema.ancestorId, targetUserId))
      ),
    });

    return spouses.map((data) => data.ancestor);
  }

  async findChildrenOfTargetUser(
    familyTreeId: string,
    targetUserId: string
  ): Promise<FamilyTreeRelationshipUserArrayResponseDto> {
    const children = await this.db.query.familyTreeRelationshipsSchema.findMany(
      {
        with: {
          ancestor: true,
        },
        where: and(
          eq(schema.familyTreeRelationshipsSchema.depth, 1),
          eq(schema.familyTreeRelationshipsSchema.ancestorId, targetUserId),
          eq(schema.familyTreeRelationshipsSchema.familyTreeId, familyTreeId)
        ),
      }
    );

    return children.map((child) => child.ancestor);
  }

  async checkExistenceOfFamilyTree(familyTreeId: string): Promise<void> {
    const familyTree = await this.db.query.familyTreesSchema.findFirst({
      where: and(
        eq(schema.familyTreesSchema.id, familyTreeId),
        isNull(schema.familyTreesSchema.deletedAt)
      ),
    });

    if (!familyTree) {
      throw new NotFoundException(
        `Family tree with id ${familyTreeId} not found`
      );
    }
  }
}
