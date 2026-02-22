declare module '@firebase/auth/dist/rn/index' {
  export function getReactNativePersistence(storage: {
    setItem: (key: string, value: string) => Promise<void> | void;
    getItem: (key: string) => Promise<string | null> | string | null;
    removeItem: (key: string) => Promise<void> | void;
  }): import('firebase/auth').Persistence;
}
