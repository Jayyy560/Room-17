import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  increment,
  arrayUnion,
  runTransaction,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { calculateLevel } from '../utils/levels';
import { isWithinTimeRange } from '../utils/time';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  gender: string;
  sexuality?: 'Straight' | 'Gay' | 'Lesbian' | 'Bisexual';
  dateOfBirth: string;
  photoURL: string;
  promptAnswer: string;
  braveryPoints: number;
  level: number;
  signalsRemaining: number;
  isActiveInZone: boolean;
  activeArenaId?: string | null;
  lastActivationTimestamp: any;
  pushToken?: string;
  blockedUserIds?: string[];
  reportCount?: number;
  flagged?: boolean;
};

export type Arena = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  startTime: Timestamp;
  endTime: Timestamp;
  isActive: boolean;
  createdAt?: Timestamp;
};

export const initializeUserProfile = async (data: {
  uid: string;
  name: string;
  email: string;
  gender: string;
  sexuality: string;
  dateOfBirth: string;
  photoURL: string;
  promptAnswer: string;
}) => {
  const ref = doc(db, 'users', data.uid);
  await setDoc(ref, {
    ...data,
    braveryPoints: 0,
    level: 1,
    signalsRemaining: 0,
    isActiveInZone: false,
    activeArenaId: null,
    lastActivationTimestamp: serverTimestamp(),
    blockedUserIds: [],
    reportCount: 0,
    flagged: false,
  });
};

export const updatePushToken = async (uid: string, token: string) => {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { pushToken: token });
};

export const listenArenas = (cb: (arenas: Arena[]) => void) => {
  const q = query(collection(db, 'arenas'));
  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...(docSnap.data() as any) })) as Arena[];
    cb(data);
  });
};

export const getActiveArenas = async (): Promise<Arena[]> => {
  const q = query(collection(db, 'arenas'), where('isActive', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map(docSnap => ({ id: docSnap.id, ...(docSnap.data() as any) })) as Arena[];
};

export const createArena = async (arena: Omit<Arena, 'id' | 'createdAt'>) => {
  const ref = collection(db, 'arenas');
  await addDoc(ref, { ...arena, createdAt: serverTimestamp() });
};

export const updateArena = async (arenaId: string, data: Partial<Omit<Arena, 'id' | 'createdAt'>>) => {
  const ref = doc(db, 'arenas', arenaId);
  await updateDoc(ref, data as any);
};

export const deleteArena = async (arenaId: string) => {
  await deleteDoc(doc(db, 'arenas', arenaId));
};

export const activateUserInArena = async (uid: string, arenaId: string) => {
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async tx => {
    const snap = await tx.get(userRef);
    const braveryPoints = (snap.data()?.braveryPoints || 0) + 10;
    const level = calculateLevel(braveryPoints);
    const currentArena = snap.data()?.activeArenaId || null;
    if (currentArena && currentArena !== arenaId) {
      throw new Error('Already active in another arena');
    }
    tx.update(userRef, {
      isActiveInZone: true,
      signalsRemaining: 3,
      activeArenaId: arenaId,
      lastActivationTimestamp: serverTimestamp(),
      braveryPoints,
      level,
    });
  });
  const activeRef = doc(db, 'arenas', arenaId, 'activeUsers', uid);
  await setDoc(activeRef, {
    uid,
    activatedAt: serverTimestamp(),
    signalsRemaining: 3,
  });
};

export const deactivateUserInArena = async (uid: string, arenaId: string) => {
  const userRef = doc(db, 'users', uid);
  const activeRef = doc(db, 'arenas', arenaId, 'activeUsers', uid);
  await runTransaction(db, async tx => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    tx.update(userRef, { isActiveInZone: false, activeArenaId: null });
    tx.delete(activeRef);
  });
};

