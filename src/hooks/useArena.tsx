import React, { createContext, useContext, useMemo, useState } from 'react';
import { Arena } from '../services/firestore';

type ArenaContextValue = {
  arena: Arena | null;
  setArena: (arena: Arena | null) => void;
};

const ArenaContext = createContext<ArenaContextValue>({ arena: null, setArena: () => undefined });

export const ArenaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [arena, setArena] = useState<Arena | null>(null);
  const value = useMemo(() => ({ arena, setArena }), [arena]);
  return <ArenaContext.Provider value={value}>{children}</ArenaContext.Provider>;
};

export const useArenaContext = () => useContext(ArenaContext);
