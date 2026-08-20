'use client';

import { useState, useEffect, useRef } from 'react';
import {
  onSnapshot,
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
  FirestoreError,
} from 'firebase/firestore';

export function useDoc<T = DocumentData>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const lastRefPath = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = docRef?.path || null;
    
    // Jika ref null, set loading false dan data null
    if (!docRef) {
      setData(null);
      setLoading(false);
      lastRefPath.current = null;
      return;
    }

    // Jika path berbeda, berarti kita mulai memuat dokumen baru
    if (currentPath !== lastRefPath.current) {
      setLoading(true);
      lastRefPath.current = currentPath;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...snapshot.data()!, id: snapshot.id } : null);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
}
