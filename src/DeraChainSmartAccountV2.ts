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
  BUNDLER: 'https://bundler.derachain.com/api/v2/20250111/x',
  PAYMASTER: 'https://bundler.derachain.com/paymaster/api/v1/20250111/x',
  RPC: 'https://rpc-test3.derachain.com/ext/bc/A19HfLGD92ZbCUW6uycTM5N69BCR12JihXVp2qdDLw7Mev4Hg/rpc',
};

const ADDRESSES = {
  ENTRY_POINT: '0x20EDfa1CE1c711Fd227A1C387AaB5f0dc3426a5F',
  ECDSA_MODULE: '0x12Fd051cCa7Cd01b7A498a71eFD6Bd728583A98F',
  SMART_ACCOUNT_FACTORY: '0x8eb6E38f5D128d1333c632e776cd2564FE1BB780',
  SMART_ACCOUNT_IMPLEMENTATION: '0xA1b41eEe9a32e589ff763a0e78fFDE25d56b9B41',
  FACTORY_CALLBACK_HANDLER: '0xeb5d8F66cf9742faE0A3D9f597d272c452C1BfF6',
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
