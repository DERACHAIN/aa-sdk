import {DeraChainSmartAccountV2} from './DeraChainSmartAccountV2';

export * from './consts';
export * from '@biconomy/account';

export const {createSmartAccount: createSmartAccountClient, sendUserOps} =
  DeraChainSmartAccountV2;
