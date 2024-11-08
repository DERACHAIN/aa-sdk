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
import {DERACHAIN_TESTNET, deraChainId} from './consts';

const URLS = {
  BUNDLER: 'https://bundler.derachain.com/api/v2/20240801/x',
  PAYMASTER: 'https://bundler.derachain.com/paymaster/api/v1/20240801/x',
  RPC: 'https://rpc-testnet.derachain.com/ext/bc/2WMFYSdPEx6LR3gsQfQtiezMwSUijqxuPa61wVE66rnc2aHKL6/rpc',
};

const ADDRESSES = {
  ENTRY_POINT: '0x35e0527306D14d9Ce579e61F261a6BEd4b68aF28',
  ECDSA_MODULE: '0xa5E364EEd03E7639eF79b760Af1e8438b389ede5',
  SMART_ACCOUNT_FACTORY: '0x3e23dD121c2529EA6f6Db030Ed2Ca4Fecc10da3b',
  SMART_ACCOUNT_IMPLEMENTATION: '0xe0Eb16F4A5a39C0331982e8400F01F077AA21Fd9',
  FACTORY_CALLBACK_HANDLER: '0xB3D4f8CEDA8e450923e6b0b544AC38e330e4AAc4',
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
        chainId: deraChainId,
        bundler: new Bundler({
          customChain: chain,
          entryPointAddress: ADDRESSES.ENTRY_POINT,
          bundlerUrl: URLS.BUNDLER,
          chainId: deraChainId,
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
