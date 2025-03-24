import {defineChain} from 'viem';

export const DERACHAIN_TESTNET = defineChain({
  id: 20250111,
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

export const DERACHAIN_MAINNET = defineChain({
  id: 20250320,
  name: 'DERA Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'DERA',
    symbol: 'DERA',
  },
  rpcUrls: {
    default: {
      http: [
        'https://rpc2.derachain.com/ext/bc/2XCTEc8CfNK9MtQWYMfgNt32QjZsZqq92LH7eTV5xY8YjY44du/rpc',
      ],
    },
  },
  blockExplorers: {
    default: {name: 'Explorer', url: 'https://trace.derachain.com'},
  },
});
