import { firestore } from './firebase';
import type { Family, Person, Schedule, Turn } from './types';

/** What the other phones publish. Null means no such family up there yet. */
export type RemoteFamily = {
  id: string;
  ownerUid?: string;
  name: string;
  people: Person[];
  schedule: Schedule;
  turns: Turn[];
} | null;

type FamilyDoc = { name?: string; people?: Person[]; schedule?: Schedule; ownerUid?: string };

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
        name: meta.name ?? '',
        people: meta.people ?? [],
        schedule: meta.schedule ?? { weekday: 0, time: '20:00', remind: true },
        turns,
      });
    };

    const stopMeta = fs.onSnapshot(fs.doc(db, 'families', id), (snap) => {
      sawMeta = true;
      meta = snap.exists() ? (snap.data() as FamilyDoc) : null;
      emit();
    });

    const stopTurns = fs.onSnapshot(fs.collection(db, 'families', id, 'turns'), (snap) => {
      turns = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Turn, 'id'>) }));
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
 * Publish the family itself — name, people, schedule. Turns go separately.
 * Only the owner's account may do this; the server refuses anyone else.
 */
export async function pushFamily(family: Family, ownerUid?: string): Promise<void> {
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;

  await fs.setDoc(
    fs.doc(db, 'families', family.id),
    {
      // The owner never changes hands; the server refuses writes that move it.
      ownerUid: family.ownerUid ?? ownerUid,
      name: family.name,
      people: family.people,
      schedule: family.schedule,
      updatedAt: fs.serverTimestamp(),
    },
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
  batch.delete(fs.doc(db, 'families', familyId));
  await batch.commit();
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
    batch.set(fs.doc(db, 'families', familyId, 'turns', id), rest, { merge: true });
  }
  await batch.commit();
}
