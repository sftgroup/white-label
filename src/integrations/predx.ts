/**
 * @0xainetoem/white-label — PredX 集成
 *
 * 自动从 white-label 品牌配置注入到 @0xpredx/sdk。
 *
 * @example
 * ```ts
 * import { defineBrand } from '@0xainetoem/white-label';
 * import { createPredXClient } from '@0xainetoem/white-label/predx';
 *
 * defineBrand({ brand: { name: 'MyMarkets', colors: { primary: '#ff6600' } } });
 *
 * const client = createPredXClient({ chainId: 19505 });
 * console.log(client.getBrand().name); // "MyMarkets"
 * ```
 *
 * @requires npm install @0xpredx/sdk
 */

import { PredXClient, type PredXConfig } from '@0xpredx/sdk';
import { getBrand } from '../types.js';

export interface PredXWithBrand {
  /** The underlying PredX SDK client */
  client: PredXClient;
  /** Brand name from white-label config */
  readonly name: string;
  /** Brand primary color */
  readonly primaryColor: string;
  /** Get brand info */
  getBrand(): { name: string; shortName: string; primaryColor: string };
}

/**
 * 创建一个已注入品牌配置的 PredXClient。
 * PredX SDK 不原生支持品牌注入，白标 SDK 通过包装对象提供品牌名和主色。
 */
export function createPredXClient(config: PredXConfig): PredXWithBrand {
  const brand = getBrand();
  const client = new PredXClient(config);

  return {
    client,
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

/** Re-export PredXClient for convenience */
export { PredXClient };
export type { PredXConfig };
