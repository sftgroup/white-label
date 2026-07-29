# White-Label SDK 使用手册

> **文档版本**: 1.0.0 | **包名**: `@0xainetoem/white-label` | **仓库**: [sftgroup/white-label](https://github.com/sftgroup/white-label)

---

## 目录

1. [架构总览](#1-架构总览)
2. [branding.json 完整参考](#2-brandingjson-完整参考)
3. [前端接入指南（React）](#3-前端接入指南react)
4. [前端接入指南（非 React）](#4-前端接入指南非-react)
5. [CLI 命令详解](#5-cli-命令详解)
6. [SDK 集成包装器详解](#6-sdk-集成包装器详解)
7. [产品白标分步指南](#7-产品白标分步指南)
8. [Ceres 双模式白标详解](#8-ceres-双模式白标详解)
9. [OxaChain 公链白标详解](#9-oxachain-公链白标详解)
10. [CI/CD 集成](#10-cicd-集成)
11. [多环境部署](#11-多环境部署)
12. [Nginx 配置参考](#12-nginx-配置参考)
13. [DNS 与 SSL 配置](#13-dns-与-ssl-配置)
14. [故障排查](#14-故障排查)
15. [安全注意事项](#15-安全注意事项)
16. [添加新的白标产品](#16-添加新的白标产品)
17. [发布到 npm](#17-发布到-npm)

---

## 1. 架构总览

### 1.1 分层架构

```
┌────────────────────────────────────────────────────┐
│                   客户浏览器                          │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Brand     │  │ useBrand │  │ BrandLogo        │ │
│  │ Provider  │  │  Hook    │  │  Component        │ │
│  └─────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│        └──────────────┴─────────────────┘           │
│                      │ CSS 变量注入                   │
│                      │ Favicon 替换                   │
│                      │ Meta 标签替换                   │
│  ┌─────────────────────────────────────────────┐    │
│  │  BrandConfig (global singleton)             │    │
│  └──────────────────┬──────────────────────────┘    │
└─────────────────────┼──────────────────────────────┘
                      │
┌─────────────────────┼──────────────────────────────┐
│  White-Label SDK    │                              │
│  ┌──────────────────┴──────────────────────────┐   │
│  │  defineBrand(config?) → BrandConfig         │   │
│  │  getBrand()          → BrandConfig          │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │  CLI: wl     │  │  SDK         │  │  Utils   │  │
│  │  setup       │  │  Wrappers    │  │  CSS     │  │
│  │  deploy      │  │  bitbyte     │  │  Favicon │  │
│  │  deploy-     │  │  predx       │  │  Meta    │  │
│  │  contracts   │  │  ceres       │  │          │  │
│  │  brand       │  │  bridge      │  │          │  │
│  │  list        │  │  oxachain    │  │          │  │
│  │  update      │  │  cryptchat   │  │          │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────┬──────────────────────────────┘
                      │ reads
┌─────────────────────┴──────────────────────────────┐
│  branding.json (项目根目录或 src/)                    │
│  { brand: { name, colors, logo, ... },              │
│    chain: { rpcUrl, chainId, ... },                 │
│    features: { modules, enabledChains } }           │
└────────────────────────────────────────────────────┘
```

### 1.2 数据流

1. **`defineBrand()`** — 读取 `branding.json`（自动检测位置），与默认值合并，存为全局单例
2. **`BrandProvider`** — 挂载时自动执行 `injectCSSVars() + injectFavicon() + injectMeta()`
3. **`useBrand()`** — 任意子组件读取品牌配置
4. **CLI** — 读取 `branding.json` 生成的项目特有字段（如 OxaChain consensus），执行对应部署流程
5. **SDK Wrappers** — 读取全局单例，注入到各产品 SDK 构造函数

### 1.3 全局单例生命周期

```ts
// 1. 初始化（应用入口）
import { defineBrand } from '@0xainetoem/white-label';
const brand = defineBrand(); // _brand = 合并后的 BrandConfig

// 2. 任意地方读取（无 import 依赖）
import { getBrand } from '@0xainetoem/white-label';
const current = getBrand(); // 返回全局单例

// 3. 动态更新（主题切换）
import { defineBrand } from '@0xainetoem/white-label';
defineBrand({ brand: { name: 'New Brand' } }); // 覆盖单例
```

---

## 2. branding.json 完整参考

### 2.1 通用字段（所有产品）

| 路径 | 类型 | 必需 | 默认值 | 说明 |
|------|------|:----:|--------|------|
| `brand.name` | `string` | 是 | `"0xAI"` | 品牌展示名 |
| `brand.shortName` | `string` | 是 | `"0x"` | 简称（4-6 字符） |
| `brand.logo.dark` | `string` | 否 | `"/logo-dark.svg"` | 深色背景 Logo URL |
| `brand.logo.light` | `string` | 否 | `"/logo-light.svg"` | 浅色背景 Logo URL |
| `brand.logo.favicon` | `string` | 否 | `"/favicon.ico"` | Favicon URL |
| `brand.colors.primary` | `string` | 是 | `"#3b82f6"` | 主品牌色（十六进制） |
| `brand.colors.primaryHover` | `string` | 否 | `"#2563eb"` | Hover 状态色 |
| `brand.colors.secondary` | `string` | 否 | `"#1e293b"` | 辅助背景色 |
| `brand.colors.accent` | `string` | 否 | `"#06b6d4"` | 强调色 |
| `brand.domain` | `string` | 是 | `"localhost"` | 部署域名 |
| `brand.contactEmail` | `string` | 否 | `"contact@0xainet.top"` | 联系邮箱 |
| `brand.social.twitter` | `string` | 否 | `""` | Twitter/Discord/Telegram URL |
| `chain.network` | `string` | 否 | `"testnet"` | `mainnet` 或 `testnet` |
| `chain.rpcUrl` | `string` | 否 | `"https://rpc-oxa.0xainet.top"` | 链 RPC 端点 |
| `chain.chainId` | `number` | 否 | `8888` | 链 ID |
| `chain.explorerUrl` | `string` | 否 | `""` | 区块浏览器 URL |
| `chain.nativeToken` | `string` | 否 | `"T0X"` | 原生代币符号 |
| `features.modules` | `string[]` | 否 | `[]` | 启用的功能模块 |
| `features.enabledChains` | `string[]` | 否 | `["ethereum"]` | 启用的链列表 |

### 2.2 OxaChain 特有字段

OxaChain 需要额外的共识和代币配置才能生成 Geth 节点。

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
    "name": "Acme Token",
    "symbol": "ACT",
    "decimals": 18,
    "initialAllocWei": "100000000000000000000000"
  },
  "deploy": {
    "imageName": "acme/geth",
    "imageTag": "latest",
    "containerPrefix": "acme",
    "networkName": "acme",
    "dockerPassword": "acme",
    "binaryName": "acme-geth",
    "buildTarget": "acme"
  }
}
```

| 路径 | 类型 | 说明 |
|------|------|------|
| `consensus.type` | `"clique"` | 共识引擎（当前仅支持 Clique PoA） |
| `consensus.period` | `number` | 出块时间（秒），推荐 15-30 |
| `consensus.epoch` | `number` | Epoch 长度（块数），默认 30000 |
| `consensus.blockRewardWei` | `string` | 每块奖励（wei），`"0"`=关闭奖励 |
| `consensus.signerCount` | `number` | Authority 节点数量 |
| `token.name` | `string` | 原生代币全名 |
| `token.symbol` | `string` | 原生代币符号（3-6 字符） |
| `token.decimals` | `number` | 代币精度，推荐 `18` |
| `token.initialAllocWei` | `string` | 创世块分配（wei），1000 代币示例：`"1000000000000000000000"` |

### 2.3 Ceres 特有字段

```json
{
  "mode": "full",
  "contracts": {
    "deployAll": true
  }
}
```

| 模式 | `deployAll` | 部署合约 |
|:----:|:-----------:|----------|
| `full` | `true` | CeresDID + CeresRegistry + CeresInviteCore + CeresFeeContract + GoldVault |
| `light` | `false`, `only: ["CeresDID", "CeresRegistry"]` | 仅 CeresDID + CeresRegistry |

### 2.4 Bridge 特有字段

```json
{
  "features": {
    "enabledChains": ["SEPOLIA", "L1", "BSC_TESTNET"]
  }
}
```

### 2.5 branding.json 查找路径优先级

`defineBrand()` 自动检测以下位置（按优先级）：

1. 传入参数 source（通过 `defineBrand(config)` 直接传入）
2. `./branding.json` — 项目根目录
3. `./src/branding.json` — 前端源码目录
4. `./frontend-max-react/src/branding.json` — BitByte 特有
5. `./frontend-bridge/src/branding.json` — Bridge 特有
6. `./frontend/src/branding.json` — ZenoNFT 特有
7. `./frontend-v2/frontend/src/branding.json` — Ceres 特有
8. 默认值（`defaultBrand`）

### 2.6 CLI 自动检测规则

| 检测到以下文件存在 | 推断产品 |
|-------------------|---------|
| `genesis.json` + `geth/Dockerfile` | `oxachain` |
| `frontend-max-react/src/branding.json` + `deploy-contracts.sh` | `bitbyte` |
| `contracts/script/DeployPredX.s.sol` | `predx` |
| `client/src` + `server/src` | `cryptchat` |
| `frontend/src` + `contracts/script` | `zenonft` |
| `frontend-bridge/package.json` + `foundry.toml` | `bridge` |
| `frontend-v2/frontend/src/branding.json` + `sdk/src/index.ts` | `ceres` |

---

## 3. 前端接入指南（React）

### 3.1 标准接入（5 步）

**步骤 1：安装**

```bash
npm install @0xainetoem/white-label
```

**步骤 2：创建 branding.json**

```bash
npx wl brand
# 交互式输入：品牌名、简称、主色、Logo URL、域名、邮箱
# 自动生成 ./branding.json 或 ./src/branding.json
```

或者手动创建 `src/branding.json`：

```json
{
  "brand": {
    "name": "ACME DEX",
    "shortName": "ACME",
    "colors": { "primary": "#ff6600" },
    "domain": "dex.acme.com",
    "contactEmail": "support@acme.com"
  }
}
```

**步骤 3：修改入口文件（main.tsx）**

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { defineBrand, BrandProvider } from '@0xainetoem/white-label/react';
import App from './App';

// 读取 branding.json（自动查找），与默认值合并
const brand = defineBrand();

createRoot(document.getElementById('root')!).render(
  <BrandProvider brand={brand}>
    <App />
  </BrandProvider>
);
```

`BrandProvider` 挂载时自动执行：
- 注入 4 个 CSS 变量到 `:root`
- 替换 `<link rel="icon">`
- 设置 `<title>`、OG/Twitter meta 标签

**步骤 4：替换组件中的硬编码**

```tsx
// 之前（硬编码）
<header style={{ backgroundColor: '#3b82f6' }}>
  <img src="/static/logo-dark.svg" alt="0xAI" className="h-8" />
  <h1>0xAI</h1>
</header>

// 之后（品牌化）
import { useBrand, BrandLogo } from '@0xainetoem/white-label/react';

function Header() {
  const { brand } = useBrand();
  return (
    <header style={{ backgroundColor: brand.colors.primary }}>
      <BrandLogo variant="dark" className="h-8" />
      <h1>{brand.name}</h1>
    </header>
  );
}
```

**替换清单**：

| 元素 | 替换前 | 替换后 |
|------|--------|--------|
| Logo | `<img src="/static/logo.svg" />` | `<BrandLogo variant="dark" />` |
| 品牌名 | 字符串 `"0xAI"` | `{brand.name}` |
| 主色 | `#3b82f6` | `brand.colors.primary` 或 `var(--brand-primary)` |
| 标题 | `document.title = "0xAI"` | BrandProvider 自动处理 |
| Favicon | `<link rel="icon">` | BrandProvider 自动处理 |

**步骤 5：垂直布局 Tailwind CSS 变量**

如果你的项目使用 Tailwind CSS，可以在 Tailwind 配置中引用 CSS 变量：

```ts
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          hover: 'var(--brand-primary-hover)',
        },
      },
    },
  },
};
```

组件中使用：

```tsx
<button className="bg-brand-primary hover:bg-brand-hover text-white px-4 py-2 rounded">
  {brand.name} Button
</button>
```

### 3.2 动态品牌切换

```tsx
const [currentBrand, setCurrentBrand] = useState(defineBrand());

const switchBrand = (newBrand: Partial<BrandConfig>) => {
  const updated = defineBrand(newBrand);
  setCurrentBrand(updated);
};

// 重新挂载 BrandProvider 触发副作用
<BrandProvider brand={currentBrand}>
  <App />
</BrandProvider>
```

### 3.3 SSR / 非 Provider 场景降级

`useBrand()` 在找不到 `BrandContext` 时会自动降级返回全局单例（`getBrand()`），确保 SSR 和测试环境正常工作。

```tsx
function Footer() {
  const { brand } = useBrand(); // 无 Provider 时返回 getBrand()
  return <p>© {brand.name}</p>;
}
```

---

## 4. 前端接入指南（非 React）

### 4.1 Vite / HTML 项目

```ts
import { defineBrand, getBrand } from '@0xainetoem/white-label';
import { injectCSSVars, injectFavicon, injectMeta } from '@0xainetoem/white-label';

const brand = defineBrand({
  brand: {
    name: 'ACME',
    shortName: 'ACME',
    logo: {
      dark: 'https://cdn.acme.com/logo-dark.svg',
      favicon: 'https://cdn.acme.com/favicon.ico',
    },
    colors: { primary: '#ff6600' },
    domain: 'acme.com',
  },
});

// 手动注入（React 项目由 BrandProvider 自动处理）
injectCSSVars(brand);   // CSS 变量 → :root
injectFavicon(brand);   // Favicon → <link>
injectMeta(brand);      // Meta → <head>
```

### 4.2 Node.js 后端

```ts
import { defineBrand, getBrand } from '@0xainetoem/white-label';

defineBrand({
  brand: { name: 'Acme Chain', shortName: 'ACT', domain: 'acme.io' },
  chain: { chainId: 12345, rpcUrl: 'http://localhost:8545' },
});

const brand = getBrand();
console.log(brand.chain.rpcUrl); // http://localhost:8545
```

### 4.3 SDK Wrapper 非 React 场景

```ts
import { defineBrand } from '@0xainetoem/white-label';
import { createOxaChainClient } from '@0xainetoem/white-label/oxachain';

defineBrand({
  brand: { name: 'Acme Chain', colors: { primary: '#ff6600' } },
  chain: { rpcUrl: 'http://localhost:18545' },
});

const client = createOxaChainClient({ rpcUrl: 'http://localhost:18545' });
console.log(client.getBrand().name); // "Acme Chain"
```

---

## 5. CLI 命令详解

### 5.1 `wl setup` — 一键全流程

**流程**:

```
wl setup <project>
  │
  ├── Step 1: 生成 branding.json ├── 交互式（wl brand）或参数输入
  │
  ├── Step 2: 部署合约 ────────── 如果 needsContracts(project) && --key 提供
  │   ├── oxachain → ./deploy-l1.sh
  │   ├── ceres → forge script (light 或 full)
  │   ├── bitbyte → ./deploy-contracts.sh
  │   └── ...
  │
  ├── Step 3: 构建 + 部署 ──────── 如果 --server 提供
  │   └── 各产品 DEPLOYERS 函数
  │
  └── Step 4: 完成 ────────────── 输出总结
```

**完整示例**（BitByte 完整白标部署）：

```bash
wl setup bitbyte \
  --name "ACME DEX" \
  --color "#ff6600" \
  --short-name "ACME" \
  --logo-dark "https://cdn.acme.com/logo.svg" \
  --logo-favicon "https://cdn.acme.com/favicon.ico" \
  --server root@1.2.3.4 \
  --domain dex.acme.com \
  --chain polygon \
  --rpc https://polygon-rpc.com \
  --chain-id 137 \
  --key 0x1234...
```

**逐步骤执行**（手动模式）：

```bash
# Step 1: 生成品牌
wl brand
# 或直接编写 branding.json

# Step 2: 部署合约
wl deploy-contracts bitbyte \
  --rpc https://polygon-rpc.com \
  --key 0x1234... \
  --verify

# Step 3: 构建+部署
wl deploy bitbyte \
  --server root@1.2.3.4 \
  --domain dex.acme.com
```

### 5.2 `wl deploy` — 产品构建部署矩阵

| 产品 | 构建步骤 | 前端目录 | 部署目标 | 后端 |
|:----:|----------|----------|----------|------|
| oxachain | `make geth` → `make docker` | — | `./deploy-l1.sh` | 4 Docker 容器 |
| bitbyte | 4 个前端构建 | Max/Flash/Admin/Landing | `rsync` → `/var/www/bitbyte-v4/` | — |
| predx | `frontend-wagmi` 构建 | `frontend-wagmi/dist/` | `rsync` → `/var/www/predx/` | backend + MCP |
| cryptchat | client + server 构建 | `client/dist/` + `server/dist/` | `rsync` 到前端+后端目录 | pm2 管理 |
| bridge | `frontend-bridge` 构建 | `frontend-bridge/dist/` | `rsync` → `/var/www/bridge/` | — |
| zenonft | `frontend` 构建 | `frontend/dist/` | `rsync` → `/var/www/zenonft/` | — |
| ceres | `frontend-v2/frontend` 构建 | `frontend-v2/frontend/dist/` | `rsync` → `/var/www/ceres/` | Relayer |

### 5.3 `wl deploy-contracts` — 合约部署细则

| 产品 | 脚本/命令 | 合约 | 链要求 |
|:----:|-----------|------|--------|
| oxachain | `./deploy-l1.sh` | 创世块 + Node 容器 | Docker |
| bitbyte | `./deploy-contracts.sh` | Factory + Router | EVM 链 |
| predx | `forge script DeployPredX.s.sol` | PredictionMarket | Foundry 兼容 |
| bridge | `./deploy-contracts.sh` | Bridge 合约 | EVM 链 |
| ceres (light) | `forge script Deploy.s.sol` | CeresDID + CeresRegistry | Foundry 兼容 |
| ceres (full) | `forge script DeployV2.s.sol` | 全部 5 合约 | Foundry 兼容 |
| zenonft | `./deploy-contracts.sh` | NFT Marketplace | EVM 链 |

### 5.4 `wl brand` — 交互式生成

```bash
$ wl brand
=== 白标品牌配置生成 ===

检测到项目: bitbyte

客户名称 (e.g. ACME): ACME DEX
简称: ACME
主色 (e.g. #ff6600): #ff6600
Logo Dark URL: https://cdn.acme.com/logo.svg
Favicon URL: https://cdn.acme.com/favicon.ico
域名 (e.g. acme-dex.com): dex.acme.com
联系邮箱: support@acme.com

✅ branding.json 已生成
```

### 5.5 `wl list` — 检测当前项目

```bash
$ wl list
可白标部署的产品:

  bitbyte      — DEX (Flash + Max 双版本)
  zenonft      — NFT 市场
  cryptchat    — 加密社交
  ceres        — DID / 社交图谱
  predx        — 预测市场
  bridge       — 跨链桥
  pocketx      — Agent OS / 超级钱包
  oxachain     — AI-Native 公链

✓ 当前项目: bitbyte
  品牌: ACME DEX
  链: oxachain (Chain ID: 19505)
```

### 5.6 `wl update` — 更新流程

1. 重新部署合约（如果有合约变更）
2. 重新构建前端（`npm run build`）
3. 重新 rsync 到服务器
4. 保持 `branding.json` 不变
5. 不影响已部署合约

```bash
wl update bitbyte --server root@1.2.3.4
```

---

## 6. SDK 集成包装器详解

### 6.1 OxaChain SDK（原生支持）

OxaChain SDK 原生支持 `setBrand()`，白标 SDK 直接注入到构造函数：

```ts
// packages/white-label/src/integrations/oxachain.ts
import { OxaChainClient } from 'oxachain-sdk';
import { getBrand } from '../types.js';

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
```

**原生品牌支持的含义**：OxaChain SDK 的每个 API 调用都会自动携带品牌信息（如链名、代币符号），无需额外配置。

### 6.2 非原生 SDK（包装对象模式）

其他 6 个产品的 SDK 不原生支持品牌，通过返回包装对象注入品牌信息：

```ts
// 通用包装器模式
export function createBitByteSDK(config?: BitByteSDKConfig): BitByteWithBrand {
  const brand = getBrand();
  const sdk = new BitByteSDK(config);

  // 返回包装对象：底层 SDK 不变，额外挂载品牌信息
  return {
    sdk,                        // 原始 SDK
    get name() { return brand.brand.name; },
    get primaryColor() { return brand.brand.colors.primary; },
    getBrand() {
      return {
        name: brand.brand.name,
        shortName: brand.brand.shortName,
        primaryColor: brand.brand.colors.primary,
      };
    },
  };
}
```

**使用模式**：

```ts
// 之前（无品牌）
const sdk = new BitByteSDK({ apiBase: '/api' });
sdk.submitOrder(...);

// 之后（品牌化）
const branded = createBitByteSDK({ apiBase: '/api' });
branded.sdk.submitOrder(...);        // 原 SDK 方法不变
console.log(branded.name);           // "ACME DEX"
console.log(branded.getBrand());     // { name: "ACME DEX", ... }
```

### 6.3 Ceres SDK（配置模式）

Ceres SDK 使用 React Context，白标 SDK 返回配置对象供 CeresProvider 使用：

```ts
export function createCeresConfig(): CeresBrandConfig {
  const brand = getBrand();
  return {
    name: brand.brand.name,
    primaryColor: brand.brand.colors.primary,
    accentColor: brand.brand.colors.accent,
    logo: brand.brand.logo,
    mode: (brand as any).mode || 'full',
  };
}
```

**使用模式**：

```tsx
import { CeresProvider } from '@ceresv2/sdk';
import { createCeresConfig } from '@0xainetoem/white-label/ceres';

const ceresConfig = createCeresConfig();

<CeresProvider config={ceresConfig}>
  <App />
</CeresProvider>
```

### 6.4 可选依赖说明

所有 SDK 包装器使用 `peerDependenciesMeta.optional = true`，意味着：

```json
{
  "peerDependencies": {
    "@bitbytev4/sdk": "^2.0.0"   // 可选：不安装也没关系
  },
  "peerDependenciesMeta": {
    "@bitbytev4/sdk": { "optional": true }
  }
}
```

只在导入对应包装器时才需要安装 SDK：

```bash
# 只需要核心功能（BrandProvider + CLI），不需要 SDK 包装
npm install @0xainetoem/white-label

# 需要 OxaChain SDK 包装
npm install @0xainetoem/white-label oxachain-sdk
```

---

## 7. 产品白标分步指南

### 7.1 BitByte（DEX）

**部署架构**：4 个独立前端（Max-React、Flash、Admin、Landing）+ Solidity 合约

```bash
# Step 1: 克隆
git clone https://github.com/sftgroup/bitbyte-v4.git
cd bitbyte-v4

# Step 2: 品牌配置
wl setup bitbyte \
  --name "ACME DEX" --color "#ff6600" \
  --server root@1.2.3.4 --domain dex.acme.com \
  --chain polygon --rpc https://polygon-rpc.com \
  --chain-id 137 --key 0x_deployer_key

# Step 3: 验证
curl -I https://dex.acme.com
# 期望: HTTP 200, 显示 ACME DEX 品牌
```

**4 个前端各自独立**：
- `frontend-max-react/` — 主交易界面（现货 + 合约）
- `frontend-flash/` — 闪电交易
- `frontend-admin/` — 管理后台
- `frontend-landing/` — 落地页

每个前端的 `branding.json` 需要在各自目录下创建，或使用 `wl setup` 统一生成。

### 7.2 ZenoNFT（NFT 市场）

**部署架构**：1 个前端 + NFT Marketplace 合约

```bash
git clone https://github.com/sftgroup/zenonft.git
cd zenonft

wl setup zenonft \
  --name "ACME NFT" --color "#00cc88" \
  --server root@1.2.3.4 --domain nft.acme.com

wl deploy-contracts zenonft \
  --rpc https://rpc.chain.com --key 0x_deployer_key --verify
```

### 7.3 CryptChat（加密社交）

**部署架构**：React 客户端 + Node.js 服务端

```bash
git clone https://github.com/sftgroup/cryptchat.git
cd cryptchat

wl setup cryptchat \
  --name "ACME Chat" --color "#7c3aed" \
  --server root@1.2.3.4 --domain chat.acme.com
```

> **注意**：CryptChat 不需要合约部署（`needsContracts('cryptchat') === false`），使用共享基础设施合约。

前端部署到 `/var/www/cryptchat/`（Nginx），服务端部署到 `/opt/cryptchat/server/`（pm2）。

### 7.4 PredX（预测市场）

**部署架构**：1 个前端 + PredictionMarket 合约 + Backend + MCP

```bash
git clone https://github.com/sftgroup/predx.git
cd predx

wl setup predx \
  --name "ACME Predict" --color "#f59e0b" \
  --server root@1.2.3.4 --domain pred.acme.com

wl deploy-contracts predx \
  --rpc https://rpc.chain.com --key 0x_deployer_key
```

启动后端和 MCP：

```bash
ssh root@1.2.3.4
cd /opt/predx
node src/index.js &         # REST API
npx @0xpredx/mcp &          # AI MCP Server
```

### 7.5 Bridge（跨链桥）

**部署架构**：1 个前端 + Bridge 合约

```bash
git clone https://github.com/sftgroup/0xbridge.git
cd 0xbridge

wl setup bridge \
  --name "ACME Bridge" --color "#06b6d4" \
  --server root@1.2.3.4 --domain bridge.acme.com

wl deploy-contracts bridge \
  --rpc https://rpc.chain.com --key 0x_deployer_key
```

Branding.json 路径：`frontend-bridge/src/branding.json`

### 7.6 Ceres（DID/社交图谱）

见第 8 节。

### 7.7 OxaChain（公链）

见第 9 节。

---

## 8. Ceres 双模式白标详解

Ceres 提供两种白标模式，应对不同的客户需求。

### 8.1 模式对比

| 特性 | `full`（完整白标） | `light`（轻量白标） |
|------|:-----------------:|:------------------:|
| 合约部署范围 | DID + Registry + InviteCore + FeeContract + GoldVault | 仅 DID + Registry |
| 前端 | 构建 + 上传到客户服务器 | 不部署（复用 Ceres 品牌） |
| Relayer | 编译 + 上传 | 不部署 |
| 品牌名 | 客户专属品牌 | 仍是 Ceres |
| 适用场景 | 客户要全新品牌 DApp | 客户只需要自己的 DID 合约 |
| 部署时间 | ~5 分钟 | ~2 分钟 |

### 8.2 完整白标部署流程

```bash
cd /home/ubuntu/ceres

# 一键全流程
wl setup ceres \
  --name "ACME Social" \
  --color "#00d4aa" \
  --mode full \
  --server root@1.2.3.4 \
  --domain social.acme.com \
  --rpc https://rpc.oxachain.com \
  --key 0x_deployer_key
```

**内部流程**：

```
wl setup ceres --mode full
  │
  ├── [1/4] 生成 branding.json
  │   └── mode: "full", contracts: { deployAll: true }
  │
  ├── [2/4] 部署合约（Foundry Forge）
  │   └── forge script script/DeployV2.s.sol
  │       ├── CeresDID.sol         → 客户自有 DID NFT
  │       ├── CeresRegistry.sol    → 客户自有 Registry
  │       ├── CeresInviteCore.sol  → 邀请合约
  │       ├── CeresFeeContract.sol → 付费合约
  │       └── GoldVault.sol        → 资产金库
  │       └── PRIVATE_KEY + RELAYER_ADDRESS 环境变量
  │
  ├── [3/4] 构建前端 + Relayer
  │   ├── frontend-v2/frontend → npm install → npm run build
  │   └── frontend-v2/relayer → npm install → npm run build
  │
  └── [4/4] 部署到服务器
      ├── rsync frontend → /var/www/ceres/
      └── rsync relayer  → /opt/ceres/relayer/
```

### 8.3 轻量白标部署流程

```bash
cd /home/ubuntu/ceres

# 仅部署 DID + Registry 合约
wl setup ceres \
  --name "DID Client" \
  --color "#00d4aa" \
  --mode light \
  --rpc https://rpc.oxachain.com \
  --key 0x_deployer_key
```

**特点**：
- 客户获得自己的 CeresDID + CeresRegistry 合约
- 前端仍使用 Ceres 品牌（不构建不部署）
- RELAYER_ADDRESS 可选，默认为 deployer 地址
- 适合只想获得 DID 服务的客户

### 8.4 手动部署合约

```bash
# Light 模式
wl deploy-contracts ceres \
  --rpc <url> --key <private_key>

# Full 模式
wl deploy-contracts ceres \
  --rpc <url> --key <private_key> --full

# 或手动 Forge
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url <URL> --private-key <KEY> --broadcast

forge script script/DeployV2.s.sol \
  --rpc-url <URL> --private-key <KEY> --broadcast
```

---

## 9. OxaChain 公链白标详解

OxaChain 是最复杂的白标产品——它要生成一条**完整的品牌公链**。

### 9.1 架构

```
┌─────────────────────────────────────────────────┐
│  客户服务器 (Docker)                              │
│                                                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────────┐  │
│  │   Miner   │  │ Validator │  │   Indexer     │  │
│  │ (Geth)    │  │ (Geth)    │  │ (GraphQL RPC) │  │
│  └───────────┘  └───────────┘  └───────────────┘  │
│  ┌─────────────────────────────────────────────┐  │
│  │   Explorer (Blockscout)                     │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 9.2 Geth 源码层 6 项改造

执行 `make build BRANDING_FILE=branding.json` 时自动执行：

```
branding.json
  │
  ├── [1] params/{brand}chain_config.go
  │   ├── Chain ID → branding.chain.chainId
  │   ├── Chain name → branding.brand.name
  │   └── CliqueConfig → consensus.period, consensus.epoch
  │
  ├── [2] core/{brand}chain_genesis.go
  │   ├── Native token → token.name, token.symbol
  │   ├── Initial allocation → token.initialAllocWei
  │   └── Extra data → signer keys
  │
  ├── [3] cmd/utils/{brand}chain_flags.go
  │   ├── CLI flags → deploy.binaryName
  │   └── Default ports
  │
  ├── [4] params/config.go （现有文件修改）
  │   └── 添加 brand case 到 CliqueConfig
  │
  ├── [5] cmd/utils/flags.go （现有文件修改）
  │   └── SetEthConfig 添加 brand case
  │
  ├── [6] cmd/geth/main.go （现有文件修改）
  │   └── prepare() 添加 brand case
  │
  └── [7] consensus/clique/clique.go （可选，区块奖励）
      └── 如果 consensus.blockRewardWei !== "0"，注入奖励逻辑
```

### 9.3 部署流程（8 步）

`./deploy-l1.sh` 自动执行：

```
deploy-l1.sh
  │
  ├── [1] 检查 Go + Docker 环境
  ├── [2] 生成 signer keypair
  │   └── docker run ethereum/client-go:latest account new --password /dev/null
  ├── [3] 从 branding.json 读取品牌变量
  │   └── source build/geth-patch/branding.mk
  ├── [4] 生成 genesis.json
  │   └── 含 chainId, alloc, clique extraData, period
  ├── [5] 构建 brand Geth Docker 镜像
  │   └── docker build -t acme/geth:latest .
  ├── [6] 启动 4 容器
  │   ├── docker-compose up -d miner
  │   ├── docker-compose up -d validator
  │   ├── docker-compose up -d indexer
  │   └── docker-compose up -d explorer
  ├── [7] 等待节点就绪（健康检查）
  │   └── until curl -s http://localhost:18545; do sleep 2; done
  └── [8] 输出
      ├── RPC Endpoint: http://<server-ip>:18545
      ├── Explorer: http://<server-ip>:3000
      └── Chain ID: 12345
```

### 9.4 手动构建与部署

```bash
# 1. 生成品牌配置
wl brand  # 或手动编辑 branding.json

# 2. 生成 Geth patch 并构建
make build BRANDING_FILE=branding.json
# 等价于:
#   node scripts/generate-geth-patch.js branding.json
#   cd geth && make geth

# 3. 构建 Docker 镜像
make docker

# 4. 部署 L1 链
./deploy-l1.sh

# 5. 验证
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://localhost:18545
# → {"jsonrpc":"2.0","result":"0x3039","id":1}  // chainId 12345
```

### 9.5 Docker 组合

```yaml
# docker-compose.yml（自动生成）
version: '3'
services:
  miner:
    image: acme/geth:latest
    command: --networkid 12345 --mine --miner.etherbase=0x...
    ports: ["18545:8545"]
  validator:
    image: acme/geth:latest
    command: --networkid 12345
  explorer:
    image: blockscout/blockscout:latest
    ports: ["3000:4000"]
```

---

## 10. CI/CD 集成

### 10.1 GitHub Actions 一键部署

```yaml
# .github/workflows/white-label-deploy.yml
name: White-Label Deploy

on:
  workflow_dispatch:
    inputs:
      product:
        description: 'Product to deploy'
        required: true
        type: choice
        options: [bitbyte, zenonft, cryptchat, ceres, predx, bridge, oxachain]
      server:
        description: 'SSH target (root@1.2.3.4)'
        required: true
      domain:
        description: 'Client domain'
        required: true
      rpc_url:
        description: 'RPC URL for contract deploy'
        required: false
      private_key:
        description: 'Deployer private key'
        required: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npx wl setup "${{ inputs.product }}" \
              --server "${{ inputs.server }}" \
              --domain "${{ inputs.domain }}" \
              --rpc "${{ inputs.rpc_url }}" \
              --key "${{ inputs.private_key }}"
```

### 10.2 多环境流水线

```yaml
# BitByte 示例：dev → staging → prod
deploy-dev:
  steps:
    - run: npx wl setup bitbyte --server root@dev.server --domain dev.dex.acme.com

deploy-staging:
  needs: [deploy-dev]
  steps:
    - run: npx wl deploy bitbyte --server root@staging.server --domain staging.dex.acme.com

deploy-prod:
  needs: [deploy-staging]
  steps:
    - run: npx wl deploy bitbyte --server root@prod.server --domain dex.acme.com
```

### 10.3 蓝绿部署

```bash
# 蓝色环境（当前运行）
wl deploy bitbyte --server root@blue.server --domain blue.dex.acme.com

# 切换 DNS 到蓝色
# → 验证 → 通过

# 绿色环境（准备下一版本）
wl deploy bitbyte --server root@green.server --domain green.dex.acme.com

# 切换 DNS 到绿色
# → 验证 → 通过
```

---

## 11. 多环境部署

### 11.1 多品牌配置管理

```bash
# 为不同环境准备不同的 branding.json
cp branding.json branding.prod.json
cp branding.json branding.staging.json

# 部署时指定
wl deploy --server root@prod.server --domain dex.acme.com
```

手动多品牌文件夹结构：

```
deployments/
├── acme/
│   └── branding.json      # ACME DEX 品牌
├── omega/
│   └── branding.json      # Omega Swap 品牌
└── default/
    └── branding.json      # 默认 0xAI 品牌
```

### 11.2 动态切换脚本

```bash
#!/bin/bash
# switch-brand.sh — 在已部署服务器上动态切换品牌
set -e

TARGET=${1:-root@1.2.3.4}
BRAND=${2:-acme}

scp "deployments/${BRAND}/branding.json" "${TARGET}:/var/www/bitbyte-v4/branding.json"
ssh "${TARGET}" "cd /var/www/bitbyte-v4 && npm run build && pm2 restart all"
echo "✅ 已切换品牌至 ${BRAND}"
```

---

## 12. Nginx 配置参考

### 12.1 标准前端部署

```nginx
server {
    listen 80;
    server_name dex.acme.com;

    # 前端静态文件
    root /var/www/bitbyte-v4;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 12.2 前端 + 后端

```nginx
server {
    listen 80;
    server_name chat.acme.com;

    # 前端
    root /var/www/cryptchat;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 12.3 OxaChain RPC 代理

```nginx
server {
    listen 80;
    server_name rpc.acme.io;

    location / {
        proxy_pass http://127.0.0.1:18545;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # 长连接
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # 限制请求体大小（RPC payload）
    client_max_body_size 10m;
}
```

### 12.4 SSL 自动配置（Certbot）

```bash
# 安装证书
ssh root@1.2.3.4 "certbot --nginx -d dex.acme.com --non-interactive --agree-tos -m admin@acme.com"

# 自动续期
ssh root@1.2.3.4 "certbot renew --quiet && systemctl reload nginx"

# 或添加到系统 crontab
0 3 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

### 12.5 Nginx 一键配置脚本

`wl setup` 每次部署时会检查并自动执行：

```bash
# 部署流程中包含 Nginx 配置步骤
if ssh "${server}" "test -f /etc/nginx/sites-available/${domain}"; then
    echo "  Nginx 配置已存在，跳过"
else
    ssh "${server}" "cat > /etc/nginx/sites-available/${domain} << 'NGINX'
server {
    listen 80;
    server_name ${domain};
    root /var/www/${product};
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
}
NGINX
    ln -sf /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/
    systemctl reload nginx"
fi
```

---

## 13. DNS 与 SSL 配置

### 13.1 标准 DNS 记录

```
# A 记录
dex.acme.com.    A    300    1.2.3.4

# CNAME（子域名）
www.dex.acme.com.  CNAME  300  dex.acme.com.

# 可选：CDN CNAME
cdn.dex.acme.com.  CNAME  300  customer.cdn.cloudflare.com.
```

### 13.2 子域名规划

| 用途 | 示例 | 说明 |
|------|------|------|
| 主站 | `dex.acme.com` | 前端 SPA |
| API | `api.dex.acme.com` | 后端 REST API |
| RPC | `rpc.acme.io` | OxaChain RPC 端点 |
| Explorer | `explorer.acme.io` | 区块浏览器 |
| WebSocket | `ws.dex.acme.com` | WebSocket 连接 |
| CDN | `cdn.dex.acme.com` | 静态资源 |

### 13.3 SSL 自动配置

```bash
# Let's Encrypt Certbot
wl setup ... # 自动执行：
ssh root@1.2.3.4 << 'SCRIPT'
    domain="dex.acme.com"
    email="admin@acme.com"

    # 安装证书
    certbot --nginx -d "${domain}" \
        --non-interactive --agree-tos \
        -m "${email}"

    # 强制 HTTPS 重定向
    sed -i 's/listen 80;/listen 80;\n    return 301 https:\/\/$host$request_uri;/g' \
        /etc/nginx/sites-available/"${domain}"

    systemctl reload nginx
SCRIPT
```

---

## 14. 故障排查

### 14.1 CLI 问题

| 错误 | 可能原因 | 解决方案 |
|------|---------|----------|
| `Project not detected` | 不在产品目录中 | 进入产品目录后重试，或指定 `wl deploy bitbyte` |
| `No deploy script found` | 部署脚本缺失（`deploy-contracts.sh` 或 `deploy-l1.sh`） | 确认产品仓库完整克隆（`git clone --recursive`） |
| `Authorization failed` | GitHub token 无效 | `git remote set-url origin https://token@github.com/sftgroup/xxx.git` |
| `forge: not found` | 未安装 Foundry | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| `branding.json not found` | 未生成品牌配置 | 先执行 `wl brand` |
| `--key required` | 合约部署需要私钥 | 提供 `--key 0x...` 或设置 `PRIVATE_KEY` 环境变量 |
| `rsync: not found` | 未安装 rsync | `apt install rsync`（Debian/Ubuntu）或 `yum install rsync`（CentOS） |
| `Permission denied (publickey)` | SSH 密钥未配置 | `ssh-keygen && ssh-copy-id root@1.2.3.4` |

### 14.2 前端问题

| 问题 | 可能原因 | 解决方案 |
|------|---------|----------|
| 品牌色未生效 | BrandProvider 未包裹 | 确认 `main.tsx` 中有 `<BrandProvider><App /></BrandProvider>` |
| Logo 未显示 | Logo URL 404 | 检查 `branding.json` 中 `logo.dark` 和 `logo.light` URL |
| CSS 变量未注入 | `<head>` 中无 CSS 变量 | 检查 `injectCSSVars()` 是否被调用（React 项目由 BrandProvider 自动调用） |
| Favicon 未更新 | 浏览器缓存 | `Ctrl+F5` 强制刷新 |
| Meta 标签未更新 | `<title>` 无变化 | 检查 `injectMeta()` 是否被调用 |

### 14.3 部署问题

| 问题 | 可能原因 | 解决方案 |
|------|---------|----------|
| 部署到服务器失败 | SSH 权限不足 | `ssh-copy-id root@1.2.3.4` |
| Docker 构建失败 | 内存不足 | `docker system prune -a` 清理空间 |
| Contract 部署失败 | RPC 端点不可用 | `curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' <RPC_URL>` |
| Nginx 配置失败 | 端口冲突 | `netstat -tlnp \| grep :80` 检查端口占用 |

### 14.4 OxaChain 特有

| 问题 | 可能原因 | 解决方案 |
|------|---------|----------|
| Geth 编译失败 | Go 版本 < 1.21 | `go version` 检查，升级到 1.21+ |
| Docker 容器无法启动 | 端口被占用 | `docker ps` 检查，修改 `port:` 映射 |
| 无法生成 signer | Docker 中 `geth account new` 失败 | 手动生成：`docker run ethereum/client-go:latest account new --password /dev/null` |
| 节点不同步 | 网络分区 | `docker logs miner` 查看日志 |

### 14.5 Ceres 特有

| 问题 | 可能原因 | 解决方案 |
|------|---------|----------|
| Forge 部署失败 | PRIVATE_KEY 未设置 | `export PRIVATE_KEY=0x...` 或 `--key 0x...` |
| Relayer 连接失败 | RPC URL 不可用 | 检查 `chain.rpcUrl` 配置 |

### 14.6 诊断命令

```bash
# 检查项目检测
wl list

# 检查 branding.json
cat branding.json | python3 -m json.tool

# 检查环境
which forge docker rsync ssh

# 检查 SSH 连接
ssh root@1.2.3.4 "echo OK"

# 检查 Docker
docker ps

# 检查端口
ss -tlnp | grep -E ':80|:443|:8545|:18545'
```

---

## 15. 安全注意事项

### 15.1 私钥管理

- **不要**将合约部署私钥提交到 git 仓库
- 使用环境变量 `PRIVATE_KEY` 代替命令行参数（历史记录风险）
- 建议使用硬件钱包或 AWS KMS / Google Cloud KMS 签名

```bash
# 安全：使用环境变量
export PRIVATE_KEY=0x...
wl deploy-contracts ceres --rpc https://rpc.chain.com

# 不安全：--key 参数会出现在 shell 历史中
wl deploy-contracts ceres --rpc https://rpc.chain.com --key 0x...
```

### 15.2 SSH 安全

- 使用 SSH 密钥（非密码）：`ssh-copy-id root@1.2.3.4`
- 禁用 root 密码登录：`/etc/ssh/sshd_config` 中 `PasswordAuthentication no`
- 使用非 root 用户 + sudo
- 限制 SSH 来源 IP

### 15.3 CI/CD 安全

- GitHub Actions secrets 管理私钥
- 不在 workflow YAML 中明文存储密钥
- 使用 OIDC 令牌替代长期密钥

```yaml
# ✅ 安全
- run: npx wl deploy-contracts ceres --rpc ${{ secrets.RPC_URL }} --key ${{ secrets.DEPLOYER_KEY }}
```

### 15.4 部署服务器安全

- 运行非 root Nginx worker
- 静态文件目录无写权限
- 定期更新系统包
- 使用 UFW 限制入站端口
- 设置 fail2ban 防止暴力攻击

---

## 16. 添加新的白标产品

### 16.1 前提条件

要添加一个新产品到 white-label CLI，需要：

| 需求 | 说明 |
|------|------|
| 前端项目 | 使用 React，有 `npm run build` |
| 合约（可选） | Solidity 合约，有 Foundry 或 shell 部署脚本 |
| 后端（可选） | Node.js 服务端，有 `npm run build` |
| 可选依赖 SDK | npm 包（可选） |

### 16.2 需要修改的文件

```bash
# 1. 添加 SDK 包装器
src/integrations/myproduct.ts

# 2. 更新 CLI
src/cli/index.ts
#   - detectProject() 添加检测规则
#   - 添加 deployMyProduct() 函数
#   - 注册到 DEPLOYERS
#   - 更新 COMMANDS（如果需要）

# 3. 更新 exports
package.json
#   - 添加 "./myproduct" 导出路径
#   - 如果 SDK 有 peerDependency 则添加

# 4. 更新 list 命令
#   - 添加产品描述

# 5. 更新 needsContracts() / getContractScript() / deployContracts()
```

### 16.3 SDK 包装器模板

```ts
// src/integrations/myproduct.ts
/**
 * @0xainetoem/white-label — MyProduct 集成
 *
 * 自动从 white-label 品牌配置注入到 myproduct-sdk。
 *
 * @example
 * ```ts
 * import { defineBrand } from '@0xainetoem/white-label';
 * import { createMyProduct } from '@0xainetoem/white-label/myproduct';
 *
 * defineBrand({ brand: { name: 'MyBrand', colors: { primary: '#ff6600' } } });
 * const client = createMyProduct({ apiKey: 'xxx' });
 * console.log(client.getBrand().name); // "MyBrand"
 * ```
 *
 * @requires npm install myproduct-sdk
 */

import { MyProductSDK, type MyProductConfig } from 'myproduct-sdk';
import { getBrand } from '../types.js';

export interface MyProductWithBrand {
  sdk: MyProductSDK;
  readonly name: string;
  readonly primaryColor: string;
  getBrand(): { name: string; shortName: string; primaryColor: string };
}

export function createMyProduct(config?: MyProductConfig): MyProductWithBrand {
  const brand = getBrand();
  const sdk = new MyProductSDK(config);

  return {
    sdk,
    get name() { return brand.brand.name; },
    get primaryColor() { return brand.brand.colors.primary; },
    getBrand() {
      return {
        name: brand.brand.name,
        shortName: brand.brand.shortName,
        primaryColor: brand.brand.colors.primary,
      };
    },
  };
}

export { MyProductSDK };
export type { MyProductConfig };
```

### 16.4 CLI deploy 函数模板

```ts
// 在 src/cli/index.ts 中添加

const DEPLOYERS: Record<string, (server: string, domain: string) => void> = {
  // ... 现有产品
  myproduct: deployMyProduct,
};

function deployMyProduct(server: string, _domain: string) {
  console.log('[1/2] 构建 MyProduct 前端...');
  execSync('cd frontend && npm install && npm run build', { stdio: 'inherit' });
  console.log(`[2/2] 上传到 ${server}...`);
  execSync(`rsync -avz --exclude node_modules frontend/dist/ ${server}:/var/www/myproduct/`, { stdio: 'inherit' });
  console.log(`\n✅ MyProduct 构建完成，部署至 ${server}`);
}

// 在 detectProject() 中添加
function detectProject(): string | null {
  // ... 现有检测
  if (fs.existsSync('myproduct.config.json') || fs.existsSync('frontend/src/MyProduct.tsx')) return 'myproduct';
  return null;
}
```

### 16.5 Exports 注册

```json
{
  "exports": {
    "./myproduct": {
      "import": "./dist/integrations/myproduct.js",
      "types": "./dist/integrations/myproduct.d.ts"
    }
  }
}
```

---

## 17. 发布到 npm

### 17.1 发布流程

```bash
# 1. 构建
npm run build

# 2. 版本号更新（按 semver）
npm version patch  # 修复 bug
npm version minor  # 新增功能（向后兼容）
npm version major  # 不兼容变更

# 3. 发布
npm publish

# 4. 打 git tag
git push --tags
```

### 17.2 版本号策略

| 版本 | 说明 |
|:----:|------|
| `1.0.0` | 初始版本 |
| `1.1.0` | 新增产品 SDK 包装器 |
| `1.2.0` | 新增 CLI 命令 |
| `1.1.1` | Bug 修复 |

### 17.3 发布前检查清单

- [ ] `npm run build` 编译通过无错误
- [ ] `npx wl list` 正确列出所有产品
- [ ] 所有 `exports` 路径在 `package.json` 中注册
- [ ] TypeScript 类型定义（`.d.ts`）已生成
- [ ] `publishConfig.access = "public"`（scoped 包必需）
- [ ] 已登录 npm：`npm whoami`
- [ ] 代码已提交并推送到 GitHub
- [ ] `README.md` 版本号已更新
