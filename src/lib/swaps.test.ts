import { describe, expect, it } from 'vitest';
import {
  acceptedToApply,
  allSwaps,
  answeredFrom,
  pendingFor,
  stillMakesSense,
  withStatus,
} from './swaps';
import type { SwapBoard, SwapRequest } from './swaps';

const ask = (over: Partial<SwapRequest> = {}): SwapRequest => ({
  id: 's1',
  fromPersonId: 'a',
  toPersonId: 'b',
  date: '2026-08-16',
  askedAt: '2026-08-16T09:00:00.000Z',
  status: 'pending',
  ...over,
});

const board = (...swaps: SwapRequest[]): SwapBoard =>
  Object.fromEntries(swaps.map((swap) => [swap.id, swap]));

describe('asking someone to take your turn', () => {
  it('puts the ask in front of the person it is addressed to', () => {
    expect(pendingFor(board(ask()), 'b')?.id).toBe('s1');
  });

  it('does not put it in front of anybody else', () => {
    expect(pendingFor(board(ask()), 'a')).toBeNull();
    expect(pendingFor(board(ask()), 'c')).toBeNull();
    expect(pendingFor(board(ask()), undefined)).toBeNull();
  });

  it('answers the oldest ask first, so nobody is jumped', () => {
    const older = ask({ id: 'old', askedAt: '2026-08-15T09:00:00.000Z' });
    const newer = ask({ id: 'new', askedAt: '2026-08-16T09:00:00.000Z' });
    expect(pendingFor(board(newer, older), 'b')?.id).toBe('old');
  });

  it('stops showing an ask once it has been answered', () => {
    expect(pendingFor(board(withStatus(ask(), 'accepted')), 'b')).toBeNull();
    expect(pendingFor(board(withStatus(ask(), 'declined')), 'b')).toBeNull();
    expect(pendingFor(board(withStatus(ask(), 'done')), 'b')).toBeNull();
  });

  it('takes the answer back to whoever asked', () => {
    expect(answeredFrom(board(withStatus(ask(), 'declined')), 'a')?.status).toBe('declined');
    expect(answeredFrom(board(ask()), 'a')).toBeNull();
    expect(answeredFrom(board(withStatus(ask(), 'done')), 'a')).toBeNull();
  });

  it('hands the owner only the ones the rotation has not caught up with', () => {
    const accepted = withStatus(ask({ id: 'yes' }), 'accepted');
    expect(acceptedToApply(board(accepted, ask({ id: 'waiting' }))).map((s) => s.id)).toEqual(['yes']);
  });

  // Someone can be taken out of the rotation between the ask and the answer.
  it('drops an ask about somebody who has since left', () => {
    expect(stillMakesSense(ask(), ['a', 'b'])).toBe(true);
    expect(stillMakesSense(ask(), ['a'])).toBe(false);
    expect(stillMakesSense(ask(), ['b', 'c'])).toBe(false);
  });

  it('ignores a half written ask rather than crashing on it', () => {
    const rubbish = { junk: true } as unknown as SwapRequest;
    expect(allSwaps({ s1: rubbish, s2: ask({ id: 's2' }) })).toHaveLength(1);
    expect(allSwaps({} as SwapBoard)).toEqual([]);
  });
});
