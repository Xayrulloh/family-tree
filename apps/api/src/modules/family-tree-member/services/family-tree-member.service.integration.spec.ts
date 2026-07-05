/// <reference types="jest" />
import {
  FamilyTreeMemberConnectionEnum,
  UserGenderEnum,
} from '@family-tree/shared';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '~/database/schema';
import { seedFamilyTree, seedMember, seedUser } from '~/test/seeds';
import { getTestDb, truncateTables } from '~/test/test-db';
import { FamilyTreeMemberService } from './family-tree-member.service';

const mockCloudflareConfig = {
  deleteFile: jest.fn(),
  uploadFile: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('https://r2.example.com'),
};

describe('FamilyTreeMemberService (integration)', () => {
  let service: FamilyTreeMemberService;

  beforeAll(() => {
    service = new FamilyTreeMemberService(
      getTestDb(),
      mockCloudflareConfig as any,
      mockConfigService as any,
    );
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    await truncateTables();
  });

  describe('getAllFamilyTreeMembers', () => {
    it('returns all members in the tree', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      await Promise.all([
        seedMember(getTestDb(), tree.id),
        seedMember(getTestDb(), tree.id),
      ]);

      const result = await service.getAllFamilyTreeMembers({
        familyTreeId: tree.id,
      });

      expect(result).toHaveLength(2);
    });

    it('returns an empty array when the tree has no members', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      const result = await service.getAllFamilyTreeMembers({
        familyTreeId: tree.id,
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('getFamilyTreeMember', () => {
    it('returns the member when found', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const member = await seedMember(getTestDb(), tree.id, { name: 'Alice' });

      const result = await service.getFamilyTreeMember({
        id: member.id,
        familyTreeId: tree.id,
      });

      expect(result.id).toBe(member.id);
      expect(result.name).toBe('Alice');
    });

    it('throws NotFoundException for an unknown member id', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      await expect(
        service.getFamilyTreeMember({
          id: '550e8400-e29b-41d4-a716-446655440000',
          familyTreeId: tree.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createFamilyTreeMemberSpouse', () => {
    it('creates a spouse with opposite gender and a SPOUSE connection', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const husband = await seedMember(getTestDb(), tree.id, {
        gender: UserGenderEnum.MALE,
      });

      const wife = await service.createFamilyTreeMemberSpouse(tree.id, {
        fromMemberId: husband.id,
      });

      expect(wife.gender).toBe(UserGenderEnum.FEMALE);
      expect(wife.name).toBe('Wife');

      const conn =
        await getTestDb().query.familyTreeMemberConnectionsSchema.findFirst({
          where: eq(
            schema.familyTreeMemberConnectionsSchema.fromMemberId,
            husband.id,
          ),
        });

      expect(conn?.type).toBe(FamilyTreeMemberConnectionEnum.SPOUSE);
      expect(conn?.toMemberId).toBe(wife.id);
    });

    it('throws BadRequestException when the member is already married', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const husband = await seedMember(getTestDb(), tree.id, {
        gender: UserGenderEnum.MALE,
      });

      await service.createFamilyTreeMemberSpouse(tree.id, {
        fromMemberId: husband.id,
      });

      await expect(
        service.createFamilyTreeMemberSpouse(tree.id, {
          fromMemberId: husband.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when fromMemberId does not exist', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      await expect(
        service.createFamilyTreeMemberSpouse(tree.id, {
          fromMemberId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createFamilyTreeMemberChild', () => {
    it('creates a child with correct name and two PARENT connections', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      const husband = await seedMember(getTestDb(), tree.id, {
        gender: UserGenderEnum.MALE,
      });

      await service.createFamilyTreeMemberSpouse(tree.id, {
        fromMemberId: husband.id,
      });

      const child = await service.createFamilyTreeMemberChild(tree.id, {
        fromMemberId: husband.id,
        gender: UserGenderEnum.MALE,
      });

      expect(child.name).toBe('Son');
      expect(child.gender).toBe(UserGenderEnum.MALE);

      const parentConns =
        await getTestDb().query.familyTreeMemberConnectionsSchema.findMany({
          where: eq(
            schema.familyTreeMemberConnectionsSchema.toMemberId,
            child.id,
          ),
        });

      expect(parentConns).toHaveLength(2);
      expect(
        parentConns.every(
          (c) => c.type === FamilyTreeMemberConnectionEnum.PARENT,
        ),
      ).toBe(true);
    });

    it('throws BadRequestException when the parent has no spouse', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const loner = await seedMember(getTestDb(), tree.id);

      await expect(
        service.createFamilyTreeMemberChild(tree.id, {
          fromMemberId: loner.id,
          gender: UserGenderEnum.FEMALE,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createFamilyTreeMemberParents', () => {
    it('creates father, mother, and three connections', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const child = await seedMember(getTestDb(), tree.id);

      await service.createFamilyTreeMemberParents(tree.id, {
        fromMemberId: child.id,
      });

      const allMembers =
        await getTestDb().query.familyTreeMembersSchema.findMany({
          where: eq(schema.familyTreeMembersSchema.familyTreeId, tree.id),
        });

      expect(allMembers).toHaveLength(3);

      const allConns =
        await getTestDb().query.familyTreeMemberConnectionsSchema.findMany({
          where: eq(
            schema.familyTreeMemberConnectionsSchema.familyTreeId,
            tree.id,
          ),
        });

      expect(allConns).toHaveLength(3);
    });

    it('throws BadRequestException when the member already has parents', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const child = await seedMember(getTestDb(), tree.id);
      await service.createFamilyTreeMemberParents(tree.id, {
        fromMemberId: child.id,
      });

      await expect(
        service.createFamilyTreeMemberParents(tree.id, {
          fromMemberId: child.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createFamilyTreeMemberInitial', () => {
    it('creates one member with user data for a MALE user', async () => {
      const user = await seedUser(getTestDb(), {
        gender: UserGenderEnum.MALE,
        name: 'Bob',
      });

      const tree = await seedFamilyTree(getTestDb(), user.id);

      await service.createFamilyTreeMemberInitial(user as any, tree.id);

      const members = await service.getAllFamilyTreeMembers({
        familyTreeId: tree.id,
      });

      expect(members).toHaveLength(1);
      expect(members[0].name).toBe('Bob');
      expect(members[0].gender).toBe(UserGenderEnum.MALE);
    });

    it('creates one member with user data for a FEMALE user', async () => {
      const user = await seedUser(getTestDb(), {
        gender: UserGenderEnum.FEMALE,
        name: 'Carol',
      });

      const tree = await seedFamilyTree(getTestDb(), user.id);

      await service.createFamilyTreeMemberInitial(user as any, tree.id);

      const members = await service.getAllFamilyTreeMembers({
        familyTreeId: tree.id,
      });

      expect(members).toHaveLength(1);
      expect(members[0].name).toBe('Carol');
    });

    it('creates John Doe and Jane Doe with a SPOUSE connection for an UNKNOWN user', async () => {
      const user = await seedUser(getTestDb(), {
        gender: UserGenderEnum.UNKNOWN,
      });

      const tree = await seedFamilyTree(getTestDb(), user.id);

      await service.createFamilyTreeMemberInitial(user as any, tree.id);

      const members = await service.getAllFamilyTreeMembers({
        familyTreeId: tree.id,
      });

      expect(members).toHaveLength(2);
      expect(members.map((m) => m.name).sort()).toEqual([
        'Jane Doe',
        'John Doe',
      ]);

      const conn =
        await getTestDb().query.familyTreeMemberConnectionsSchema.findFirst({
          where: eq(
            schema.familyTreeMemberConnectionsSchema.familyTreeId,
            tree.id,
          ),
        });

      expect(conn?.type).toBe(FamilyTreeMemberConnectionEnum.SPOUSE);
    });
  });

  describe('updateFamilyTreeMember', () => {
    it('persists the updated fields', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const member = await seedMember(getTestDb(), tree.id, { name: 'Before' });

      await service.updateFamilyTreeMember(
        { id: member.id, familyTreeId: tree.id },
        { name: 'After' },
      );

      const updated = await service.getFamilyTreeMember({
        id: member.id,
        familyTreeId: tree.id,
      });

      expect(updated.name).toBe('After');
    });

    it('calls deleteFile when the image changes', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const member = await seedMember(getTestDb(), tree.id, {
        image: 'https://r2.example.com/old-member.png',
      });

      await service.updateFamilyTreeMember(
        { id: member.id, familyTreeId: tree.id },
        { image: 'https://r2.example.com/new-member.png' },
      );

      expect(mockCloudflareConfig.deleteFile).toHaveBeenCalledWith(
        'https://r2.example.com/old-member.png',
      );
    });

    it('throws NotFoundException for an unknown member', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);

      await expect(
        service.updateFamilyTreeMember(
          { id: '550e8400-e29b-41d4-a716-446655440000', familyTreeId: tree.id },
          { name: 'Ghost' },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteFamilyTreeMember', () => {
    it('removes a leaf member from the database', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const target = await seedMember(getTestDb(), tree.id);

      await seedMember(getTestDb(), tree.id);

      await service.deleteFamilyTreeMember({
        id: target.id,
        familyTreeId: tree.id,
      });

      await expect(
        service.getFamilyTreeMember({ id: target.id, familyTreeId: tree.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when deleting the last member', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const last = await seedMember(getTestDb(), tree.id);

      await expect(
        service.deleteFamilyTreeMember({ id: last.id, familyTreeId: tree.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('co-deletes the spouse when they would become isolated', async () => {
      const user = await seedUser(getTestDb());
      const tree = await seedFamilyTree(getTestDb(), user.id);
      const husband = await seedMember(getTestDb(), tree.id, {
        gender: UserGenderEnum.MALE,
      });

      const wife = await service.createFamilyTreeMemberSpouse(tree.id, {
        fromMemberId: husband.id,
      });

      const extra = await seedMember(getTestDb(), tree.id);

      await service.deleteFamilyTreeMember({
        id: husband.id,
        familyTreeId: tree.id,
      });

      await expect(
        service.getFamilyTreeMember({ id: husband.id, familyTreeId: tree.id }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.getFamilyTreeMember({ id: wife.id, familyTreeId: tree.id }),
      ).rejects.toThrow(NotFoundException);

      const survivors = await service.getAllFamilyTreeMembers({
        familyTreeId: tree.id,
      });

      expect(survivors).toHaveLength(1);
      expect(survivors[0].id).toBe(extra.id);
    });
  });
});
