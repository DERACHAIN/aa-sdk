# Account Abstraction SDK

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

**Note:** node version should be greater than v20 LTS

## Quick start

```typescript
import {createSmartAccountClient, sendUserOps} from '@derachain/aa-sdk';

const smartAccount = await createSmartAccountClient(
  index, // Index to create new Smart Account
  privateKey, // Private key for the account
  true // Optional default true: Set to true if using paymaster
);

// Send transaction
const userOpResponse = await sendUserOps(
  smartAccount,
  {to: '0x...', value: 1},
  false // Optional default false: Set to true if using paymaster
);

const userOpReceipt = await userOpResponse.wait();

const {
  receipt: {transactionHash},
  success,
} = userOpReceipt;
```
