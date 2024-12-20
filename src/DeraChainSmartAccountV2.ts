import {
  BiconomyPaymaster,
  BiconomySmartAccountV2,
  BiconomySmartAccountV2Config,
  Bundler,
  createECDSAOwnershipValidationModule,
  createSmartAccountClient,
  PaymasterMode,
  Transaction,
} from '@biconomy/account';
import {Chain, createWalletClient, http} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {DERACHAIN_TESTNET} from './consts';

const URLS = {
  BUNDLER: 'https://bundler.derachain.com/api/v2/20240801/x',
  PAYMASTER: 'https://bundler.derachain.com/paymaster/api/v1/20240801/x',
  RPC: 'https://rpc-test2.derachain.com/ext/bc/yMz6EoVVaYVUJDozWNtvvHddutUwK7Tfqd2z7nXoG7zydyHEJ/rpc',
};

const ADDRESSES = {
  ENTRY_POINT: '0xBd2e109F5c62BEA145ce73a99d647ddD53929de0',
  ECDSA_MODULE: '0x8789F520e7C006B0531F218149F689e392A007d1',
  SMART_ACCOUNT_FACTORY: '0xA76bbBec6f6e7C6c5685367b39DC9C3feC0C26DC',
  SMART_ACCOUNT_IMPLEMENTATION: '0x22Ef0138b7322e456A3bB2e5c7f411a9C111C245',
  FACTORY_CALLBACK_HANDLER: '0x3b1803a5aBBf6cE82c5AfC969BA6b3962eb09C97',
} as const;

export class DeraChainSmartAccountV2 {
  private static async createDefaultConfig(
    chain: Chain,
    client: ReturnType<typeof createWalletClient>,
    index: number,
    isSponsor: boolean = false
  ): Promise<BiconomySmartAccountV2Config> {
    try {
      const ecdsaModule = await createECDSAOwnershipValidationModule({
        moduleAddress: ADDRESSES.ECDSA_MODULE,
        signer: client,
      });

      const config: BiconomySmartAccountV2Config = {
        customChain: chain,
        factoryAddress: ADDRESSES.SMART_ACCOUNT_FACTORY,
        implementationAddress: ADDRESSES.SMART_ACCOUNT_IMPLEMENTATION,
        defaultFallbackHandler: ADDRESSES.FACTORY_CALLBACK_HANDLER,
        signer: client,
        chainId: chain.id,
        bundler: new Bundler({
          customChain: chain,
          entryPointAddress: ADDRESSES.ENTRY_POINT,
          bundlerUrl: URLS.BUNDLER,
          chainId: chain.id,
        }),
        defaultValidationModule: ecdsaModule,
        entryPointAddress: ADDRESSES.ENTRY_POINT,
        index,
      };

      if (isSponsor) {
        config.paymaster = new BiconomyPaymaster({
          paymasterUrl: URLS.PAYMASTER,
        });
        config.rpcUrl = URLS.RPC;
        config.activeValidationModule = ecdsaModule;
      }

      return config;
    } catch (error) {
      console.error('Error creating default config:', error);
      throw error;
    }
  }

  public static async createSmartAccount(
    index: number = 0,
    privateKey: `0x${string}`,
    isSponsor: boolean = true,
    networkType?: 'mainnet' | 'testnet',
    config?: Partial<BiconomySmartAccountV2Config>
  ): Promise<BiconomySmartAccountV2> {
    try {
      const chain: Chain = config?.customChain ?? DERACHAIN_TESTNET;
      const client = createWalletClient({
        account: privateKeyToAccount(privateKey),
        chain,
        transport: http(),
      });

      const defaultConfig = await DeraChainSmartAccountV2.createDefaultConfig(
        chain,
        client,
        index,
        isSponsor
      );
      return createSmartAccountClient({...defaultConfig, ...config});
    } catch (error) {
      console.error('Error creating smart account:', error);
      throw error;
    }
  }

  /**
   * Sends user operations
   * @param smartAccount - BiconomySmartAccountV2 instance
   * @param userOps - Array of user operations
   * @param isSponsor - Whether the operation is sponsored
   * @returns A promise that resolves to the user operation receipt
   */
  public static async sendUserOps(
    smartAccount: BiconomySmartAccountV2,
    userOps: Array<{toAddress: string; data?: string; value?: string}>,
    isSponsor: boolean = false
  ) {
    try {
      const transactions = userOps.map(
        ({toAddress, data, value}) =>
          ({to: toAddress, data, value} as Transaction)
      );

      return await smartAccount.sendTransaction(
        transactions,
        isSponsor
          ? {
              paymasterServiceData: {
                mode: PaymasterMode.SPONSORED,
                calculateGasLimits: false,
              },
            }
          : undefined
      );
    } catch (error) {
      console.error('Error sending user operations:', error);
      throw error;
    }
  }
}
