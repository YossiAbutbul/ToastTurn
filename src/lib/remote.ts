import { firestore } from './firebase';
import type { Family, Person, Turn } from './types';

/** What the other phones publish. Null means no such family up there yet. */
export type RemoteFamily = {
  id: string;
  ownerUid?: string;
  ownerPersonId?: string;
  name: string;
  people: Person[];
  turns: Turn[];
  removed?: string[];
} | null;

type FamilyDoc = {
  name?: string;
  /**
   * Where the rotation used to live, before each person became a document.
   * Read as a fallback so a family written by an older phone still opens.
   */
  people?: Person[];
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
 * Watches one family, its people and its turns. Fires on every change from any
 * phone, and immediately with whatever the offline cache already holds.
 *
 * The people are a collection rather than a field on the family, because they
 * are the one part of the rotation somebody other than the owner may add to:
 * putting yourself in it is how you join. A rule can say that about a document
 * of its own; it cannot say it about one entry in a list.
 */
export function subscribeFamily(
  id: string,
  /**
   * `fromServer` says whether this is the server talking or the offline cache
   * answering from memory. It only matters when the family is null: not
   * finding it in the cache means nothing, and the server saying it is not
   * there means it is gone.
   */
  onChange: (family: RemoteFamily, fromServer: boolean) => void,
): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const remote = await firestore();
    if (!remote || cancelled) return;
    const { db, fs } = remote;

    let meta: FamilyDoc | null = null;
    let people: Person[] | null = null;
    let turns: Turn[] = [];
    let sawMeta = false;
    let fromServer = false;

    const emit = () => {
      if (!sawMeta) return;
      if (!meta) return onChange(null, fromServer);
      onChange({
        id,
        ownerUid: meta.ownerUid,
        ownerPersonId: meta.ownerPersonId,
        name: meta.name ?? '',
        // An empty collection and a family written before people moved out of
        // the document look the same from here, so the old field is the
        // fallback rather than the other way round.
        people: people && people.length > 0 ? people : (meta.people ?? []),
        turns,
        removed: meta.removed ?? [],
      }, fromServer);
    };

    const stopMeta = fs.onSnapshot(fs.doc(db, 'families', id), (snap) => {
      sawMeta = true;
      fromServer = !snap.metadata.fromCache;
      meta = snap.exists() ? (snap.data() as FamilyDoc) : null;
      emit();
    });

    const stopPeople = fs.onSnapshot(fs.collection(db, 'families', id, 'people'), (snap) => {
      people = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Person, 'id'>) }))
        .filter((person) => typeof person.name === 'string')
        .sort((a, b) => a.order - b.order);
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
      stopPeople();
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
 * Publish the family itself: name and who owns it. People and turns go
 * separately, each as documents of their own. Only the owner's account may do
 * this; the server refuses anyone else.
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
      // Every phone needs these, or it hands back the turns the owner removed.
      removed: family.removed ?? [],
      updatedAt: fs.serverTimestamp(),
    }),
    { merge: true },
  );
}

/**
 * Publish the rotation, one document per person. Anyone in the family may add
 * themselves; changing somebody else is the owner's, which the server checks.
 */
export async function pushPeople(familyId: string, people: Person[]): Promise<void> {
  if (people.length === 0) return;
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;

  const batch = fs.writeBatch(db);
  for (const person of people) {
    const { id, ...rest } = person;
    batch.set(fs.doc(db, 'families', familyId, 'people', id), written(rest), { merge: true });
  }
  await batch.commit();
}

/** Take someone out of the rotation everywhere. */
export async function deletePerson(familyId: string, personId: string): Promise<void> {
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;
  await fs.deleteDoc(fs.doc(db, 'families', familyId, 'people', personId));
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
 * Write one account's claim on a person. The rules only let you write your own.
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

/**
 * Take one account's claim off the rotation.
 *
 * A phone whose person is gone already reads as unclaimed, so this is not what
 * keeps them out; it is so the members document does not fill up with claims
 * on people who left years ago.
 */
export async function dropMember(familyId: string, uid: string): Promise<void> {
  const remote = await firestore();
  if (!remote) return;
  const { db, fs } = remote;
  await fs.setDoc(
    fs.doc(db, 'families', familyId, 'prefs', 'members'),
    { [uid]: fs.deleteField() },
    { merge: true },
  );
}

/** What everyone wants, by person. */
export function subscribeOrders(
  familyId: string,
  /** `fromServer` is false while the board is only what this phone had cached. */
  onChange: (board: Record<string, unknown>, fromServer: boolean) => void,
): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    const remote = await firestore();
    if (!remote || cancelled) return;
    const { db, fs } = remote;

    stop = fs.onSnapshot(fs.doc(db, 'families', familyId, 'prefs', 'orders'), (snap) => {
      onChange(snap.exists() ? (snap.data() as Record<string, unknown>) : {}, !snap.metadata.fromCache);
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

  const [turns, people] = await Promise.all([
    fs.getDocs(fs.collection(db, 'families', familyId, 'turns')),
    fs.getDocs(fs.collection(db, 'families', familyId, 'people')),
  ]);

  const batch = fs.writeBatch(db);
  turns.forEach((turn) => batch.delete(turn.ref));
  people.forEach((person) => batch.delete(person.ref));
  batch.delete(fs.doc(db, 'families', familyId, 'prefs', 'members'));
  batch.delete(fs.doc(db, 'families', familyId, 'prefs', 'orders'));
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

/**
 * Every rotation this account runs, by id.
 *
 * The code is what names a rotation, and the code lives in a link - which is
 * exactly the thing that does not survive a phone being wiped, reinstalled or
 * swapped. The account does. So the account has to be able to ask "which ones
 * are mine", or "an account you can get back" buys nothing: whoever ran the
 * rotation signs in, is recognised, and is still shown a blank front door and
 * an offer to start a second one.
 *
 * Only ever their own. The rules hold the query to `ownerUid == you`, so this
 * cannot be turned into a way to find a rotation somebody never shared.
 */
export async function ownedFamilies(uid: string): Promise<string[]> {
  const remote = await firestore();
  if (!remote) return [];
  const { db, fs } = remote;

  // From the server, not the cache: a phone that has just been wiped has no
  // cache, and one that has not would answer with the family it already knows
  // about - which is the case this is not for.
  const found = await fs.getDocsFromServer(
    fs.query(fs.collection(db, 'families'), fs.where('ownerUid', '==', uid)),
  );
  return found.docs.map((doc) => doc.id);
}
