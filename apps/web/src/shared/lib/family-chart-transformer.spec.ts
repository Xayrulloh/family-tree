import {
  FamilyTreeMemberConnectionEnum,
  type FamilyTreeMemberConnectionGetAllResponseType,
  type FamilyTreeMemberGetAllResponseType,
  UserGenderEnum,
} from '@family-tree/shared';
import { describe, expect, it } from 'vitest';
import { toF3Data } from './family-chart-transformer';

const BASE = {
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  deletedAt: null,
};

function makeMember(
  id: string,
  gender: UserGenderEnum.MALE | UserGenderEnum.FEMALE = UserGenderEnum.MALE,
  overrides: Partial<FamilyTreeMemberGetAllResponseType[number]> = {},
): FamilyTreeMemberGetAllResponseType[number] {
  return {
    id,
    name: `Member ${id}`,
    gender,
    image: null,
    dob: null,
    dod: null,
    description: null,
    familyTreeId: 'tree-1',
    ...BASE,
    ...overrides,
  };
}

function makeConnection(
  fromMemberId: string,
  toMemberId: string,
  type: FamilyTreeMemberConnectionEnum,
): FamilyTreeMemberConnectionGetAllResponseType[number] {
  return {
    id: `conn-${fromMemberId}-${toMemberId}`,
    fromMemberId,
    toMemberId,
    type,
    ...BASE,
  };
}

describe('toF3Data', () => {
  it('returns an empty array when there are no members', () => {
    expect(toF3Data([], [])).toEqual([]);
  });

  it('maps a single member with no connections correctly', () => {
    const [result] = toF3Data([makeMember('a')], []);

    expect(result.id).toBe('a');
    expect(result.data.name).toBe('Member a');
    expect(result.rels.spouses).toEqual([]);
    expect(result.rels.children).toEqual([]);
    expect(result.rels.parents).toEqual([]);
  });

  it('maps MALE gender to "M"', () => {
    const [result] = toF3Data([makeMember('a', UserGenderEnum.MALE)], []);

    expect(result.data.gender).toBe('M');
  });

  it('maps FEMALE gender to "F"', () => {
    const [result] = toF3Data([makeMember('a', UserGenderEnum.FEMALE)], []);

    expect(result.data.gender).toBe('F');
  });

  it('passes through optional member data fields', () => {
    const member = makeMember('a', UserGenderEnum.MALE, {
      dob: '2000-01-01',
      dod: '2024-01-01',
      image: 'https://example.com/img.png',
      familyTreeId: 'tree-99',
    });

    const [result] = toF3Data([member], []);

    expect(result.data.dob).toBe('2000-01-01');
    expect(result.data.dod).toBe('2024-01-01');
    expect(result.data.image).toBe('https://example.com/img.png');
    expect(result.data.familyTreeId).toBe('tree-99');
  });

  describe('SPOUSE connections', () => {
    it('creates bidirectional spouse links', () => {
      const members = [makeMember('a'), makeMember('b', UserGenderEnum.FEMALE)];
      const connections = [
        makeConnection('a', 'b', FamilyTreeMemberConnectionEnum.SPOUSE),
      ];

      const result = toF3Data(members, connections);
      const a = result.find((d) => d.id === 'a')!;
      const b = result.find((d) => d.id === 'b')!;

      expect(a.rels.spouses).toEqual(['b']);
      expect(b.rels.spouses).toEqual(['a']);
    });
  });

  describe('PARENT connections', () => {
    it('sets children on the parent and parents on the child', () => {
      const members = [
        makeMember('parent'),
        makeMember('child', UserGenderEnum.FEMALE),
      ];
      const connections = [
        makeConnection(
          'parent',
          'child',
          FamilyTreeMemberConnectionEnum.PARENT,
        ),
      ];

      const result = toF3Data(members, connections);
      const parent = result.find((d) => d.id === 'parent')!;
      const child = result.find((d) => d.id === 'child')!;

      expect(parent.rels.children).toEqual(['child']);
      expect(parent.rels.parents).toEqual([]);
      expect(child.rels.parents).toEqual(['parent']);
      expect(child.rels.children).toEqual([]);
    });

    it('accumulates multiple children on a parent', () => {
      const members = [
        makeMember('parent'),
        makeMember('c1', UserGenderEnum.FEMALE),
        makeMember('c2'),
      ];
      const connections = [
        makeConnection('parent', 'c1', FamilyTreeMemberConnectionEnum.PARENT),
        makeConnection('parent', 'c2', FamilyTreeMemberConnectionEnum.PARENT),
      ];

      const parent = toF3Data(members, connections).find(
        (d) => d.id === 'parent',
      )!;

      expect(parent.rels.children).toContain('c1');
      expect(parent.rels.children).toContain('c2');
    });
  });

  describe('couple with child', () => {
    it('combines spouse and parent links correctly', () => {
      const members = [
        makeMember('dad'),
        makeMember('mom', UserGenderEnum.FEMALE),
        makeMember('kid', UserGenderEnum.FEMALE),
      ];
      const connections = [
        makeConnection('dad', 'mom', FamilyTreeMemberConnectionEnum.SPOUSE),
        makeConnection('dad', 'kid', FamilyTreeMemberConnectionEnum.PARENT),
        makeConnection('mom', 'kid', FamilyTreeMemberConnectionEnum.PARENT),
      ];

      const result = toF3Data(members, connections);
      const dad = result.find((d) => d.id === 'dad')!;
      const mom = result.find((d) => d.id === 'mom')!;
      const kid = result.find((d) => d.id === 'kid')!;

      expect(dad.rels.spouses).toEqual(['mom']);
      expect(mom.rels.spouses).toEqual(['dad']);
      expect(dad.rels.children).toEqual(['kid']);
      expect(mom.rels.children).toEqual(['kid']);
      expect(kid.rels.parents).toContain('dad');
      expect(kid.rels.parents).toContain('mom');
      expect(kid.rels.spouses).toEqual([]);
    });
  });

  describe('mainMemberId reordering', () => {
    it('moves mainMemberId to index 0 when it is not already first', () => {
      const members = [makeMember('a'), makeMember('b'), makeMember('c')];
      const result = toF3Data(members, [], 'c');

      expect(result[0].id).toBe('c');
      expect(result.map((d) => d.id)).toContain('a');
      expect(result.map((d) => d.id)).toContain('b');
    });

    it('leaves order unchanged when mainMemberId is already at index 0', () => {
      const members = [makeMember('a'), makeMember('b'), makeMember('c')];
      const result = toF3Data(members, [], 'a');

      expect(result[0].id).toBe('a');
    });

    it('leaves order unchanged when mainMemberId is not found', () => {
      const members = [makeMember('a'), makeMember('b')];
      const result = toF3Data(members, [], 'nonexistent');

      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
    });

    it('leaves order unchanged when mainMemberId is null', () => {
      const members = [makeMember('a'), makeMember('b')];
      const result = toF3Data(members, [], null);

      expect(result[0].id).toBe('a');
    });
  });
});
