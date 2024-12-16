import {defineChain} from 'viem';

export const deraChainId = 20240801;

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
        'http://nodetest2.derachain.com/ext/bc/KMwFBA2huCenWBTf4k6oWZE23HozsX1Yw5ay7LWN4CWcRqKHU/rpc',
      ],
      // webSocket: ['ws://125.212.226.160:6950/ext/bc/darechain1/rpc'],
    },
  },
  blockExplorers: {
    default: {name: 'Explorer', url: 'https://testnet.derachain.com'},
  },
});
