import { allSettled, fork } from 'effector';
import { describe, expect, it, vi } from 'vitest';
import { $messageApi, errorFx, infoFx, successFx } from './message';

type MessageApi = NonNullable<ReturnType<(typeof $messageApi)['getState']>>;

const makeMessageApi = () => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
});

describe('shared/lib/message', () => {
  it('successFx forwards the payload to messageApi.success', async () => {
    const messageApi = makeMessageApi();
    const scope = fork({
      values: [[$messageApi, messageApi as unknown as MessageApi]],
    });

    await allSettled(successFx, { scope, params: 'Created successfully' });

    expect(messageApi.success).toHaveBeenCalledWith('Created successfully');
  });

  it('errorFx forwards the payload to messageApi.error', async () => {
    const messageApi = makeMessageApi();
    const scope = fork({
      values: [[$messageApi, messageApi as unknown as MessageApi]],
    });

    await allSettled(errorFx, { scope, params: 'Something went wrong' });

    expect(messageApi.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('infoFx forwards the payload to messageApi.info', async () => {
    const messageApi = makeMessageApi();
    const scope = fork({
      values: [[$messageApi, messageApi as unknown as MessageApi]],
    });

    await allSettled(infoFx, { scope, params: 'Heads up' });

    expect(messageApi.info).toHaveBeenCalledWith('Heads up');
  });

  it('resolves silently when no message instance is mounted yet', async () => {
    const scope = fork();

    const result = await allSettled(successFx, { scope, params: 'ignored' });

    expect(result.status).toBe('done');
  });
});
