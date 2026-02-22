import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
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
import { activationWindowBounds, isInActivationWindow } from '../utils/time';

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
  lastActivationTimestamp: any;
  pushToken?: string;
  blockedUserIds?: string[];
  reportCount?: number;
  flagged?: boolean;
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

export const activateUserInZone = async (uid: string, zoneId: string) => {
  const userRef = doc(db, 'users', uid);
  await runTransaction(db, async tx => {
    const snap = await tx.get(userRef);
    const braveryPoints = (snap.data()?.braveryPoints || 0) + 10;
    const level = calculateLevel(braveryPoints);
    tx.update(userRef, {
      isActiveInZone: true,
      signalsRemaining: 3,
      lastActivationTimestamp: serverTimestamp(),
      braveryPoints,
      level,
    });
  });
  const activeRef = doc(db, 'activeUsers', uid);
  await setDoc(activeRef, {
    uid,
    zoneId,
    activatedAt: serverTimestamp(),
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

export const listenActiveUsers = (zoneId: string, cb: (users: any[]) => void) => {
  const q = query(collection(db, 'activeUsers'), where('zoneId', '==', zoneId));
  return onSnapshot(q, async snapshot => {
    const userDocs = await Promise.all(
      snapshot.docs.map(async d => {
        const uRef = doc(db, 'users', d.id);
        const uSnap = await getDoc(uRef);
        return uSnap.exists() ? uSnap.data() : null;
      })
    );
    cb(userDocs.filter(Boolean));
  });
};

export const listenIncomingSignals = (uid: string, cb: (signals: any[]) => void) => {
  const q = query(collection(db, 'signals'), where('receiverId', '==', uid));
  return onSnapshot(q, async snapshot => {
    const base = snapshot.docs
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
    const now = new Date();
    const { start, end } = activationWindowBounds(now);

    // Clean out signals that are outside today's activation window so they disappear after 5 PM.
    const stale = base.filter(sig => {
      const ts = sig.timestamp?.toDate?.();
      return !ts || ts < start || ts > end;
    });
    if (stale.length) {
      await Promise.all(stale.map(sig => deleteDoc(doc(db, 'signals', sig.id))));
    }

    // When outside the window, surface nothing to the UI.
    if (!isInActivationWindow(now)) {
      cb([]);
      return;
    }

    const activeSignals = base.filter(sig => {
      const ts = sig.timestamp?.toDate?.();
      return ts && ts >= start && ts <= end;
    });

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

export const sendSignal = async (senderId: string, receiverId: string) => {
  const now = new Date();
  if (!isInActivationWindow(now)) {
    throw new Error('Activation window is closed');
  }

  const senderRef = doc(db, 'users', senderId);
  const receiverRef = doc(db, 'users', receiverId);
  const signalRef = doc(db, 'signals', `${senderId}_${receiverId}`);
  const reverseSignalRef = doc(db, 'signals', `${receiverId}_${senderId}`);
  const matchId = [senderId, receiverId].sort().join('_');
  const matchRef = doc(db, 'matches', matchId);
  const activeRef = doc(db, 'activeUsers', senderId);

  await runTransaction(db, async tx => {
    const senderSnap = await tx.get(senderRef);
    const receiverSnap = await tx.get(receiverRef);
    const activeSnap = await tx.get(activeRef);

    if (!senderSnap.exists()) throw new Error('Sender missing');
    if (!receiverSnap.exists()) throw new Error('Receiver missing');

    const sender = senderSnap.data() as any;
    const remaining = sender.signalsRemaining || 0;
    if (remaining <= 0) throw new Error('Out of signals');
    if (!sender.isActiveInZone) throw new Error('Not active in zone');
    if (!activeSnap.exists()) throw new Error('Not active in zone');

    // Decrement signals atomically
    tx.update(senderRef, { signalsRemaining: remaining - 1 });

    // Write this signal
    tx.set(signalRef, {
      senderId,
      receiverId,
      timestamp: serverTimestamp(),
    });

    const reverseSnap = await tx.get(reverseSignalRef);
    const matchSnap = await tx.get(matchRef);

    if (reverseSnap.exists() && !matchSnap.exists()) {
      tx.set(matchRef, {
        userA: senderId,
        userB: receiverId,
        participants: [senderId, receiverId],
        createdAt: serverTimestamp(),
        metIRL: false,
        extendedBy: [],
      });
      tx.delete(signalRef);
      tx.delete(reverseSignalRef);
    }
  });
};

export const listenMatches = (uid: string, cb: (matches: any[]) => void) => {
  const q = query(collection(db, 'matches'), where('participants', 'array-contains', uid));
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
