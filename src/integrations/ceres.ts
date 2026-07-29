/**
 * @0xainetoem/white-label — Ceres 集成
 *
 * 自动从 white-label 品牌配置注入到 @ceresv2/sdk。
 *
 * @example
 * ```ts
 * import { defineBrand, BrandProvider } from '@0xainetoem/white-label';
 * import { createCeresConfig } from '@0xainetoem/white-label/ceres';
 *
 * defineBrand({ brand: { name: 'SocialGraph', colors: { primary: '#ff6600' } } });
 *
 * // 在 CeresProvider 中使用品牌增强配置
 * const ceresConfig = createCeresConfig({ apiUrl: 'https://api.example.com' });
 * console.log(ceresConfig.brandName); // "SocialGraph"
 * ```
 *
 * @requires npm install @ceresv2/sdk
 */

import { getBrand } from '../types.js';

export interface CeresBrandConfig {
  /** Brand name injected into Ceres */
  brandName: string;
  /** Primary color for DID NFT display */
  primaryColor: string;
}

/**
 * 获取已注入品牌配置的 Ceres 配置对象。
 * 用于与 @ceresv2/sdk 一起使用（CeresProvider 的配置）。
 */
export function createCeresConfig(baseConfig?: Record<string, unknown>): CeresBrandConfig & Record<string, unknown> {
  const brand = getBrand();

  return {
    ...(baseConfig || {}),
    brandName: brand.brand.name,
    primaryColor: brand.brand.colors.primary,
  };
}
