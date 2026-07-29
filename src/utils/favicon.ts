// ====== Favicon 自动替换 ======
import type { BrandConfig } from '../types.js';

export function injectFavicon(brand: BrandConfig) {
  if (typeof document === 'undefined') return;

  const favicon = brand.brand.logo.favicon;
  if (!favicon) return;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = favicon;
}
