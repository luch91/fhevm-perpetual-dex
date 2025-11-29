import { logger } from '../logger'

describe('logger', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('should provide logging methods', () => {
    // Logger has all required methods
    expect(logger.log).toBeDefined()
    expect(logger.warn).toBeDefined()
    expect(logger.error).toBeDefined()
    expect(logger.debug).toBeDefined()
    expect(logger.info).toBeDefined()
  })

  it('should always log errors', () => {
    logger.error('error message')
    expect(consoleErrorSpy).toHaveBeenCalledWith('error message')
  })

  it('should handle multiple arguments in error', () => {
    logger.error('error', { data: 'test' }, 123)
    expect(consoleErrorSpy).toHaveBeenCalledWith('error', { data: 'test' }, 123)
  })
})
