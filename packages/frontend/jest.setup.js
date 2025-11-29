// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Fix BigInt serialization in Jest
BigInt.prototype.toJSON = function() {
  return this.toString()
}

// Mock environment variables
process.env.NEXT_PUBLIC_CHAIN_ID = '11155111'
process.env.NEXT_PUBLIC_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/test'
process.env.NEXT_PUBLIC_GATEWAY_URL = 'https://gateway.sepolia.zama.ai'
process.env.NEXT_PUBLIC_CHAINLINK_ORACLE_ADDRESS = '0x45328039a3F8a5502e34Ee9038b1649e33eF4600'
process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS = '0x4cc313cd04647ec2380e7aFca10FfDdF528FE995'
process.env.NEXT_PUBLIC_USDC_ADDRESS = '0xD443Fe9E97732EBE6Cc5A6D638D5cda3A1F489DF'
