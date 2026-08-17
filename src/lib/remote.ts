import { firestore } from './firebase';
import type { Family, Person, Schedule, Turn } from './types';

/** What the other phones publish. Null means no such family up there yet. */
export type RemoteFamily = {
  id: string;
  ownerUid?: string;
  ownerPersonId?: string;
  name: string;
  people: Person[];
  schedule: Schedule;
  turns: Turn[];
  removed?: string[];
} | null;

type FamilyDoc = {
  name?: string;
  people?: Person[];
  schedule?: Schedule;
  ownerUid?: string;
  ownerPersonId?: string;
  /** Turns the owner took off the board, so every phone drops them. */
  removed?: string[];
};

/**
 * Firestore refuses a write that carries an undefined anywhere in it, and an
 * optional field that was never filled in - a turn nobody has rated - is
 * exactly that. Absent and undefined mean the same thing here, so the key goes
 * rather than the write failing.
 */
function written<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined),
  ) as Partial<T>;
}

/**
 * Watches one family and its turns. Fires on every change from any phone, and
 * immediately with whatever the offline cache already holds.
 */
export function subscribeFamily(id: string, onChange: (family: RemoteFamily) => void): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const remote = await firestore();
    if (!remote || cancelled) return;
    const { db, fs } = remote;

    let meta: FamilyDoc | null = null;
    let turns: Turn[] = [];
    let sawMeta = false;

    const emit = () => {
      if (!sawMeta) return;
      if (!meta) return onChange(null);
      onChange({
        id,
        ownerUid: meta.ownerUid,
        ownerPersonId: meta.ownerPersonId,
        name: meta.name ?? '',
        people: meta.people ?? [],
        schedule: meta.schedule ?? { weekday: 0, time: '20:00', remind: true },
        turns,
        removed: meta.removed ?? [],
      });
    };

    const stopMeta = fs.onSnapshot(fs.doc(db, 'families', id), (snap) => {
      sawMeta = true;
      meta = snap.exists() ? (snap.data() as FamilyDoc) : null;
      emit();
    });

    const stopTurns = fs.onSnapshot(fs.collection(db, 'families', id, 'turns'), (snap) => {
      turns = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Turn, 'id'>) }))
        // A half-written turn, ratings that landed before the turn itself -
        // is not a turn yet, and would crash anything that reads its date.
        .filter((turn) => typeof turn.madeAt === 'string' && typeof turn.personId === 'string');
      emit();
    });

    stop = () => {
      stopMeta();
      stopTurns();
    };
    if (cancelled) stop();
  })();

  return () => {
    cancelled = true;
    stop?.();
  };
}

/**
 * Publish the family itself, name, people, schedule. Turns go separately.
 * Only the owner's account may do this; the server refuses anyone else.
 */
export async function pushFamily(family: Family, ownerUid?: string): Promise<void> {
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;

  await fs.setDoc(
    fs.doc(db, 'families', family.id),
    written({
      // The owner never changes hands; the server refuses writes that move it.
      ownerUid: family.ownerUid ?? ownerUid,
      ownerPersonId: family.ownerPersonId ?? null,
      name: family.name,
      people: family.people,
      schedule: family.schedule,
      // Every phone needs these, or it hands back the turns the owner removed.
      removed: family.removed ?? [],
      updatedAt: fs.serverTimestamp(),
    }),
    { merge: true },
  );
}

/** Who is in the rotation, by account id. */
export function subscribeMembers(
  familyId: string,
  onChange: (members: Record<string, unknown>) => void,
): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const remote = await firestore();
    if (!remote || cancelled) return;
    const { db, fs } = remote;

    stop = fs.onSnapshot(fs.doc(db, 'families', familyId, 'prefs', 'members'), (snap) => {
      onChange(snap.exists() ? (snap.data() as Record<string, unknown>) : {});
    });
    if (cancelled) stop();
  })();

  return () => {
    cancelled = true;
    stop?.();
  };
}

/**
 * Write one account's membership. The rules only let you write your own, and
 * only the owner may move anyone to approved.
 */
