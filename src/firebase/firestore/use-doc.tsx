'use client';

import { useState, useEffect } from 'react';
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
  const [loadedPath, setLoadedPath] = useState<string | null>(null);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setLoading(false);
      setLoadedPath(null);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? ({ ...snapshot.data()!, id: snapshot.id } as T) : null);
        setLoading(false);
        setLoadedPath(docRef.path);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
        setLoadedPath(docRef.path);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  const currentPath = docRef?.path || null;
  const isActuallyLoading = docRef ? (loading || loadedPath !== currentPath) : true;

  return { data, loading: isActuallyLoading, error };
}

