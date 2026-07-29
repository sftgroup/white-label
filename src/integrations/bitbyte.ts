/**
 * @0xainetoem/white-label — BitByte 集成
 *
 * 自动从 white-label 品牌配置注入到 @bitbytev4/sdk。
 *
 * @example
 * ```ts
 * import { defineBrand } from '@0xainetoem/white-label';
 * import { createBitByteSDK } from '@0xainetoem/white-label/bitbyte';
 *
 * defineBrand({ brand: { name: 'MyDex', colors: { primary: '#ff6600' } } });
 *
 * const sdk = createBitByteSDK({ apiBase: '/api' });
 * console.log(sdk.getBrand().name); // "MyDex"
 * ```
 *
 * @requires npm install @bitbytev4/sdk
 */

import { BitByteSDK, type BitByteSDKConfig } from '@bitbytev4/sdk';
import { getBrand } from '../types.js';

export interface BitByteWithBrand {
  /** The underlying BitByte SDK instance */
  sdk: BitByteSDK;
  /** Brand name from white-label config */
  readonly name: string;
  /** Brand primary color */
  readonly primaryColor: string;
  /** Get brand info */
  getBrand(): { name: string; shortName: string; primaryColor: string };
}

/**
 * 创建一个已注入品牌配置的 BitByteSDK。
 * BitByte SDK 不原生支持品牌注入，白标 SDK 通过包装对象注入品牌名和主色。
 */
export function createBitByteSDK(config?: BitByteSDKConfig): BitByteWithBrand {
  const brand = getBrand();
  const sdk = new BitByteSDK(config);

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

/** Re-export BitByteSDK for convenience */
export { BitByteSDK };
export type { BitByteSDKConfig };