export async function pushMember(familyId: string, uid: string, entry: object): Promise<void> {
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;
  // An account with no address to give would otherwise carry an undefined into
  // the write, which the server refuses outright: nobody could ask to join.
  await fs.setDoc(
    fs.doc(db, 'families', familyId, 'prefs', 'members'),
    { [uid]: written(entry) },
    { merge: true },
  );
}

/** What everyone wants, by person. */
export function subscribeOrders(
  familyId: string,
  onChange: (board: Record<string, unknown>) => void,
): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const remote = await firestore();
    if (!remote || cancelled) return;
    const { db, fs } = remote;

    stop = fs.onSnapshot(fs.doc(db, 'families', familyId, 'prefs', 'orders'), (snap) => {
      onChange(snap.exists() ? (snap.data() as Record<string, unknown>) : {});
    });
    if (cancelled) stop();
  })();

  return () => {
    cancelled = true;
    stop?.();
  };
}

/** Put one person's order up, under their own key and nobody else's. */
export async function pushOrder(
  familyId: string,
  personId: string,
  order: unknown,
): Promise<void> {
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;
  await fs.setDoc(fs.doc(db, 'families', familyId, 'prefs', 'orders'), { [personId]: order }, { merge: true });
}

/** Which slices have been made, by person. Anybody in the family may tick. */
export function subscribeMade(
  familyId: string,
  onChange: (board: Record<string, unknown>) => void,
): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const remote = await firestore();
    if (!remote || cancelled) return;
    const { db, fs } = remote;

    stop = fs.onSnapshot(fs.doc(db, 'families', familyId, 'prefs', 'made'), (snap) => {
      onChange(snap.exists() ? (snap.data() as Record<string, unknown>) : {});
    });
    if (cancelled) stop();
  })();

  return () => {
    cancelled = true;
    stop?.();
  };
}

export async function pushMade(familyId: string, personId: string, made: number[]): Promise<void> {
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;
  await fs.setDoc(fs.doc(db, 'families', familyId, 'prefs', 'made'), { [personId]: made }, { merge: true });
}

/** Somebody wants nothing today: the order comes off the board. */
export async function dropOrder(familyId: string, personId: string): Promise<void> {
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;
  await fs.setDoc(
    fs.doc(db, 'families', familyId, 'prefs', 'orders'),
    { [personId]: fs.deleteField() },
    { merge: true },
  );
}

/** Say what you thought of a turn. The rules only let you write your own key. */
export async function pushRating(
  familyId: string,
  turnId: string,
  uid: string,
  rating: number,
): Promise<void> {
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;
  await fs.setDoc(
    fs.doc(db, 'families', familyId, 'turns', turnId),
    { ratings: { [uid]: rating } },
    { merge: true },
  );
}

/**
 * Wipe a family everywhere. Without this a phone that still holds the family
 * locally simply republishes it, and nothing can ever be deleted.
 */
export async function deleteFamily(familyId: string): Promise<void> {
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;

  const turns = await fs.getDocs(fs.collection(db, 'families', familyId, 'turns'));

  const batch = fs.writeBatch(db);
  turns.forEach((turn) => batch.delete(turn.ref));
  batch.delete(fs.doc(db, 'families', familyId, 'prefs', 'members'));
  batch.delete(fs.doc(db, 'families', familyId, 'prefs', 'orders'));
  batch.delete(fs.doc(db, 'families', familyId, 'prefs', 'made'));
  batch.delete(fs.doc(db, 'families', familyId));
  await batch.commit();
}

/** Take one turn off the board everywhere. The server only lets the owner. */
export async function deleteTurn(familyId: string, turnId: string): Promise<void> {
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;
  await fs.deleteDoc(fs.doc(db, 'families', familyId, 'turns', turnId));
}

/** Turns are append-only, so each one is written under its own id. */
export async function pushTurns(familyId: string, turns: Turn[]): Promise<void> {
  if (turns.length === 0) return;
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;

  const batch = fs.writeBatch(db);
  for (const turn of turns) {
    const { id, ...rest } = turn;
    batch.set(fs.doc(db, 'families', familyId, 'turns', id), written(rest), { merge: true });
  }
  await batch.commit();
}
