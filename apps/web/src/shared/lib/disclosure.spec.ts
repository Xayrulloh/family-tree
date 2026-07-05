import { describe, expect, it } from 'vitest';
import { createDisclosure } from './disclosure';

describe('createDisclosure', () => {
  it('defaults $isOpen to false when no options are provided', () => {
    const { $isOpen } = createDisclosure();

    expect($isOpen.getState()).toBe(false);
  });

  it('starts open when defaultIsOpen is true', () => {
    const { $isOpen } = createDisclosure({ defaultIsOpen: true });

    expect($isOpen.getState()).toBe(true);
  });

  it('opened() sets $isOpen to true', () => {
    const { $isOpen, opened } = createDisclosure();

    opened();

    expect($isOpen.getState()).toBe(true);
  });

  it('closed() sets $isOpen to false', () => {
    const { $isOpen, opened, closed } = createDisclosure({
      defaultIsOpen: true,
    });

    opened();

    closed();

    expect($isOpen.getState()).toBe(false);
  });

  it('toggled() flips false → true', () => {
    const { $isOpen, toggled } = createDisclosure();

    toggled();

    expect($isOpen.getState()).toBe(true);
  });

  it('toggled() flips true → false', () => {
    const { $isOpen, toggled } = createDisclosure({ defaultIsOpen: true });

    toggled();

    expect($isOpen.getState()).toBe(false);
  });

  it('changed(true) sets $isOpen to true regardless of current state', () => {
    const { $isOpen, changed } = createDisclosure();

    changed(true);

    expect($isOpen.getState()).toBe(true);
  });

  it('changed(false) sets $isOpen to false regardless of current state', () => {
    const { $isOpen, changed } = createDisclosure({ defaultIsOpen: true });

    changed(false);

    expect($isOpen.getState()).toBe(false);
  });
});
