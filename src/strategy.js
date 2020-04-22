// weapp auth strategy

/**
 * resolver function signature
 * 
 * ```
 *  function resolver(strategy) {
 *    return {
 *      // to decrypt encrypted data which posted by clients
 *      async decryptData(rawData, params) {},
 * 
 *      // to find an entity with specified auth-data
 *      async findEntity(authData, params) {},
 * 
 *      // optional, to update an entity with specified auth-data
 *      async patchEntity(entity, authData, params) {},
 * 
 *      // to create an entity when not found
 *      async createEntity(authData, params) {}
 *    }
 *  }
 * ```
 */

const assert = require('assert')
const {AuthenticationBaseStrategy} = require('@feathersjs/authentication')

const initResolver = function() {
  if(this.resolver) {
    return
  }
  this.resolver = this._resolver(this)
  const resolverFns = ['decryptData', 'findEntity', 'createEntity']
  resolverFns.forEach((fn) => {
    assert('function' === typeof this.resolver[fn], `${fn} must be defined as function in resolver`)
  })
}

class WeappStrategy extends AuthenticationBaseStrategy {
  constructor(resolver = null) {
    super()
    assert('function' === typeof resolver, 'resolver function must be provided')
    this._resolver = resolver
  }

  async resolveEntity(authData, params) {
    const entity = await this.resolver.findEntity(authData, params)
    if(!entity) {
      return await this.resolver.createEntity(authData, params)
    }
    if('function' === typeof this.resolver.patchEntity) {
      return this.resolver.patchEntity(entity, authData, params)
    }
    return entity
  }

  // authentication service lifecycle
  async authenticate(data, params) {
    initResolver.call(this)
    const decoded = await this.resolver.decryptData(data, params)
    const user = await this.resolveEntity(decoded, params)
    const {entity} = this.authentication.configuration;
    return {
      authentication: {strategy: this.name},
      [entity]: user
    }
  }
}

module.exports = WeappStrategy
