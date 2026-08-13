# @0xainetoem/white-label

> **白标品牌注入 SDK + CLI 部署工具** —— 8 个 0xAI 生态产品的统一白标解决方案。

```bash
npm install @0xainetoem/white-label
npx wl list
```

> 📖 **详细使用手册**：[DOCS.md](./DOCS.md) — 架构总览、CI/CD 集成、Nginx 配置、故障排查、产品白标分步指南

---

## 解决的问题

你的客户想要自己的品牌，但部署 8 个独立产品意味着 8 套品牌配置、Nginx 配置、域名、合约部署——每次重复劳动。

`white-label` 做什么：

| 场景 | 传统做法 | 用 white-label |
|------|---------|---------------|
| 客户换品牌 | 修改 n 个文件、搜索替换 | 改 `branding.json` 或 `wl setup` |
| 部署到客户服务器 | SSH 手动复制、手动配 Nginx | `wl deploy <product>` |
| 部署合约到客户链 | forge 命令记不住参数 | `wl deploy-contracts <product>` |
| 给 SDK 注入品牌 | 每个产品各自实现 | SDK wrapper 自动注入 |
| 公链换品牌 | Geth 源码改 6 个文件 | `make build BRANDING_FILE=branding.json` |

---

## 快速开始

### 1. 前端 React 项目接入（3 行）

```tsx
// 入口文件：main.tsx
import { defineBrand, BrandProvider } from '@0xainetoem/white-label/react';

// 自动读取 src/branding.json
const brand = defineBrand();

createRoot(document.getElementById('root')!).render(
  <BrandProvider brand={brand}>
    <App />
  </BrandProvider>
);
```

### 2. 组件内使用品牌

```tsx
import { useBrand, BrandLogo } from '@0xainetoem/white-label/react';

function Header() {
  const { brand } = useBrand(); // 自动注入的 BrandConfig
  return (
    <header style={{ backgroundColor: brand.colors.primary }}>
      <BrandLogo variant="dark" className="h-8" />
      <h1>{brand.name}</h1>
    </header>
  );
}
```

### 3. 非 React 环境（Node.js / 后端）

```ts
import { defineBrand, getBrand } from '@0xainetoem/white-label';

defineBrand({ brand: { name: 'MyChain', colors: { primary: '#ff6600' } } });
const brand = getBrand();
console.log(brand.name); // "MyChain"
```

---

## CLI 命令

### `wl setup` — 一键全流程（推荐）

```bash
# 进入产品目录后在运行
cd /home/ubuntu/bitbyte-v4

# 交互式生成品牌配置 + 部署合约 + 构建上传 + Nginx SSL 配置
wl setup bitbyte \
  --name "ACME DEX" \
  --color "#ff6600" \
  --server root@1.2.3.4 \
  --domain dex.acme.com \
  --chain polygon --rpc https://polygon-rpc.com --chain-id 137 \
  --key 0x_deployer_private_key
```

**参数说明**：

| 参数 | 必需 | 说明 |
|------|:----:|------|
| `project` | 是 | `bitbyte` `zenonft` `cryptchat` `ceres` `predx` `bridge` `oxachain` |
| `--name` | 是 | 客户品牌展示名 |
| `--color` | 是 | 主品牌色（十六进制如 `#ff6600`） |
| `--server` | 是 | SSH 目标服务器（`root@1.2.3.4`） |
| `--domain` | 是 | 客户域名 |
| `--chain` | 否 | 链名（默认 `oxachain`） |
| `--rpc` | 否 | RPC URL（默认 OxaChain L1） |
| `--chain-id` | 否 | Chain ID（默认 `19505`） |
| `--key` | 否 | 合约部署私钥（不提供则跳过合约部署） |
| `--short-name` | 否 | 简称（默认取 name 前 4 位） |
| `--logo-dark` | 否 | 深色 Logo URL |
| `--mode` | 仅 Ceres | `full`（完整白标）/ `light`（仅 DID 合约） |

Ceres 特殊参数 `--mode`：
```bash
# 完整白标 — 部署全部合约 + 构建前端 + relay
wl setup ceres --name "Client" --mode full --server root@1.2.3.4

# 轻量白标 — 仅部署 DID + Registry 合约，复用 Ceres 品牌
wl setup ceres --name "DID Client" --mode light --rpc <url> --key <pk>
```

### `wl brand` — 交互式生成 branding.json

