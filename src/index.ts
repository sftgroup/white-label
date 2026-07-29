// @0xai/white-label — Main entry
// Usage:
//   import { BrandProvider, useBrand, BrandLogo } from '@0xai/white-label/react';
//   import type { BrandConfig } from '@0xai/white-label';

export { BrandProvider, useBrand, BrandLogo } from './react/index.js';
export { defineBrand, getBrand, defaultBrand } from './types.js';
export type { BrandConfig } from './types.js';
export { injectCSSVars } from './utils/css-vars.js';
export { injectFavicon } from './utils/favicon.js';
export { injectMeta } from './utils/meta.js';
