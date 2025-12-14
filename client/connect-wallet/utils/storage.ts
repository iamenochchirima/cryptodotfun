import { WalletState } from '../types';

const STORAGE_KEY = 'standalone-wallet-connection';

/**
 * Save wallet state to localStorage
 */
export function saveWalletState(state: WalletState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save wallet state to localStorage:', error);
  }
}

/**
 * Load wallet state from localStorage
 */
export function loadWalletState(): WalletState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as WalletState;

    // Validate the loaded state has required fields
    if (
      typeof parsed.isConnected === 'boolean' &&
      parsed.chain !== undefined &&
      parsed.walletType !== undefined &&
      parsed.address !== undefined
    ) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('Failed to load wallet state from localStorage:', error);
    return null;
  }
}

/**
 * Clear wallet state from localStorage
 */
export function clearWalletState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear wallet state from localStorage:', error);
  }
}
