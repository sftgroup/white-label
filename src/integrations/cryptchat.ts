/**
 * @0xainetoem/white-label — CryptChat 集成
 *
 * 自动从 white-label 品牌配置注入到 @cryptchat/sdk。
 *
 * @example
 * ```ts
 * import { defineBrand } from '@0xainetoem/white-label';
 * import { createCryptChat } from '@0xainetoem/white-label/cryptchat';
 *
 * defineBrand({ brand: { name: '企业Chat', colors: { primary: '#ff6600' } } });
 *
 * const chat = createCryptChat({ apiBaseUrl: 'https://api.example.com' });
 * console.log(chat.getBrand().name); // "企业Chat"
 * ```
 *
 * @requires npm install @cryptchat/sdk
 */

import { CryptChatClient, type CryptChatClientOptions } from '@cryptchat/sdk';
import { getBrand } from '../types.js';

/**
 * 创建一个已注入品牌配置的 CryptChatClient。
 * 自动从 @0xainetoem/white-label 的 defineBrand() 配置中读取品牌名和主色。
 */
export function createCryptChat(
  options: CryptChatClientOptions | string,
): CryptChatClient {
  const brand = getBrand();
  const opts: CryptChatClientOptions =
    typeof options === 'string'
      ? { apiBaseUrl: options }
      : options;

  const client = new CryptChatClient(opts);

  client.setBrand({
    name: brand.brand.name,
    shortName: brand.brand.shortName,
    primaryColor: brand.brand.colors.primary,
    primaryColorHover: brand.brand.colors.primaryHover,
  });

  return client;
}

/** Re-export CryptChatClient for convenience */
export { CryptChatClient };
export type { CryptChatClientOptions };
