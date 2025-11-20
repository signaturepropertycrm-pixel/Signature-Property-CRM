
"use client";

// This file serves as a central export point for Firebase initialization and core provider hooks.
// To avoid circular dependencies, it should not export custom data hooks like useCollection or useUser.

export { initializeApp, getApps, getApp } from 'firebase/app';
export { getAuth } from 'firebase/auth';
export { getFirestore } from 'firebase/firestore';

export * from './config';
