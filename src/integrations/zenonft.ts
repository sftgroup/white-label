/**
 * @0xainetoem/white-label — ZenoNFT 集成
 *
 * 自动从 white-label 品牌配置注入到 @zenonft/sdk。
 *
 * @example
 * ```ts
 * import { defineBrand } from '@0xainetoem/white-label';
 * import { createZenoNFT } from '@0xainetoem/white-label/zenonft';
 *
 * defineBrand({ brand: { name: 'MyMarket', colors: { primary: '#ff6600' } } });
 *
 * const sdk = createZenoNFT({ chain: 'sepolia', signer: walletClient });
 * console.log(sdk.getBrand().name); // "MyMarket"
 * ```
 *
 * @requires npm install @zenonft/sdk
 */

import { ZenoNFTSDK, type SDKConfig } from '@zenonft/sdk';
import { getBrand } from '../types.js';

/**
 * 创建一个已注入品牌配置的 ZenoNFT SDK。
 * 自动从 @0xainetoem/white-label 的 defineBrand() 配置中读取品牌名和主色。
 */
export function createZenoNFT(opts?: SDKConfig): ZenoNFTSDK {
  const brand = getBrand();
  const sdk = new ZenoNFTSDK(opts);

  sdk.setBrand({
    name: brand.brand.name,
    shortName: brand.brand.shortName,
    primaryColor: brand.brand.colors.primary,
    primaryColorHover: brand.brand.colors.primaryHover,
  });

  return sdk;
}

/** Re-export ZenoNFTSDK for convenience */
export { ZenoNFTSDK };
export type { SDKConfig };
