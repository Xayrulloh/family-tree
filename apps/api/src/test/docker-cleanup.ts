import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';

/**
 * Stops and removes the container whose id is stored under `idKey` in the
 * JSON file at `infoFilePath`, then deletes the file. Shared by the
 * integration and E2E global teardowns.
 */
export function stopAndRemoveContainer(
  infoFilePath: string,
  idKey: string,
): void {
  if (!existsSync(infoFilePath)) return;

  const info = JSON.parse(readFileSync(infoFilePath, 'utf-8')) as Record<
    string,
    string
  >;

  const containerId = info[idKey];

  if (containerId) {
    try {
      execFileSync('docker', ['stop', containerId], { stdio: 'ignore' });
      execFileSync('docker', ['rm', containerId], { stdio: 'ignore' });
    } catch {
      // Ryuk will clean up if docker commands fail
    }
  }

  unlinkSync(infoFilePath);
}
