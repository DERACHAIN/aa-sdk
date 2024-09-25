import {
  BiconomySmartAccountV2,
  BiconomySmartAccountV2Config,
  Bundler,
  createECDSAOwnershipValidationModule,
  createSmartAccountClient,
} from '@biconomy/account';
import {createWalletClient, http} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {DERACHAIN_TESTNET, deraChainId} from './consts';

const bundlerUrl = 'https://bundler.derachain.com/api/v2/20240801/x';
export const MembershipNFTContract =
  '0x7136C629e76c0dCAD52C48bfa41Ad35C46AEecF4';

// ----- 3. Define smart contracts address
const ENTRY_POINT_ADDRESS = 'd085d4bf2f695D68Ba79708C646926B01262D53f';
const ECDSA_MODULE_ADDRESS = '6Fa3DB0751A728875356FAbDC77D1167ca29496f';
const SMART_ACCOUNT_FACTORY_ADDRESS =
  'B7Fd89Aa29989bc37f71900dE0696D9320f9f618';
const SMART_ACCOUNT_IMPLEMENTATION_ADDRESS =
  '48CeCB8614c2756DBdC1B665b844F5a89492B36f';
const FACTORY_CALLBACK_HANDLER_ADDRESS =
  'F888cA0e15258684e9C38145dEaE119Fe469c33C';

export class DeraChainSmartAccountV2 {
  /**
   * Creates a new instance of BiconomySmartAccountV2
   *
   * This method will create a BiconomySmartAccountV2 instance but will not deploy the Smart Account
   * Deployment of the Smart Account will be donewith the first user operation.
   *
   * - Docs: https://docs.biconomy.io/Account/integration#integration-1
   *
   * @param biconomySmartAccountConfig - Configuration for initializing the BiconomySmartAccountV2 instance {@link BiconomySmartAccountV2Config}.
   * @returns A promise that resolves to a new instance of BiconomySmartAccountV2.
   * @throws An error if something is wrong with the smart account instance creation.
   *
   * @example
   * import { createClient } from "viem"
   * import { createSmartAccountClient, BiconomySmartAccountV2 } from "@biconomy/account"
   * import { createWalletClient, http } from "viem";
   * import { polygonAmoy } from "viem/chains";
   *
   * const signer = createWalletClient({
   *   account,
   *   chain: polygonAmoy,
   *   transport: http(),
   * });
   *
   * const bundlerUrl = "" // Retrieve bundler url from dashboard
   *
   * const smartAccountFromStaticCreate = await BiconomySmartAccountV2.create({ signer, bundlerUrl });
   *
   * // Is the same as...
   *
   * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl });
   *
   */
  public static async createSmartAccount(
    index: number = 0,
    privateKey: `0x${string}`,
    networkType?: 'mainnet' | 'testnet',
    config?: BiconomySmartAccountV2Config
  ): Promise<BiconomySmartAccountV2> {
    const client = createWalletClient({
      account: privateKeyToAccount(privateKey),
      chain: config?.customChain ?? DERACHAIN_TESTNET,
      transport: http(),
    });

    config = {
      customChain: config?.customChain ?? DERACHAIN_TESTNET,
      factoryAddress:
        config?.factoryAddress ?? `0x${SMART_ACCOUNT_FACTORY_ADDRESS}`,
      implementationAddress:
        config?.implementationAddress ??
        `0x${SMART_ACCOUNT_IMPLEMENTATION_ADDRESS}`,
      defaultFallbackHandler:
        config?.defaultFallbackHandler ??
        `0x${FACTORY_CALLBACK_HANDLER_ADDRESS}`,
      defaultValidationModule:
        config?.defaultValidationModule ??
        (await createECDSAOwnershipValidationModule({
          moduleAddress: `0x${ECDSA_MODULE_ADDRESS}`,
          signer: client,
        })),
      bundler:
        config?.bundler ??
        new Bundler({
          customChain: DERACHAIN_TESTNET,
          entryPointAddress: `0x${ENTRY_POINT_ADDRESS}`,
          bundlerUrl,
        }),
      signer: config?.signer ?? client,
      // paymasterUrl,
      chainId: config?.chainId ?? deraChainId,
      entryPointAddress:
        config?.entryPointAddress ?? `0x${ENTRY_POINT_ADDRESS}`,
      index,
    };

    return createSmartAccountClient(config);
  }
}
