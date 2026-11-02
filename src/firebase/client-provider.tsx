'use client';

import React, { useMemo, useEffect } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export const FirebaseClientProvider = ({ children }: { children: React.ReactNode }) => {
  const { firebaseApp, auth, firestore } = useMemo(() => initializeFirebase(), []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__MP_APP_INITIALIZED__ = true;
    }
  }, []);

  return (
    <FirebaseProvider firebaseApp={firebaseApp} auth={auth} firestore={firestore}>
      {children}
    </FirebaseProvider>
  );
};
