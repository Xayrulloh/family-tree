import { stopAndRemoveContainer } from './docker-cleanup';

export default async function globalTeardownE2E() {
  const containerInfoPath = process.env.E2E_CONTAINER_INFO_FILE;

  if (!containerInfoPath) return;

  stopAndRemoveContainer(containerInfoPath, 'pgId');
}
