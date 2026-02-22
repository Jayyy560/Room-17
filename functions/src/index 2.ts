import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();

const db = getFirestore();

const calculateLevel = (braveryPoints: number) => {
  if (braveryPoints >= 300) return 4;
  if (braveryPoints >= 150) return 3;
  if (braveryPoints >= 50) return 2;
  return 1;
};

const bumpBravery = async (uid: string, delta: number) => {
  const ref = db.collection('users').doc(uid);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const current = (snap.data()?.braveryPoints || 0) + delta;
    tx.update(ref, { braveryPoints: current, level: calculateLevel(current) });
  });
};

const sendPush = async (tokens: string[], title: string, body: string) => {
  if (!tokens.length) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tokens.map(token => ({ to: token, title, body }))),
  });
};

export const onSignalCreate = onDocumentCreated('signals/{signalId}', async event => {
  const payload = event.data?.data() as { senderId: string; receiverId: string } | undefined;
  if (!payload) return;
  const { senderId, receiverId } = payload;

  const reverse = await db
    .collection('signals')
    .where('senderId', '==', receiverId)
    .where('receiverId', '==', senderId)
    .limit(1)
    .get();

  if (reverse.empty) return;

  const existing = await db
    .collection('matches')
    .where('participants', 'array-contains', senderId)
    .get();

  const alreadyMatched = existing.docs.some(doc => {
    const participants = doc.data().participants || [];
    return participants.includes(receiverId);
  });

  if (!alreadyMatched) {
    await db.collection('matches').add({
      userA: senderId,
      userB: receiverId,
      participants: [senderId, receiverId],
      createdAt: FieldValue.serverTimestamp(),
      metIRL: false,
      extendedBy: [],
    });
    await bumpBravery(senderId, 20);
    await bumpBravery(receiverId, 20);
  }

  await db.collection('signals').doc(event.params.signalId).delete();
  if (!reverse.empty) await reverse.docs[0].ref.delete();

  const senderSnap = await db.collection('users').doc(senderId).get();
  const receiverSnap = await db.collection('users').doc(receiverId).get();
  const senderToken = senderSnap.data()?.pushToken;
  const receiverToken = receiverSnap.data()?.pushToken;
  const tokens = [senderToken, receiverToken].filter(Boolean) as string[];
  if (tokens.length) {
    await sendPush(tokens, 'New match!', 'A mutual signal locked in. Open the arena.');
  }
});

export const onMatchUpdate = onDocumentUpdated('matches/{matchId}', async event => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;
  const metByBefore = before.metIRLBy || [];
  const metByAfter = after.metIRLBy || [];
  const newlyBoth = metByAfter.length >= 2 && metByBefore.length < 2 && !after.metIRLAwarded;
  if (newlyBoth) {
    await Promise.all(metByAfter.map((uid: string) => bumpBravery(uid, 30)));
    await event.data?.after?.ref.update({ metIRLAwarded: true });
  }
});
