# aa-sdk

SDK for Account Abstraction integration on DERA chain with support for smart accounts, user operations, bundler service, paymaster service that comply with ERC-4337.

[![License](https://img.shields.io/npm/l/@cosmostation/cosmosjs.svg)](https://www.npmjs.com/package/@darenft-labs/nft2-client)

## Installing

Install by yarn

```
yarn add @derachain/aa-sdk
```

or using npm

```
npm i @derachain/aa-sdk
```

**Note:** node version should be greater than 16.14

## Quick start

```typescript
import {createSmartAccountClient} from '@derachain/aa-sdk';

const smartAccount = await createSmartAccountClient(index, privateKey);

const {wait} = await smartAccount.sendTransaction({to: '0x...', value: 1});

const {
  receipt: {transactionHash},
  success,
} = await wait();
```