export const decrementSignal = async (uid: string) => {
  const ref = doc(db, 'users', uid);
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    const current = snap.data()?.signalsRemaining || 0;
    tx.update(ref, { signalsRemaining: Math.max(0, current - 1) });
  });
};

export const listenActiveUsers = (arenaId: string, cb: (users: any[]) => void) => {
  const q = query(collection(db, 'arenas', arenaId, 'activeUsers'));
  return onSnapshot(q, async snapshot => {
    const userDocs = await Promise.all(
      snapshot.docs.map(async d => {
        const uRef = doc(db, 'users', d.id);
        const uSnap = await getDoc(uRef);
        const activeData = d.data();
        return uSnap.exists() ? { ...uSnap.data(), active: activeData } : null;
      })
    );
    cb(userDocs.filter(Boolean));
  });
};

export const listenIncomingSignals = (
  uid: string,
  arenaId: string,
  arenaStart: Date,
  arenaEnd: Date,
  cb: (signals: any[]) => void
) => {
  const q = query(
    collection(db, 'signals'),
    where('receiverId', '==', uid),
    where('arenaId', '==', arenaId)
  );
  return onSnapshot(q, async snapshot => {
    const base = snapshot.docs
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    const now = new Date();
    if (!isWithinTimeRange(now, arenaStart, arenaEnd)) {
      cb([]);
      return;
    }
    const activeSignals = base;

    const enriched = await Promise.all(
      activeSignals.map(async signal => {
        const senderSnap = await getDoc(doc(db, 'users', signal.senderId));
        const sender = senderSnap.exists() ? senderSnap.data() : null;
        return {
          ...signal,
          senderName: sender?.name || 'Someone',
          senderPhotoURL: sender?.photoURL || '',
        };
      })
    );
    cb(enriched);
  });
};

export const sendSignal = async (arenaId: string, senderId: string, receiverId: string) => {
  const senderRef = doc(db, 'users', senderId);
  const receiverRef = doc(db, 'users', receiverId);
  const signalRef = doc(db, 'signals', `${arenaId}_${senderId}_${receiverId}`);
  const reverseSignalRef = doc(db, 'signals', `${arenaId}_${receiverId}_${senderId}`);
  const matchId = `${arenaId}_${[senderId, receiverId].sort().join('_')}`;
  const matchRef = doc(db, 'matches', matchId);
  const activeRef = doc(db, 'arenas', arenaId, 'activeUsers', senderId);

  await runTransaction(db, async tx => {
    const senderSnap = await tx.get(senderRef);
    const receiverSnap = await tx.get(receiverRef);
    const activeSnap = await tx.get(activeRef);

    if (!senderSnap.exists()) throw new Error('Sender missing');
    if (!receiverSnap.exists()) throw new Error('Receiver missing');

    const sender = senderSnap.data() as any;
    const remaining = activeSnap.data()?.signalsRemaining || 0;
    if (remaining <= 0) throw new Error('Out of signals');
    if (!sender.isActiveInZone || sender.activeArenaId !== arenaId) throw new Error('Not active in arena');
    if (!activeSnap.exists()) throw new Error('Not active in zone');

    // Decrement signals atomically
    tx.update(senderRef, { signalsRemaining: remaining - 1 });
    tx.update(activeRef, { signalsRemaining: remaining - 1 });

    // Write this signal
    tx.set(signalRef, {
      arenaId,
      senderId,
      receiverId,
      createdAt: serverTimestamp(),
    });

    const reverseSnap = await tx.get(reverseSignalRef);
    const matchSnap = await tx.get(matchRef);

    if (reverseSnap.exists() && !matchSnap.exists()) {
      tx.set(matchRef, {
        arenaId,
        userA: senderId,
        userB: receiverId,
        participants: [senderId, receiverId],
        createdAt: serverTimestamp(),
        metIRL: false,
        extendedBy: [],
      });
      const senderBravery = (sender.braveryPoints || 0) + 20;
      const receiverBravery = (receiverSnap.data()?.braveryPoints || 0) + 20;
      tx.update(senderRef, { braveryPoints: senderBravery, level: calculateLevel(senderBravery) });
      tx.update(receiverRef, { braveryPoints: receiverBravery, level: calculateLevel(receiverBravery) });
      tx.delete(signalRef);
      tx.delete(reverseSignalRef);
    }
  });
};

