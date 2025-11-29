'use client';

/**
 * FHE Keypair Management
 * Handles user keypair generation, storage, and retrieval for decrypting encrypted positions
 */

const KEYPAIR_STORAGE_KEY = 'fhevm_user_keypair';
const KEYPAIR_VERSION = '1.0';

export interface FhevmKeypair {
  publicKey: string;
  privateKey: string;
  version: string;
  createdAt: number;
}

/**
 * Generate a new FHE keypair for the user
 */
export async function generateKeypair(): Promise<FhevmKeypair> {
  if (typeof window === 'undefined') {
    throw new Error('Keypair generation only available on client side');
  }

  try {
    const fhevm = await import('fhevmjs');

    // Generate keypair using fhevmjs
    const { publicKey, privateKey } = fhevm.generateKeypair();

    const keypair: FhevmKeypair = {
      publicKey,
      privateKey,
      version: KEYPAIR_VERSION,
      createdAt: Date.now(),
    };

    return keypair;
  } catch (error) {
    console.error('Failed to generate keypair:', error);
    throw new Error('Keypair generation failed');
  }
}

/**
 * Save keypair to localStorage
 */
export function saveKeypair(keypair: FhevmKeypair): void {
  if (typeof window === 'undefined') return;

  try {
    const encrypted = btoa(JSON.stringify(keypair));
    localStorage.setItem(KEYPAIR_STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to save keypair:', error);
    throw new Error('Keypair save failed');
  }
}

/**
 * Load keypair from localStorage
 */
export function loadKeypair(): FhevmKeypair | null {
  if (typeof window === 'undefined') return null;

  try {
    const encrypted = localStorage.getItem(KEYPAIR_STORAGE_KEY);
    if (!encrypted) return null;

    const decrypted = atob(encrypted);
    const keypair = JSON.parse(decrypted) as FhevmKeypair;

    // Validate keypair structure
    if (!keypair.publicKey || !keypair.privateKey || !keypair.version) {
      console.warn('Invalid keypair structure');
      return null;
    }

    return keypair;
  } catch (error) {
    console.error('Failed to load keypair:', error);
    return null;
  }
}

/**
 * Delete keypair from localStorage
 */
export function deleteKeypair(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYPAIR_STORAGE_KEY);
}

/**
 * Check if user has a keypair
 */
export function hasKeypair(): boolean {
  return loadKeypair() !== null;
}

/**
 * Get or generate keypair (lazy initialization)
 */
export async function getOrCreateKeypair(): Promise<FhevmKeypair> {
  // Try to load existing keypair
  const existing = loadKeypair();
  if (existing) {
    return existing;
  }

  // Generate new keypair if none exists
  const newKeypair = await generateKeypair();
  saveKeypair(newKeypair);
  return newKeypair;
}

/**
 * Rotate keypair (generate new one and delete old)
 */
export async function rotateKeypair(): Promise<FhevmKeypair> {
  deleteKeypair();
  const newKeypair = await generateKeypair();
  saveKeypair(newKeypair);
  return newKeypair;
}
