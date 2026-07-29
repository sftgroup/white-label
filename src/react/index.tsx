// ====== React Context & Provider ======

import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { BrandConfig } from '../types.js';
import { getBrand } from '../types.js';
import { injectCSSVars } from '../utils/css-vars.js';
import { injectFavicon } from '../utils/favicon.js';
import { injectMeta } from '../utils/meta.js';

const BrandContext = createContext<BrandConfig | null>(null);

interface BrandProviderProps {
  brand?: BrandConfig;
  children: ReactNode;
}

export function BrandProvider({ brand, children }: BrandProviderProps) {
  const current = brand || getBrand();

  // 副作用：注入 CSS 变量、favicon、meta 标签
  useEffect(() => {
    injectCSSVars(current);
    injectFavicon(current);
    injectMeta(current);
  }, [current]);

  return React.createElement(BrandContext.Provider, { value: current }, children);
}

// ====== Hook ======
export function useBrand(): BrandConfig {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    // 降级：返回全局 brand（SSR / 非 Provider 场景）
    return getBrand();
  }
  return ctx;
}

// ====== 组件 ======
interface BrandLogoProps {
  variant?: 'dark' | 'light';
  className?: string;
  style?: React.CSSProperties;
}

export function BrandLogo({ variant = 'dark', className, style }: BrandLogoProps) {
  const { brand } = useBrand();
  return React.createElement('img', {
    src: variant === 'light' ? brand.logo.light : brand.logo.dark,
    alt: brand.name,
    className,
    style,
  });
}