```bash
cd /home/ubuntu/zenonft
wl brand
# → 交互式输入：品牌名、简称、主色、Logo URL、域名、邮箱
# → 生成 ./branding.json
```

### `wl deploy` — 构建 + 上传

```bash
# 进入产品目录后在执行
wl deploy         # 自动检测项目

# 或指定产品
wl deploy bitbyte --server root@1.2.3.4 --domain dex.acme.com

# 构建流程（因产品而异）：
#   bitbyte    → 4 个前端 (Max/Flash/Admin/Landing) → rsync
#   oxachain   → make geth + make docker → ./deploy-l1.sh
#   cryptchat  → client + server → rsync
#   predx      → frontend-wagmi → rsync
#   bridge     → frontend-bridge → rsync
#   zenonft    → frontend → rsync
#   ceres      → frontend-v2 → rsync
```

### `wl deploy-contracts` — 部署智能合约

```bash
# cryptchat 无合约（共享基础设施），其他 7 个项目都需要
wl deploy-contracts zenonft --rpc https://rpc.chain.com --key 0x_private_key --verify

# Ceres 特殊模式
wl deploy-contracts ceres --rpc <url> --key <pk>          # light（默认）
wl deploy-contracts ceres --rpc <url> --key <pk> --full   # 完整部署

# oxachain 部署 L1 链
wl deploy-contracts oxachain
```

部署方式（因产品而异）：

| 产品 | 部署方式 | 合约 |
|:-----|---------|------|
| oxachain | `./deploy-l1.sh` | Geth genesis + signer + Docker |
| bitbyte | `./deploy-contracts.sh` | Factory / Router |
| predx | Foundry `DeployPredX.s.sol` | PredictionMarket |
| bridge | `./deploy-contracts.sh` | Bridge contracts |
| ceres | Foundry | light: DID+Registry / full: 全部 5 合约 |
| zenonft | `./deploy-contracts.sh` | NFT Marketplace |
| cryptchat | 无需合约 | — |

### `wl update` — 更新部署

```bash
# 重新构建 + 重新上传（不覆盖 branding.json 和合约）
wl update bitbyte --server root@1.2.3.4
```

### `wl list` — 查看可用产品和当前检测

```bash
wl list

# 输出:
#   可白标部署的产品:
#     bitbyte      — DEX (Flash + Max 双版本)
#     zenonft      — NFT 市场
#     ...
#
#   ✓ 当前项目: bitbyte
#     品牌: ACME
#     链: oxachain (Chain ID: 19505)
```

---

## branding.json 完整格式

```json
{
  "brand": {
    "name": "客户品牌名",
    "shortName": "ACME",
    "logo": {
      "dark": "https://cdn.客户.com/logo-dark.svg",
      "light": "https://cdn.客户.com/logo-light.svg",
      "favicon": "https://cdn.客户.com/favicon.ico"
    },
    "colors": {
      "primary": "#ff6600",
      "primaryHover": "#e55d00",
      "secondary": "#1a1a2e",
      "accent": "#00d4aa"
    },
    "domain": "客户.com",
    "contactEmail": "support@客户.com",
    "social": {
      "twitter": "https://x.com/客户",
      "discord": "https://discord.gg/客户",
      "telegram": "https://t.me/客户"
    }
  },
  "chain": {
    "network": "mainnet",
    "rpcUrl": "https://rpc.客户.com",
    "chainId": 8888,
    "explorerUrl": "https://explorer.客户.com",
    "nativeToken": "TICKER"
  },
  "features": {
    "modules": ["swap", "perpetual"],
    "enabledChains": ["ethereum", "bsc"]
  }
}
```

### 项目特有字段

**OxaChain** 额外字段：

```json
{
  "consensus": {
    "type": "clique",
    "period": 30,
    "epoch": 30000,
    "blockRewardWei": "0",
    "signerCount": 7
  },
  "token": {
    "name": "MyChain Token",
    "symbol": "MCT",
    "decimals": 18,
    "initialAllocWei": "100000000000000000000000"
  },
  "deploy": {
    "imageName": "mychain/geth",
    "imageTag": "latest",
    "containerPrefix": "mychain",
    "networkName": "mychain",
    "binaryName": "mychain-geth",
    "buildTarget": "mychain"
  }
}
```

**Ceres** 额外字段：

```json
{
  "mode": "full",
  "contracts": {
    "deployAll": true
  }
}
```

轻量模式：

