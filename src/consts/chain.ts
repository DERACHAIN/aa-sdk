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
        'https://rpc-test2.derachain.com/ext/bc/yMz6EoVVaYVUJDozWNtvvHddutUwK7Tfqd2z7nXoG7zydyHEJ/rpc',
      ],
      // webSocket: ['ws://125.212.226.160:6950/ext/bc/darechain1/rpc'],
    },
  },
  blockExplorers: {
    default: {name: 'Explorer', url: 'https://testnet.derachain.com'},
  },
});
