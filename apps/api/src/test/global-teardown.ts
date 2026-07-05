import { stopAndRemoveContainer } from './docker-cleanup';
import { CONTAINER_INFO_PATH } from './global-setup';

export default async function globalTeardown() {
  stopAndRemoveContainer(CONTAINER_INFO_PATH, 'id');
}