```json
{
  "mode": "light",
  "contracts": {
    "deployAll": false,
    "only": ["CeresDID", "CeresRegistry"]
  }
}
```

---

## React API

### `BrandProvider`

挂载后自动执行 3 个副作用：

| 副作用 | 说明 |
|--------|------|
| CSS 变量注入 | `--brand-primary` `--brand-primary-hover` `--brand-secondary` `--brand-accent` 注入 `:root` |
| Favicon 替换 | 自动设置 `<link rel="icon">` |
| Meta 标签替换 | `<title>` + OG:title + Twitter:title + description |

```tsx
import { BrandProvider } from '@0xainetoem/white-label/react';

<BrandProvider brand={brand}>
  <App />
</BrandProvider>
```

### `useBrand()`

```tsx
import { useBrand } from '@0xainetoem/white-label/react';

function Footer() {
  const { brand } = useBrand(); // BrandConfig
  return (
    <footer>
      <p>© {brand.name}</p>
      <p>联系: {brand.contactEmail}</p>
    </footer>
  );
}
```

### `BrandLogo`

```tsx
import { BrandLogo } from '@0xainetoem/white-label/react';

// 深色背景用 light 变体
<BrandLogo variant="light" className="h-8" />
// 浅色背景用 dark（默认）
<BrandLogo variant="dark" />
```

---

## 非 React API

```ts
import { defineBrand, getBrand } from '@0xainetoem/white-label';
import { injectCSSVars, injectFavicon, injectMeta } from '@0xainetoem/white-label';

// 设置品牌（全局单例）
const brand = defineBrand({
  brand: { name: 'MyBrand', colors: { primary: '#ff6600' } }
});

// 读取品牌
const current = getBrand();

// 手动注入副作用（React 项目由 BrandProvider 自动处理）
injectCSSVars(current);   // CSS 变量 → :root
injectFavicon(current);   // Favicon → <link>
injectMeta(current);      // Meta → <head>
```

---

## CSS 变量对照表

| CSS 变量 | branding.json 字段 | 默认值 |
|----------|-------------------|--------|
| `--brand-primary` | `brand.colors.primary` | `#3b82f6` |
| `--brand-primary-hover` | `brand.colors.primaryHover` | `#2563eb` |
| `--brand-secondary` | `brand.colors.secondary` | `#1e293b` |
| `--brand-accent` | `brand.colors.accent` | `#06b6d4` |

Tailwind 中使用：

```css
/* tailwind.config.js 或 global.css */
@layer base {
  :root {
    --brand-primary: #3b82f6; /* 会被 BrandProvider 覆盖 */
  }
}
```

```tsx
<div className="bg-[var(--brand-primary)] text-white">
  Branded Content
</div>
```

---

## SDK 集成包装器

7 个产品 SDK 已集成品牌注入包装器：

| 导出路径 | 函数 | 注入 SDK | 方式 |
|----------|------|---------|------|
| `@0xainetoem/white-label/oxachain` | `createOxaChainClient()` | `oxachain-sdk` | 原生 `setBrand()` |
| `@0xainetoem/white-label/bitbyte` | `createBitByteSDK()` | `@bitbytev4/sdk` | 包装对象 `getBrand()` |
| `@0xainetoem/white-label/predx` | `createPredXClient()` | `@0xpredx/sdk` | 包装对象 `getBrand()` |
| `@0xainetoem/white-label/ceres` | `createCeresConfig()` | `@ceresv2/sdk` | 配置对象（CeresProvider） |
| `@0xainetoem/white-label/bridge` | `createBridgeSDK()` | `@0xaibridge/sdk` | 包装对象 `getBrand()` |
| `@0xainetoem/white-label/cryptchat` | `createCryptChat()` | `@cryptchat/sdk` | 包装对象 `getBrand()` |
| `@0xainetoem/white-label/zenonft` | `createZenoNFT()` | `@zenonft/sdk` | 包装对象 `getBrand()` |

示例：

```ts
import { defineBrand } from '@0xainetoem/white-label';
import { createOxaChainClient } from '@0xainetoem/white-label/oxachain';

defineBrand({ brand: { name: 'MyChain', colors: { primary: '#ff6600' } } });
const client = createOxaChainClient({ rpcUrl: 'http://localhost:18545' });
console.log(client.getBrand().name); // "MyChain"
```

> **注意**：这些 SDK 是可选依赖（`peerDependenciesMeta.optional=true`），需项目中额外 `npm install` 对应 SDK 包。如果 SDK 尚未发布到 npm（如 `@0xaibridge/sdk`），SDK 包装器会优雅降级并提示安装。