export const listenMatches = (uid: string, arenaId: string, cb: (matches: any[]) => void) => {
  const q = query(
    collection(db, 'matches'),
    where('participants', 'array-contains', uid),
    where('arenaId', '==', arenaId)
  );
  return onSnapshot(q, async snapshot => {
    const data = await Promise.all(
      snapshot.docs.map(async d => {
        const payload: any = { id: d.id, ...d.data() };
        const otherId = payload.participants?.find((p: string) => p !== uid);
        if (otherId) {
          const otherSnap = await getDoc(doc(db, 'users', otherId));
          if (otherSnap.exists()) {
            const o = otherSnap.data();
            payload.name = o.name;
            payload.promptAnswer = o.promptAnswer;
            payload.photoURL = o.photoURL;
          }
        }
        return payload;
      })
    );
    const filtered = data.filter(match => {
      const archivedForUser = Array.isArray(match.archivedBy) && match.archivedBy.includes(uid);
      return !match.unmatched && !archivedForUser;
    });
    cb(filtered);
  });
};

export const sendMessage = async (matchId: string, senderId: string, text: string) => {
  const ref = collection(db, 'matches', matchId, 'messages');
  await addDoc(ref, {
    senderId,
    text,
    timestamp: serverTimestamp(),
  });
  const matchRef = doc(db, 'matches', matchId);
  await updateDoc(matchRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
  });
};

export const markMatchRead = async (matchId: string, uid: string) => {
  const ref = doc(db, 'matches', matchId);
  await updateDoc(ref, {
    [`lastReadBy.${uid}`]: serverTimestamp(),
  });
};

export const archiveMatch = async (matchId: string, uid: string) => {
  const ref = doc(db, 'matches', matchId);
  await updateDoc(ref, { archivedBy: arrayUnion(uid) });
};

export const unmatchMatch = async (matchId: string, uid: string) => {
  const ref = doc(db, 'matches', matchId);
  await updateDoc(ref, {
    unmatched: true,
    unmatchedBy: arrayUnion(uid),
    unmatchedAt: serverTimestamp(),
  });
};

export const listenMessages = (matchId: string, cb: (msgs: any[]) => void) => {
  const q = query(collection(db, 'matches', matchId, 'messages'));
  return onSnapshot(q, snapshot => {
    const msgs = (snapshot.docs
      .map(d => ({ id: d.id, ...(d.data() as any) })) as any[])
      .sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
    cb(msgs);
  });
};

export const extendChat = async (matchId: string, uid: string) => {
  const ref = doc(db, 'matches', matchId);
  await updateDoc(ref, { extendedBy: arrayUnion(uid) });
};

export const markMetIRL = async (matchId: string, uid: string) => {
  const ref = doc(db, 'matches', matchId);
  await updateDoc(ref, {
    metIRL: true,
    metIRLBy: arrayUnion(uid),
  });
};

export const blockUser = async (uid: string, blockedId: string) => {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { blockedUserIds: arrayUnion(blockedId) });
};

export const reportUser = async (reporterId: string, targetId: string, reason: string) => {
  const ref = collection(db, 'reports');
  await addDoc(ref, {
    reporterId,
    targetId,
    reason,
    timestamp: serverTimestamp(),
  });
  const userRef = doc(db, 'users', targetId);
  const snap = await getDoc(userRef);
  const current = snap.data()?.reportCount || 0;
  const flagged = current + 1 >= 3;
  await updateDoc(userRef, { reportCount: increment(1), flagged });
};
