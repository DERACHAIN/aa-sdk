import {DeraChainSmartAccountV2} from './DeraChainSmartAccountV2';

export * from './consts';
export * from '@biconomy/account';

export const createSmartAccountClient =
  DeraChainSmartAccountV2.createSmartAccount;
