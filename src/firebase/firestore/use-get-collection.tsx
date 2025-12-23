
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  getDocs,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useGetCollection hook.
 * @template T Type of the document data.
 */
export interface UseGetCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
  refresh: () => void; // Function to manually re-fetch data
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to fetch a Firestore collection or query once.
 * Handles nullable references/queries.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseGetCollectionResult<T>} Object with data, isLoading, error, and refresh function.
 */
export function useGetCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseGetCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const refresh = () => setRefreshCounter(prev => prev + 1);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    setIsLoading(true);

    const fetchData = async () => {
        try {
            const snapshot = await getDocs(memoizedTargetRefOrQuery);
            const results: ResultItemType[] = snapshot.docs.map(doc => ({
                ...(doc.data() as T),
                id: doc.id
            }));
            setData([...results]);
            setError(null);
        } catch (error: any) {
             const path: string =
                memoizedTargetRefOrQuery.type === 'collection'
                    ? (memoizedTargetRefOrQuery as CollectionReference).path
                    : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()

            const contextualError = new FirestorePermissionError({
                operation: 'list',
                path,
            });

            setError(contextualError);
            setData(null);
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchData();

  }, [memoizedTargetRefOrQuery, refreshCounter]);

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error, refresh };
}
