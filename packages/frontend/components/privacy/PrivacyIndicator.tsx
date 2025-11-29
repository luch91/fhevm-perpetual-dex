'use client';

import { useState } from 'react';

interface PrivacyIndicatorProps {
  isEncrypted: boolean;
  isDecrypted: boolean;
  isDecrypting?: boolean;
  onDecrypt?: () => void;
  label?: string;
}

export function PrivacyIndicator({
  isEncrypted,
  isDecrypted,
  isDecrypting = false,
  onDecrypt,
  label = 'Value',
}: PrivacyIndicatorProps) {
  if (!isEncrypted) {
    return null; // Not using encryption
  }

  if (isDecrypted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Unlocked
      </span>
    );
  }

  if (isDecrypting) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded">
        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Decrypting...
      </span>
    );
  }

  return (
    <button
      onClick={onDecrypt}
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-semibold rounded transition-colors"
      title={`Click to decrypt ${label}`}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
      Encrypted
    </button>
  );
}

interface EncryptedValueDisplayProps {
  value: bigint | null;
  isEncrypted: boolean;
  isDecrypted: boolean;
  isDecrypting?: boolean;
  onDecrypt?: () => void;
  format?: (value: bigint) => string;
  placeholder?: string;
  decimals?: number;
}

export function EncryptedValueDisplay({
  value,
  isEncrypted,
  isDecrypted,
  isDecrypting = false,
  onDecrypt,
  format,
  placeholder = '•••',
  decimals = 6,
}: EncryptedValueDisplayProps) {
  const formatValue = (val: bigint): string => {
    if (format) return format(val);

    // Default formatting with decimals
    const divisor = BigInt(10 ** decimals);
    const intPart = val / divisor;
    const fracPart = val % divisor;

    return `${intPart}.${fracPart.toString().padStart(decimals, '0')}`;
  };

  if (!isEncrypted || isDecrypted) {
    // Show actual value
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold">
          {value !== null ? formatValue(value) : placeholder}
        </span>
        {isEncrypted && (
          <PrivacyIndicator
            isEncrypted={true}
            isDecrypted={true}
            label="value"
          />
        )}
      </div>
    );
  }

  // Show encrypted placeholder
  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-gray-500">{placeholder}</span>
      <PrivacyIndicator
        isEncrypted={true}
        isDecrypted={false}
        isDecrypting={isDecrypting}
        onDecrypt={onDecrypt}
        label="value"
      />
    </div>
  );
}

interface PrivacyBannerProps {
  hasKeypair: boolean;
  fhevmReady: boolean;
  onGenerateKeypair?: () => void;
}

export function PrivacyBanner({
  hasKeypair,
  fhevmReady,
  onGenerateKeypair,
}: PrivacyBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (!fhevmReady) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-yellow-500 mb-1">Initializing Privacy Features</h4>
            <p className="text-xs text-gray-400">Setting up FHE encryption system...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasKeypair) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-400 mb-1">Privacy Keypair Required</h4>
            <p className="text-xs text-gray-400 mb-3">
              Generate an encryption keypair to decrypt your private position data.
            </p>
            <button
              onClick={onGenerateKeypair}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded transition-colors"
            >
              Generate Keypair
            </button>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-500 hover:text-gray-400"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-green-400 mb-1">🔐 Privacy Enabled</h4>
          <p className="text-xs text-gray-400">
            Your positions are encrypted. Only you can decrypt your data.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-400"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default PrivacyIndicator;
