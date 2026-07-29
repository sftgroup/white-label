// ====== 品牌配置类型定义 ======

export interface BrandConfig {
  brand: {
    name: string;
    shortName: string;
    logo: {
      dark: string;
      light: string;
      favicon: string;
    };
    colors: {
      primary: string;
      primaryHover: string;
      secondary: string;
      accent: string;
    };
    domain: string;
    contactEmail: string;
    social: {
      twitter: string;
      discord: string;
      telegram: string;
    };
  };
  chain: {
    network: 'mainnet' | 'testnet';
    rpcUrl: string;
    chainId: number;
    explorerUrl: string;
    nativeToken: string;
  };
  features: {
    modules: string[];
    enabledChains: string[];
  };
}

// ====== 默认品牌配置 ======
export const defaultBrand: BrandConfig = {
  brand: {
    name: '0xAI',
    shortName: '0x',
    logo: {
      dark: '/logo-dark.svg',
      light: '/logo-light.svg',
      favicon: '/favicon.ico',
    },
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#1e293b',
      accent: '#06b6d4',
    },
    domain: 'localhost',
    contactEmail: 'contact@0xainet.top',
    social: {
      twitter: 'https://x.com/0xai',
      discord: 'https://discord.gg/0xai',
      telegram: 'https://t.me/0xai',
    },
  },
  chain: {
    network: 'testnet',
    rpcUrl: 'https://rpc-oxa.0xainet.top',
    chainId: 8888,
    explorerUrl: 'https://explorer-oxa.0xainet.top',
    nativeToken: 'T0X',
  },
  features: {
    modules: [],
    enabledChains: ['ethereum'],
  },
};

// ====== 品牌配置加载 ======
let _brand: BrandConfig = defaultBrand;

export function defineBrand(config?: Partial<BrandConfig>): BrandConfig {
  if (config) {
    _brand = deepMerge(defaultBrand, config);
  }
  return _brand;
}

export function getBrand(): BrandConfig {
  return _brand;
}

// ====== 工具函数 ======
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] as any, source[key] as any);
    } else if (source[key] !== undefined) {
      result[key] = source[key] as T[keyof T];
    }
  }
  return result;
}
