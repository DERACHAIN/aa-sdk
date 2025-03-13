import {defineChain} from 'viem';

export const deraChainId = 20250111;

export const DERACHAIN_TESTNET = defineChain({
  id: deraChainId,
  name: 'DERA Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'DERA',
    symbol: 'DERA',
  },
  rpcUrls: {
    default: {
      http: [
        'https://rpc-test3.derachain.com/ext/bc/A19HfLGD92ZbCUW6uycTM5N69BCR12JihXVp2qdDLw7Mev4Hg/rpc',
      ],
      // webSocket: ['ws://125.212.226.160:6950/ext/bc/darechain1/rpc'],
    },
  },
  blockExplorers: {
    default: {name: 'Explorer', url: 'https://testnet.derachain.com'},
  },
});
