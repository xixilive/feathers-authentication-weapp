const Strategy = require('../src')

const buildResolver = ({found = true, patch = true} = {}) => () => {
  return (buildResolver.current = {
    decryptData: jest.fn(() => Promise.resolve('decrypted data')),
    findEntity: jest.fn(() => found ? Promise.resolve('exist user') : Promise.resolve(null)),
    patchEntity: patch ? jest.fn(() => Promise.resolve('updated user')) : null,
    createEntity: jest.fn(() => Promise.resolve('new user'))
  })
}

// fake feathersjs authentication setup
const setupStrategy = (strategy) => {
  strategy.name = 'weapp'
  strategy.entityService = 'entityService'
  strategy.authentication = {
    configuration: {
      entity: 'account'
    }
  }
}

describe('strategy', () => {
  it('should update exists entity, and authenticate success', async() => {
    const strategy = new Strategy(buildResolver())
    setupStrategy(strategy)
    const resolver = buildResolver.current
    const result = await strategy.authenticate('rawdata', 'params')
    
    expect(result).toEqual({authentication: {strategy: 'weapp'}, account: 'updated user'})
    
    expect(resolver.decryptData).toHaveBeenCalledWith('rawdata', 'params')
    expect(resolver.findEntity).toHaveBeenCalledWith('decrypted data', 'params')
    expect(resolver.patchEntity).toHaveBeenCalledWith('exist user', 'decrypted data', 'params')
    expect(resolver.createEntity).not.toHaveBeenCalled()
  })

  it('should create new entity, and authenticate success', async() => {
    const strategy = new Strategy(buildResolver({found: false}))
    setupStrategy(strategy)
    const resolver = buildResolver.current
    const result = await strategy.authenticate('rawdata', 'params')

    expect(result).toEqual({authentication: {strategy: 'weapp'}, account: 'new user'})

    expect(resolver.decryptData).toHaveBeenCalledWith('rawdata', 'params')
    expect(resolver.findEntity).toHaveBeenCalledWith('decrypted data', 'params')
    expect(resolver.createEntity).toHaveBeenCalledWith('decrypted data', 'params')
    expect(resolver.patchEntity).not.toHaveBeenCalled()
  })

  it('should return exits entity without update, and authenticate success', async() => {
    const strategy = new Strategy(buildResolver({patch: false}))
    setupStrategy(strategy)
    const resolver = buildResolver.current
    const result = await strategy.authenticate('rawdata', 'params')

    expect(result).toEqual({authentication: {strategy: 'weapp'}, account: 'exist user'})

    expect(resolver.decryptData).toHaveBeenCalledWith('rawdata', 'params')
    expect(resolver.findEntity).toHaveBeenCalledWith('decrypted data', 'params')
    expect(resolver.createEntity).not.toHaveBeenCalled()
  })
})