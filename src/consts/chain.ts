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
        'https://rpc-testnet.derachain.com/ext/bc/2WMFYSdPEx6LR3gsQfQtiezMwSUijqxuPa61wVE66rnc2aHKL6/rpc',
      ],
      // webSocket: ['ws://125.212.226.160:6950/ext/bc/darechain1/rpc'],
    },
  },
  blockExplorers: {
    default: {name: 'Explorer', url: 'https://trace.derachain.com'},
  },
});
