/**
 * @0xainetoem/white-label — 0xBridge 集成
 *
 * 自动从 white-label 品牌配置注入到 @0xaibridge/sdk。
 *
 * @example
 * ```ts
 * import { defineBrand } from '@0xainetoem/white-label';
 * import { createBridgeSDK } from '@0xainetoem/white-label/bridge';
 *
 * defineBrand({ brand: { name: 'MyBridge', colors: { primary: '#ff6600' } } });
 *
 * const sdk = createBridgeSDK({
 *   bridgeAddress: '0x...',
 *   rpcUrl: 'https://sepolia.drpc.org',
 * });
 * console.log(sdk.getBrand().name); // "MyBridge"
 * ```
 *
 * @requires npm install @0xaibridge/sdk
 */

import { BridgeSDK } from '@0xaibridge/sdk';
import { getBrand } from '../types.js';

interface BridgeSDKOpts {
  bridgeAddress: string;
  rpcUrl?: string;
  provider?: any;
  signerKey?: string;
  signer?: any;
  gasLimitTransfer?: number;
  gasLimitComplete?: number;
}

export interface BridgeWithBrand {
  /** The underlying BridgeSDK instance */
  sdk: BridgeSDK;
  /** Brand name from white-label config */
  readonly name: string;
  /** Brand primary color */
  readonly primaryColor: string;
  /** Get brand info */
  getBrand(): { name: string; shortName: string; primaryColor: string };
}

/**
 * 创建一个已注入品牌配置的 BridgeSDK。
 * Bridge SDK 不原生支持品牌注入，白标 SDK 通过包装对象提供品牌名和主色。
 */
export function createBridgeSDK(opts: BridgeSDKOpts): BridgeWithBrand {
  const brand = getBrand();
  const sdk = new BridgeSDK(opts);

  return {
    sdk,
    get name() {
      return brand.brand.name;
    },
    get primaryColor() {
      return brand.brand.colors.primary;
    },
    getBrand() {
      return {
        name: brand.brand.name,
        shortName: brand.brand.shortName,
        primaryColor: brand.brand.colors.primary,
      };
    },
  };
}

/** Re-export BridgeSDK for convenience */
export { BridgeSDK };
