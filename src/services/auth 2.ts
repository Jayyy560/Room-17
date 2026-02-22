import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, UserCredential, signOut as fbSignOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { initializeUserProfile } from './firestore';

const EDU_DOMAIN = '@xyz.edu';

export const signUpWithEmail = async (
  name: string,
  email: string,
  password: string,
  promptAnswer: string,
  gender: string,
  sexuality: string,
  dateOfBirth: string,
  photoURL?: string
): Promise<UserCredential> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (cred.user) {
    await updateProfile(cred.user, { displayName: name, photoURL });
    await initializeUserProfile({
      uid: cred.user.uid,
      name,
      email,
      gender,
      sexuality,
      dateOfBirth,
      photoURL: photoURL || '',
      promptAnswer,
    });
  }
  return cred;
};

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOut = async () => fbSignOut(auth);

export const fetchUserProfile = async (uid: string) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.data();
};
