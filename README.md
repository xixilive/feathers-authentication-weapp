## 微信小程序 Authentication for [Feathers](https://github.com/feathersjs)

![Travis (.org) branch](https://img.shields.io/travis/xixilive/feathers-authentication-weapp/master)
![npm bundle size](https://img.shields.io/bundlephobia/min/@feathers-weapp/auth)
![npm version](https://img.shields.io/npm/v/@feathers-weapp/auth)
![Known Vulnerabilities](https://snyk.io/test/github/xixilive/feathers-authentication-weapp/badge.svg)
![NPM license](https://img.shields.io/npm/l/@feathers-weapp/auth)

## Install

```sh
npm i @feathers-weapp/auth
```

## Usage

### Step1: update feathers configuration

add new authentication strategy into feathers default configuration json file.

```js
// config/default.json
"authentication": {
  "authStrategies": [
    // ...
    "weapp" // strategy name, such as wxauth, whatever
  ],
  // ...
  "weapp": { // keep identic with strategy name
    "appId": "WX_APP_ID",
    "appSecret": "WX_APP_SECRET"
  }
},
```

### Step2: setup auth strategy in authentication service

Implements the `entityResolver` protocol and register new auth-strategy.

```js
// authentication.js
const WeappStrategy = require('@feathers-weapp/auth')

// declare a function to find, patch or create authentication entity(eg: users)
const entityResolverBuilder = (strategy) => {
  const {configuration:{key, secret}, entityService:service} = strategy
  const decrypt = WeappStrategy.decipherer(key, secret)

  return {
    // to decrypt encrypted data which post from clients
    async decryptData(rawData, params) {
      return await decrypt(rawData)
    },
    
    // to find an entity with specified auth-data
    async findEntity(authData, params) {
      const [entity] = await service.find({query: {openId: authData.openId, $limit: 1}, paginate: false})
      return entity
    },
    
    // optional, to update an entity with specified auth-data
    async patchEntity(entity, authData, params) {
      return await service.path(entity.id, {userInfo: authData.userInfo})
    },

    // to create an entity when not found
    async createEntity(authData, params) {
      return await service.create({openId: authData.openId, userInfo: authData.userInfo})
    }
  }
}

module.exports = function configureAuthenticationService(app) {
  const authentication = new AuthenticationService(app);
  // ... skipped
  authentication.register('weapp', new WeappStrategy(entityResolverBuilder));
  // ... skipped
}
```

```js
// client
const app = feathers()
app.service('authentication').create({
  strategy: 'weapp', 
  code: 'login code',
  rawData: '',
  signature: '',
  encryptedData: '',
  iv: ''
}).then(({accessToken}) => console.log('JWT token', accessToken))
```

## API

### rawData object

```ts
interface rawData {
  code: string;
  rawData: string;
  signature: string;
  encryptedData: string;
  iv: string
}
```

### authData object

```ts
interface authData {
  openId: string;
  sessionKey: string;
  userInfo: userInfo
}
```

### userInfo object

```ts
interface userInfo {
  nickname: string;
  gender: number;
  language: string;
  city: string;
  province: string;
  country: string;
  avatarUrl: string;
  unionId?: string;
  watermark: any
}
```

### entityResolver object

```ts
interface entityResolver {
  decryptData(rawData: rawData, params: object): object;
  findEntity(authData: authData, params: object): Entity | null;
  [patchEntity(entity: Entity, authData: authData, params: object)]: Entity;
  createEntity(entity: object, authData: authData, params: object): Entity;
}
```

### entityResolverBuilder function

```ts
function entityResolverBuilder(strategy:WeappStrategy):entityResolver
```

### WeappStrategy class

```ts
class WeappStrategy {
  constructor(builder:entityResolverBuilder);
  app:Application;
  name:string;
  authentication:AuthenticationBase;
  configuration:object;
  entityService:Service;
}
```
