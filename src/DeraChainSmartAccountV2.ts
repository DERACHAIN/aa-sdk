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
  RPC: 'http://nodetest2.derachain.com/ext/bc/KMwFBA2huCenWBTf4k6oWZE23HozsX1Yw5ay7LWN4CWcRqKHU/rpc',
};

const ADDRESSES = {
  ENTRY_POINT: '0x3841143055dB2E292075e6F282Aeb56657eA6235',
  ECDSA_MODULE: '0x8e24C90f7b1212D6D0bA45c5834bB3fB016aAA48',
  SMART_ACCOUNT_FACTORY: '0xc6a380A9F85cfe4B2E9dD76d0946bd89BFe55B29',
  SMART_ACCOUNT_IMPLEMENTATION: '0xE27A0E456fd9A02eE00171fC00Dd6759Ce2C0E65',
  FACTORY_CALLBACK_HANDLER: '0x75656641A77D68d16ba361EF7A0bdf6228597C7d',
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
