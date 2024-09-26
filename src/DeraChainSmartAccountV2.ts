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
  RPC: 'https://rpc-testnet.derachain.com/ext/bc/2LZp9ypK4SWm3a8MBYZbxTZgKbvB4aemUf83cBp1hSnvP7SFiw/rpc',
};

const ADDRESSES = {
  ENTRY_POINT: '0xd085d4bf2f695D68Ba79708C646926B01262D53f',
  ECDSA_MODULE: '0x6Fa3DB0751A728875356FAbDC77D1167ca29496f',
  SMART_ACCOUNT_FACTORY: '0xB7Fd89Aa29989bc37f71900dE0696D9320f9f618',
  SMART_ACCOUNT_IMPLEMENTATION: '0x48CeCB8614c2756DBdC1B665b844F5a89492B36f',
  FACTORY_CALLBACK_HANDLER: '0xF888cA0e15258684e9C38145dEaE119Fe469c33C',
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
