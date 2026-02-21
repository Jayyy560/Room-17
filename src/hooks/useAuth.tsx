import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { UserProfile } from '../services/firestore';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

const AuthContext = createContext<{
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}>({ user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsub: (() => void) | undefined;
    const unsub = onAuthStateChanged(auth, current => {
      setUser(current);
      if (profileUnsub) profileUnsub();
      if (current) {
        const ref = doc(db, 'users', current.uid);
        profileUnsub = onSnapshot(ref, async snap => {
          const data = snap.data() as UserProfile | undefined;
          if (data && !data.sexuality) {
            await updateDoc(ref, { sexuality: 'Straight' });
            setProfile({ ...data, sexuality: 'Straight' });
          } else {
            setProfile(data || null);
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => {
      if (profileUnsub) profileUnsub();
      unsub();
    };
  }, []);

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
