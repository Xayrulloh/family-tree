import { createApi, createStore, Store } from 'effector';

type Props = {
  defaultIsOpen?: boolean;
};

export function createDisclosure(options: Props = {}) {
  const { defaultIsOpen = false } = options;

  const $isOpen = createStore(defaultIsOpen);

  const events = createApi($isOpen, {
    opened: () => true,
    closed: () => false,

    toggled: (isOpen) => !isOpen,
    changed: (_, isOpen: boolean) => isOpen,
  });

  return {
    $isOpen: $isOpen as Store<boolean>,
    ...events,
  };
}
