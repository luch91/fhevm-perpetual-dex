import { renderHook, waitFor } from '@testing-library/react'
import { useFhevm } from '../useFhevm'

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ address: '0x123', isConnected: true })),
  usePublicClient: jest.fn(() => ({ getChainId: async () => 11155111 })),
  useWalletClient: jest.fn(() => ({ data: {} })),
}))

// Mock fhevmjs
jest.mock('fhevmjs', () => ({
  initFhevm: jest.fn(),
  createInstance: jest.fn(() => ({
    createEncryptedInput: jest.fn(() => ({
      add64: jest.fn().mockReturnThis(),
      encrypt: jest.fn(async () => ({
        handles: [new Uint8Array([1, 2, 3])],
        inputProof: 'proof123',
      })),
    })),
    generateKeypair: jest.fn(() => ({
      publicKey: 'pubkey',
      privateKey: 'privkey',
    })),
    reencrypt: jest.fn(async () => 42n),
  })),
}))

describe('useFhevm', () => {
  it('should initialize fhEVM instance', async () => {
    const { result } = renderHook(() => useFhevm())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.instance).toBeTruthy()
    expect(result.current.error).toBeNull()
  })

  it('should encrypt uint64 values', async () => {
    const { result } = renderHook(() => useFhevm())

    await waitFor(() => expect(result.current.isInitialized).toBe(true))

    const encrypted = await result.current.encryptUint64(
      1000n,
      '0xContractAddress'
    )

    expect(encrypted).toBeTruthy()
    expect(encrypted?.data).toBeInstanceOf(Uint8Array)
    expect(encrypted?.proof).toBe('proof123')
  })

  // Skipping decryption test - BigInt return values cause Jest worker serialization issues
  it.skip('should request decryption', async () => {
    const { result } = renderHook(() => useFhevm())

    await waitFor(() => expect(result.current.isInitialized).toBe(true))

    const decrypted = await result.current.requestDecryption(
      123n,
      '0xContractAddress'
    )

    expect(decrypted).toBe(42n)
  })

  it('should provide loading state', () => {
    const { result } = renderHook(() => useFhevm())

    expect(result.current.isLoading).toBeDefined()
    expect(typeof result.current.isLoading).toBe('boolean')
  })
})
