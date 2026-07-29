# @0xainetoem/white-label

白标品牌注入 SDK — 8 个 C 层项目共享的品牌管理工具。

```bash
npm install @0xainetoem/white-label
```

---

## 快速开始（3 行代码）

```tsx
// 1. 入口文件
import { defineBrand, BrandProvider } from '@0xainetoem/white-label/react';

const brand = defineBrand(); // 自动读取 /src/branding.json
createRoot(document.getElementById('root')!).render(
  <BrandProvider brand={brand}><App /></BrandProvider>
);

// 2. 组件内使用
import { useBrand, BrandLogo } from '@0xainetoem/white-label/react';

function Header() {
  const { brand } = useBrand();
  return (
    <header style={{ backgroundColor: brand.colors.primary }}>
      <BrandLogo variant="dark" />
      <h1>{brand.name}</h1>
    </header>
  );
}
```

---

## API 参考

### `defineBrand(config?)`

读取品牌配置，优先级：传入参数 > branding.json > 默认值。

```ts
import { defineBrand } from '@0xainetoem/white-label';

// 仅读取 branding.json
const brand = defineBrand();

// 覆盖部分字段
const brand = defineBrand({ brand: { name: 'ACME' } });
```

### `BrandProvider`

React Context Provider，挂载后自动执行 3 个副作用：

| 副作用 | 说明 |
|--------|------|
| CSS 变量注入 | `--brand-primary` `--brand-secondary` `--brand-accent` 注入 `:root` |
| Favicon 替换 | 自动设置 `<link rel="icon">` |
| Meta 标签替换 | `<title>` + OG + Twitter 标签 |

```tsx
import { BrandProvider } from '@0xainetoem/white-label/react';

<BrandProvider brand={brand}>
  <App />
</BrandProvider>
```

### `useBrand()`

在任意组件中读取品牌配置。

```tsx
import { useBrand } from '@0xainetoem/white-label/react';

function Footer() {
  const { brand } = useBrand();
  return <p>© {brand.name} — {brand.contactEmail}</p>;
}
```

### `BrandLogo`

自动渲染品牌 Logo 的 `<img>` 组件。

```tsx
import { BrandLogo } from '@0xainetoem/white-label/react';

// 深色背景用 light 变体
<BrandLogo variant="light" className="h-8" />

// 浅色背景用 dark（默认）
<BrandLogo variant="dark" />
```

### `getBrand()`

非 React 环境读取全局品牌配置。

```ts
import { getBrand } from '@0xainetoem/white-label';
const brand = getBrand();
```

### 工具函数

```ts
import { injectCSSVars, injectFavicon, injectMeta } from '@0xainetoem/white-label';

// 手动注入（通常 BrandProvider 会自动执行）
injectCSSVars(brand);   // CSS 变量
injectFavicon(brand);   // favicon
injectMeta(brand);      // <title> + OG
```

---

## branding.json 格式

```json
{
  "brand": {
    "name": "客户品牌名",
    "shortName": "客户简称",
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

---

## CLI 命令

```bash
# 安装
npm install @0xainetoem/white-label

# 生成品牌配置（交互式）
npx wl brand

# 查看可部署的产品
npx wl list

# 一键部署前端
npx wl deploy bitbyte --server root@1.2.3.4 --domain dex.客户.com

# 部署合约到目标链（需要合约的白标项目：zenonft 等）
npx wl deploy-contracts zenonft --rpc <url> --key <private_key> --verify

# 更新部署
npx wl update bitbyte --server root@1.2.3.4
```

---

## CSS 变量对照表

BrandProvider 自动注入以下 CSS 变量到 `:root`：

| CSS 变量 | branding.json 字段 | 默认值 |
|----------|-------------------|--------|
| `--brand-primary` | `brand.colors.primary` | `#3b82f6` |
| `--brand-primary-hover` | `brand.colors.primaryHover` | `#2563eb` |
| `--brand-secondary` | `brand.colors.secondary` | `#1e293b` |
| `--brand-accent` | `brand.colors.accent` | `#06b6d4` |

**Tailwind 项目使用方法**：

```css
/* tailwind.config.js 或全局 CSS */
@layer base {
  :root {
    --brand-primary: #3b82f6; /* 会被 BrandProvider 覆盖 */
  }
}
```

```jsx
// 组件中
<div className="bg-[var(--brand-primary)] text-white">Branded</div>
```

---

## 如何在项目中接入（5 步）

以 BitByte v4 为例（已使用自建 BrandContext 系统，无需此步骤）：

> **注意**：BitByte v4 使用自建品牌系统（`frontend-max-react/src/brand/`），不依赖 `@0xainetoem/white-label`。以下步骤适用于新项目或需要迁移到统一白标框架的项目。

1. **安装**
   ```bash
   cd bitbyte-v4 && npm install @0xainetoem/white-label
   ```

2. **创建 `src/branding.json`**（使用默认值或 `npx wl brand` 生成）

3. **修改入口文件** `src/main.tsx`
   ```tsx
   import { defineBrand, BrandProvider } from '@0xainetoem/white-label/react';
   
   const brand = defineBrand();
   createRoot(...).render(
     <BrandProvider brand={brand}><App /></BrandProvider>
   );
   ```

4. **替换硬编码**
   - Logo → `<BrandLogo />`
   - 页面标题 → 删除手动 `document.title = ...`
   - 品牌名 → `useBrand().brand.name`
   - 颜色 → 用 `var(--brand-primary)` 替代硬编码色值

5. **重启容器** → 品牌生效

---

## TypeScript 类型

```ts
import type { BrandConfig } from '@0xainetoem/white-label';
```

完整类型定义见 `node_modules/@0xainetoem/white-label/dist/types.d.ts`

---

## NPM 包信息

| 字段 | 值 |
|------|-----|
| 包名 | `@0xainetoem/white-label` |
| 最新版本 | `0.1.4` |
| 协议 | MIT |
| 仓库 | `https://github.com/sftgroup/0xai-website` (packages/white-label) |