---

## OxaChain 公链白标（高级用法）

OxaChain 是特殊的白标产品——底层的 Geth 节点也需要品牌化改造。

```bash
# 生成品牌链配置
wl setup oxachain \
  --name "Acme Chain" --color "#ff6600" \
  --server root@1.2.3.4 --domain acme.io

# 或手动使用 Makefile
make build BRANDING_FILE=branding.json
# → 自动执行 6 项 Geth 源码改造：
#   1. 原生代币名/符号
#   2. Chain ID
#   3. 出块时间 (Clique)
#   4. 区块奖励（0 = 关闭）
#   5. 初始代币分配
#   6. 启动节点 signer 密钥

# 部署 L1 链
./deploy-l1.sh
# → 8 步自动化：signer 密钥 → genesis → Docker build → 启动 → 健康检查
```

自动生成的 Go 源码文件：

```
build/geth-patch/
├── branding.mk               # Makefile 参数
├── apply-patch.sh             # 应用到 geth-src
├── apply-block-reward.py      # 区块奖励注入
├── oxachain-l1.patch
└── src/
    ├── params/{brand}chain_config.go
    ├── core/{brand}chain_genesis.go
    └── cmd/utils/{brand}chain_flags.go
```

---

## Ceres 双模式白标

| 模式 | 场景 | 部署内容 |
|:----:|------|---------|
| `full` | 客户全新品牌 | 全部 5 合约（DID+Registry+InviteCore+FeeContract+GoldVault）+ 前端 + Relayer |
| `light` | 只需自有 DID | 仅 CeresDID + CeresRegistry 合约（前端和品牌复用 Ceres） |

```bash
# 完整白标
wl setup ceres --name "Client" --mode full \
  --server root@1.2.3.4 --domain client.com \
  --rpc https://rpc --key 0x_key

# 轻量白标
wl setup ceres --name "DID Client" --mode light \
  --rpc https://rpc --key 0x_key
```

---

## 目录结构

```
white-label/
├── bin/wl.js                           # CLI 入口
├── src/
│   ├── index.ts                        # 主入口（export 核心 API）
│   ├── types.ts                        # BrandConfig 类型 + defineBrand/getBrand
│   ├── react/index.tsx                 # BrandProvider / useBrand / BrandLogo
│   ├── cli/
│   │   ├── index.ts                    # CLI 全部实现（~540 行）
│   │   └── types.ts                    # CLI 类型
│   ├── integrations/
│   │   ├── bitbyte.ts                  # @bitbytev4/sdk 包装器
│   │   ├── predx.ts                    # @0xpredx/sdk 包装器
│   │   ├── ceres.ts                    # @ceresv2/sdk 包装器
│   │   ├── bridge.ts                   # @0xaibridge/sdk 包装器
│   │   ├── oxachain.ts                 # oxachain-sdk 包装器
│   │   ├── cryptchat.ts                # @cryptchat/sdk 包装器
│   │   └── zenonft.ts                  # @zenonft/sdk 包装器
│   ├── utils/
│   │   ├── css-vars.ts                 # CSS 变量注入
│   │   ├── favicon.ts                  # Favicon 替换
│   │   └── meta.ts                     # Meta 标签替换
│   └── templates/
│       └── branding.json               # branding.json 模板
├── package.json                        # @0xainetoem/white-label
├── tsconfig.json                       # TypeScript 配置
└── README.md
```

---

## 类型

```ts
import type { BrandConfig } from '@0xainetoem/white-label';

interface BrandConfig {
  brand: {
    name: string;
    shortName: string;
    logo: {
      dark: string;    // 深色背景 Logo URL
      light: string;   // 浅色背景 Logo URL
      favicon: string; // Favicon URL
    };
    colors: {
      primary: string;       // 主品牌色
      primaryHover: string;  // Hover 状态色
      secondary: string;     // 辅助色
      accent: string;        // 强调色
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
```

---

## 发布到 npm

当前版本：**v1.0.2**（已发布）

```bash
npm run build                    # TypeScript 编译
npm publish                     # 发布 @0xainetoem/white-label
```

> 注意：`publishConfig.access = "public"`（scoped 包需要）。包体积约 27.5 kB（压缩）/ 108.5 kB（解压），共 63 个文件。

---

## 许可证

MIT — 0xAI Ecosystem
