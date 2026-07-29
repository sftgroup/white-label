// ====== CSS 变量注入 ======
import type { BrandConfig } from '../types.js';

export function injectCSSVars(brand: BrandConfig) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const { colors } = brand.brand;

  root.style.setProperty('--brand-primary', colors.primary);
  root.style.setProperty('--brand-primary-hover', colors.primaryHover);
  root.style.setProperty('--brand-secondary', colors.secondary);
  root.style.setProperty('--brand-accent', colors.accent);

  // Tailwind 兼容：注入到 tailwind config 可读取的变量
  root.style.setProperty('--color-brand', colors.primary);
  root.style.setProperty('--color-brand-hover', colors.primaryHover);
}
