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
import {DERACHAIN_TESTNET, DERACHAIN_MAINNET} from './consts';

const URLS = {
  mainnet: {
    BUNDLER: 'https://bundler.derachain.com/api/v2/20250320/x',
    PAYMASTER: 'https://bundler.derachain.com/paymaster/api/v1/20250320/x',
    RPC: 'https://rpc2.derachain.com/ext/bc/2XCTEc8CfNK9MtQWYMfgNt32QjZsZqq92LH7eTV5xY8YjY44du/rpc',
  },
  testnet: {
    BUNDLER: 'https://bundler-testnet.derachain.com/api/v2/20250111/x',
    PAYMASTER:
      'https://bundler-testnet.derachain.com/paymaster/api/v1/20250111/x',
    RPC: 'https://rpc-test3.derachain.com/ext/bc/A19HfLGD92ZbCUW6uycTM5N69BCR12JihXVp2qdDLw7Mev4Hg/rpc',
  },
};

const ADDRESSES = {
  mainnet: {
    ENTRY_POINT: '0xD3a2d785254d34f69127a66Df1b66383aEE208D2',
    ECDSA_MODULE: '0x4C5c699494a990687736888204dfBB4128e4c0F0',
    SMART_ACCOUNT_FACTORY: '0x5586b73A81394Aa995C73520Ea9776E410274D79',
    SMART_ACCOUNT_IMPLEMENTATION: '0x7213cA7E9eAdD62F53ADE3f0227BD0E88a632Ed5',
    FACTORY_CALLBACK_HANDLER: '0xdA62bE43AbD22e3D65d1004E76893B2414973afc',
  },
  testnet: {
    ENTRY_POINT: '0x20EDfa1CE1c711Fd227A1C387AaB5f0dc3426a5F',
    ECDSA_MODULE: '0x12Fd051cCa7Cd01b7A498a71eFD6Bd728583A98F',
    SMART_ACCOUNT_FACTORY: '0x8eb6E38f5D128d1333c632e776cd2564FE1BB780',
    SMART_ACCOUNT_IMPLEMENTATION: '0xA1b41eEe9a32e589ff763a0e78fFDE25d56b9B41',
    FACTORY_CALLBACK_HANDLER: '0xeb5d8F66cf9742faE0A3D9f597d272c452C1BfF6',
  },
} as const;

export class DeraChainSmartAccountV2 {
  private static async createDefaultConfig(
    chain: Chain,
    client: ReturnType<typeof createWalletClient>,
    index: number,
    networkType: 'mainnet' | 'testnet'
  ): Promise<BiconomySmartAccountV2Config> {
    try {
      const ecdsaModule = await createECDSAOwnershipValidationModule({
        moduleAddress: ADDRESSES[networkType].ECDSA_MODULE,
        signer: client,
      });

      const config: BiconomySmartAccountV2Config = {
        customChain: chain,
        factoryAddress: ADDRESSES[networkType].SMART_ACCOUNT_FACTORY,
        implementationAddress:
          ADDRESSES[networkType].SMART_ACCOUNT_IMPLEMENTATION,
        defaultFallbackHandler: ADDRESSES[networkType].FACTORY_CALLBACK_HANDLER,
        signer: client,
        chainId: chain.id,
        bundler: new Bundler({
          customChain: chain,
          entryPointAddress: ADDRESSES[networkType].ENTRY_POINT,
          bundlerUrl: URLS[networkType].BUNDLER,
          chainId: chain.id,
        }),
        defaultValidationModule: ecdsaModule,
        entryPointAddress: ADDRESSES[networkType].ENTRY_POINT,
        index,
      };

      config.paymaster = new BiconomyPaymaster({
        paymasterUrl: URLS[networkType].PAYMASTER,
      });
      config.rpcUrl = URLS[networkType].RPC;
      config.activeValidationModule = ecdsaModule;

      return config;
    } catch (error) {
      console.error('Error creating default config:', error);
      throw error;
    }
  }

  public static async createSmartAccount(
    index: number = 0,
    privateKey: `0x${string}`,
    networkType: 'mainnet' | 'testnet' = 'testnet',
    config?: Partial<BiconomySmartAccountV2Config>
  ): Promise<BiconomySmartAccountV2> {
    try {
      const chain: Chain =
        config?.customChain ??
        (networkType === 'mainnet' ? DERACHAIN_MAINNET : DERACHAIN_TESTNET);

      const client = createWalletClient({
        account: privateKeyToAccount(privateKey),
        chain,
        transport: http(),
      });

      const defaultConfig = await DeraChainSmartAccountV2.createDefaultConfig(
        chain,
        client,
        index,
        networkType
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
