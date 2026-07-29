/**
 * @0xainetoem/white-label — Oxachain 集成
 *
 * 自动从 white-label 品牌配置注入到 oxachain-sdk。
 *
 * @example
 * ```ts
 * import { defineBrand } from '@0xainetoem/white-label';
 * import { createOxaChainClient } from '@0xainetoem/white-label/oxachain';
 *
 * defineBrand({ brand: { name: 'MyChain', colors: { primary: '#ff6600' } } });
 *
 * const client = createOxaChainClient({ rpcUrl: 'http://localhost:18545' });
 * console.log(client.getBrand().name); // "MyChain"
 * ```
 *
 * @requires npm install oxachain-sdk
 */

import { OxaChainClient, type OxaChainClientOptions } from 'oxachain-sdk';
import { getBrand } from '../types.js';

/**
 * 创建一个已注入品牌配置的 OxaChainClient。
 * OxaChain SDK 原生支持 setBrand()，白标 SDK 自动从 defineBrand() 配置读取品牌名、符号和主色。
 */
export function createOxaChainClient(opts?: OxaChainClientOptions): OxaChainClient {
  const brand = getBrand();
  const client = new OxaChainClient({
    ...opts,
    brand: {
      name: brand.brand.name,
      symbol: brand.brand.shortName,
      primaryColor: brand.brand.colors.primary,
    },
  });

  return client;
}

/** Re-export OxaChainClient for convenience */
export { OxaChainClient };
export type { OxaChainClientOptions };
