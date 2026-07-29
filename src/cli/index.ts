#!/usr/bin/env node
// @0xai/white-label/cli — 白标部署命令行工具

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ====== 项目检测 ======

function detectProject(): string | null {
  if (fs.existsSync('genesis.json') && fs.existsSync('geth/Dockerfile')) return 'oxachain';
  if (fs.existsSync('frontend-max-react/src/branding.json') && fs.existsSync('deploy-contracts.sh')) return 'bitbyte';
  if (fs.existsSync('contracts/script/DeployPredX.s.sol')) return 'predx';
  if (fs.existsSync('client/src') && fs.existsSync('server/src')) return 'cryptchat';
  if (fs.existsSync('frontend/src') && fs.existsSync('contracts/script')) return 'zenonft';
  if (fs.existsSync('frontend-wagmi') && fs.existsSync('contracts')) return 'predx';
  if (fs.existsSync('frontend-bridge/package.json') && fs.existsSync('foundry.toml')) return 'bridge';
  if (fs.existsSync('frontend-v2/frontend/src/branding.json') && fs.existsSync('sdk/src/index.ts')) return 'ceres';
  return null;
}

function needsContracts(project: string): boolean {
  return project !== 'cryptchat';
}

function getContractScript(project: string): string | null {
  if (project === 'oxachain' && fs.existsSync('deploy-l1.sh')) return 'deploy-l1.sh';
  if (fs.existsSync('deploy-contracts.sh')) return 'deploy-contracts.sh';
  if (project === 'ceres') return 'forge';
  return null;
}

// ====== 项目 deploy 步骤 ======

function deployOxaChain(server: string, _domain: string) {
  console.log('[1/4] 编译 Geth 节点...');
  execSync('make geth', { stdio: 'inherit' });
  console.log('[2/4] 构建 Docker 镜像...');
  execSync('make docker', { stdio: 'inherit' });
  console.log('[3/4] 一键部署 L1 链...');
  execSync('./deploy-l1.sh --no-cleanup', { stdio: 'inherit' });
  console.log('[4/4] 验证节点状态...');
  execSync("docker ps --filter 'name=oxachain' --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null || docker ps --filter 'name=miner' --format 'table {{.Names}}\t{{.Status}}'", { stdio: 'inherit' });
}

function deployBitByte(server: string, domain: string) {
  console.log('[1/5] 构建前端 (Max-React)...');
  execSync('cd frontend-max-react && npm run build', { stdio: 'inherit' });
  console.log('[2/5] 构建前端 (Flash)...');
  execSync('cd frontend-flash && npm run build', { stdio: 'inherit' });
  console.log('[3/5] 构建前端 (Admin)...');
  execSync('cd frontend-admin && npm run build', { stdio: 'inherit' });
  console.log('[4/5] 构建前端 (Landing)...');
  execSync('cd frontend-landing && npm run build', { stdio: 'inherit' });
  console.log(`[5/5] 上传到 ${server}...`);
  execSync(`rsync -avz --exclude node_modules ./dist/ ${server}:/var/www/bitbyte-v4/`, { stdio: 'inherit' });
  console.log(`\n✅ BitByte 构建完成，部署至 ${server}`);
  if (fs.existsSync('deploy/nginx')) {
    console.log('   Nginx 配置文件位于 deploy/nginx/，请手动配置或参考 docs/WHITE_LABEL.md');
  }
}

function deployPredX(server: string, _domain: string) {
  console.log('[1/2] 构建前端 (wagmi)...');
  execSync('cd frontend-wagmi && npm run build', { stdio: 'inherit' });
  console.log(`[2/2] 上传到 ${server}...`);
  execSync(`rsync -avz --exclude node_modules frontend-wagmi/dist/ ${server}:/var/www/predx/`, { stdio: 'inherit' });
  console.log(`\n✅ PredX 构建完成，部署至 ${server}`);
  console.log('   后端启动: cd backend && node src/index.js');
  console.log('   MCP 启动: predx-mcp (或 npx @0xpredx/mcp)');
}

function deployCryptChat(server: string, _domain: string) {
  console.log('[1/3] 构建客户端...');
  execSync('cd client && npm run build', { stdio: 'inherit' });
  console.log('[2/3] 构建服务端...');
  execSync('cd server && npm run build', { stdio: 'inherit' });
  console.log(`[3/3] 上传到 ${server}...`);
  execSync(`rsync -avz --exclude node_modules client/dist/ ${server}:/var/www/cryptchat/`, { stdio: 'inherit' });
  execSync(`rsync -avz --exclude node_modules server/dist/ ${server}:/opt/cryptchat/server/`, { stdio: 'inherit' });
  console.log(`\n✅ CryptChat 构建完成，部署至 ${server}`);
  console.log('   前端: /var/www/cryptchat/ (Nginx)');
  console.log('   后端: /opt/cryptchat/server/ (pm2 restart cryptchat)');
}

function deployBridge(server: string, _domain: string) {
  console.log('[1/2] 构建前端 (Bridge)...');
  execSync('cd frontend-bridge && npm install && npm run build', { stdio: 'inherit' });
  console.log(`[2/2] 上传到 ${server}...`);
  execSync(`rsync -avz --exclude node_modules frontend-bridge/dist/ ${server}:/var/www/bridge/`, { stdio: 'inherit' });
  console.log(`\n✅ 0xBridge 构建完成，部署至 ${server}`);
  console.log('   Nginx 配置: proxy 到 /var/www/bridge/');
}

function deployZenoNFT(server: string, _domain: string) {
  console.log('[1/2] 构建前端...');
  execSync('cd frontend && npm install && npm run build', { stdio: 'inherit' });
  console.log(`[2/2] 上传到 ${server}...`);
  execSync(`rsync -avz --exclude node_modules frontend/dist/ ${server}:/var/www/zenonft/`, { stdio: 'inherit' });
  console.log(`\n✅ ZenoNFT 构建完成，部署至 ${server}`);
  console.log('   Nginx 配置: proxy 到 /var/www/zenonft/');
}

function deployCeres(server: string, _domain: string) {
  // 检测模式：light（仅 DID 合约）或 full（完整白标）
  let mode = 'full';
  try {
    if (fs.existsSync('branding.json')) {
      const branding = JSON.parse(fs.readFileSync('branding.json', 'utf8'));
      mode = branding.mode || 'full';
    }
  } catch {}

  if (mode === 'light') {
    console.log('📋 Ceres 轻量模式（仅部署合约，复用品牌）');
    console.log('   执行: wl deploy-contracts ceres --rpc <url> --key <pk>');
    console.log('   或: wl deploy-contracts ceres --rpc <url> --key <pk> --full');
    console.log('   (合约部署后，DID NFT 归客户所有，前端仍用 Ceres 品牌)');
    return;
  }

  console.log('[1/3] 构建 Ceres 前端...');
  execSync('cd frontend-v2/frontend && npm install && npm run build', { stdio: 'inherit' });
  console.log('[2/3] 编译 Relayer（可选）...');
  if (fs.existsSync('frontend-v2/relayer/src')) {
    execSync('cd frontend-v2/relayer && npm install && npm run build 2>/dev/null || echo "  跳过 relayer 编译（无 build 脚本）"', { stdio: 'inherit' });
  }
  console.log(`[3/3] 上传到 ${server}...`);
  execSync(`rsync -avz --exclude node_modules frontend-v2/frontend/dist/ ${server}:/var/www/ceres/`, { stdio: 'inherit' });
  if (fs.existsSync('frontend-v2/relayer/dist')) {
    execSync(`rsync -avz --exclude node_modules frontend-v2/relayer/ ${server}:/opt/ceres/relayer/`, { stdio: 'inherit' });
  }
  console.log(`\n✅ Ceres 构建完成，部署至 ${server}`);
  console.log('   前端: /var/www/ceres/ (Nginx)');
  console.log('   SDK: npm install @ceresv2/sdk (已发布 v0.4.1, 直接使用 npm 包)');
  if (fs.existsSync('frontend-v2/relayer/dist')) {
    console.log('   Relayer: /opt/ceres/relayer/ (pm2 restart ceres-relayer)');
  }
}

const DEPLOYERS: Record<string, (server: string, domain: string) => void> = {
  oxachain: deployOxaChain,
  bitbyte: deployBitByte,
  predx: deployPredX,
  cryptchat: deployCryptChat,
  zenonft: deployZenoNFT,
  bridge: deployBridge,
  ceres: deployCeres,
};

// ====== Commands ======

const COMMANDS: Record<string, (args: string[]) => void> = {
  brand,
  setup,
  deploy,
  'deploy-contracts': deployContracts,
  update,
  list,
};

function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (!cmd || !COMMANDS[cmd]) {
    const project = detectProject();
    console.log('White-Label CLI — 0xAI\n');
    console.log('Commands:');
    console.log('  wl setup [project] --name --color --server --domain --chain --rpc --key  一键全流程');
    console.log('  wl brand              生成 branding.json（交互式）');
    console.log('  wl deploy [project] --server <host> --domain <domain>  构建+部署');
    console.log('  wl deploy-contracts [project]  部署项目合约到目标链');
    console.log('  wl update [project] --server <host>  更新部署');
    console.log('  wl list               列出可部署的产品');
    if (project) {
      console.log(`\n  检测到当前项目: ${project}`);
      console.log(`  直接运行: wl deploy-contracts ${project}`);
    }
    process.exit(0);
  }
  COMMANDS[cmd](args);
}

// ====== wl brand ======
function brand() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => readline.question(q, resolve));

  (async () => {
    console.log('=== 白标品牌配置生成 ===\n');
    const project = detectProject();
    if (project) console.log(`检测到项目: ${project}\n`);

    const name = await ask('客户名称 (e.g. ACME): ');
    const shortName = await ask('简称: ');
    const primary = await ask('主色 (e.g. #ff6600): ');
    const logoDark = await ask('Logo Dark URL: ');
    const logoFavicon = await ask('Favicon URL: ');
    const domain = await ask('域名 (e.g. acme-dex.com): ');
    const email = await ask('联系邮箱: ');
    readline.close();

    const branding: any = {
      brand: {
        name: name || 'ACME',
        shortName: shortName || 'ACME',
        logo: { dark: logoDark || '', light: logoDark || '', favicon: logoFavicon || '' },
        colors: { primary: primary || '#3b82f6', primaryHover: primary || '#2563eb', secondary: '#1e293b', accent: '#06b6d4' },
        domain: domain || 'example.com',
        contactEmail: email || 'contact@example.com',
        social: { twitter: '', discord: '', telegram: '' },
      },
      chain: { network: 'mainnet', rpcUrl: '', chainId: 8888, explorerUrl: '', nativeToken: '' },
    };

    // 项目特定字段
    if (project === 'oxachain') {
      branding.consensus = { type: 'clique', period: 30, epoch: 30000, blockRewardWei: '0', signerCount: 7 };
      branding.token = { name: 'Test Token', symbol: 'TT', decimals: 18, initialAllocWei: '100000000000000000000000' };
      branding.deploy = { imageName: 'oxachain/geth', imageTag: 'latest', containerPrefix: 'oxachain', networkName: 'oxachain', dockerPassword: 'oxachain', binaryName: 'oxachain-geth', buildTarget: 'oxachain' };
    } else if (project === 'bitbyte' || project === 'predx') {
      branding.deployer = { privateKey: '' };
    }

    fs.writeFileSync('branding.json', JSON.stringify(branding, null, 2));
    console.log('\n✅ branding.json 已生成');
  })();
}

// ====== wl setup ======
function setup(args: string[]) {
  const project = args[0] || detectProject();

  if (!project) {
    console.error('Usage: wl setup <project> \\');
    console.error('  --name "品牌名" --color "#ff6600" \\');
    console.error('  --server root@1.2.3.4 --domain acme-dex.com \\');
    console.error('  --chain polygon --rpc https://polygon-rpc.com --chain-id 137 \\');
    console.error('  --key 0x_deployer_private_key \\');
    console.error('  [--short-name ACME] [--logo-dark url] [--logo-favicon url] [--email support@acme.com]');
    process.exit(1);
  }

  // 解析参数
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : '';
  };

  const name = getArg('--name') || 'ACME';
  const shortName = getArg('--short-name') || name.slice(0, 4).toUpperCase();
  const color = getArg('--color') || '#3b82f6';
  const logoDark = getArg('--logo-dark') || '';
  const logoFavicon = getArg('--logo-favicon') || logoDark;
  const server = getArg('--server');
  const domain = getArg('--domain') || 'acme.example.com';
  const email = getArg('--email') || `support@${domain}`;
  const chain = getArg('--chain') || 'oxachain';
  const rpc = getArg('--rpc') || 'https://rpc-oxa.0xainet.top';
  const chainId = parseInt(getArg('--chain-id') || '19505', 10);
  const key = getArg('--key') || '';
  const ceresMode = getArg('--mode') || 'full';  // ceres: full | light

  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  白标一键部署: ${project.padEnd(26)} ║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  品牌: ${name.padEnd(30)} ║`);
  console.log(`║  主色: ${color.padEnd(30)} ║`);
  console.log(`║  服务器: ${server.padEnd(28)} ║`);
  console.log(`║  域名: ${domain.padEnd(30)} ║`);
  console.log(`║  链: ${chain} (ID: ${chainId})`.padEnd(42) + `║`);
  if (project === 'ceres') {
    console.log(`║  模式: ${ceresMode === 'light' ? '仅 DID 合约'.padEnd(28) : '完整白标'.padEnd(28)} ║`);
  }
  console.log(`╚══════════════════════════════════════════╝\n`);

  // Step 1: 生成 branding.json
  console.log('[1/4] 生成品牌配置...');
  const branding: any = {
    brand: {
      name, shortName,
      logo: { dark: logoDark, light: logoDark, favicon: logoFavicon },
      colors: { primary: color, primaryHover: color, secondary: '#1e293b', accent: '#06b6d4' },
      domain, contactEmail: email,
      social: { twitter: '', discord: '', telegram: '' },
    },
    chain: { network: chain, rpcUrl: rpc, chainId, explorerUrl: '', nativeToken: '' },
    deployer: { privateKey: key },
  };

  // 项目特定字段
  if (project === 'oxachain') {
    branding.consensus = { type: 'clique', period: 30, epoch: 30000, blockRewardWei: '0', signerCount: 7 };
    branding.token = { name: name + ' Token', symbol: shortName, decimals: 18, initialAllocWei: '100000000000000000000000' };
    branding.deploy = { imageName: shortName.toLowerCase() + '/geth', imageTag: 'latest', containerPrefix: shortName.toLowerCase(), networkName: shortName.toLowerCase(), dockerPassword: shortName.toLowerCase(), binaryName: shortName.toLowerCase() + '-geth', buildTarget: shortName.toLowerCase() };
  }

  if (project === 'ceres') {
    branding.mode = ceresMode;  // 'full' | 'light'
    if (ceresMode === 'full') {
      branding.contracts = { deployAll: true };
    } else {
      branding.contracts = { deployAll: false, only: ['CeresDID', 'CeresRegistry'] };
    }
  }

  if (project === 'bridge') {
    branding.features = { enabledChains: ['SEPOLIA', 'L1', 'BSC_TESTNET'] };
  }

  const brandPath = project === 'bridge' ? 'frontend-bridge/src/branding.json'
    : project === 'zenonft' ? 'frontend/src/branding.json'
    : 'branding.json';
  fs.writeFileSync(brandPath, JSON.stringify(branding, null, 2));
  console.log('   已生成 branding.json');

  // Step 2: 部署合约
  if (needsContracts(project) && key) {
    console.log('[2/4] 部署合约...');
    try {
      const deployArgs = [project, '--rpc', rpc, '--key', key, '--verify'];
      deployContracts(deployArgs);
    } catch (err) {
      console.error('   合约部署失败，请检查链配置和私钥');
      console.error('   可稍后手动执行: wl deploy-contracts ' + project);
    }
  } else if (needsContracts(project) && !key) {
    console.log('[2/4] 跳过合约部署（未提供 --key）');
    console.log('   稍后手动执行: wl deploy-contracts ' + project);
  } else {
    console.log('[2/4] 无需合约部署');
  }

  // Step 3: 构建 + 部署
  if (server) {
    console.log(`[3/4] 构建 + 部署到 ${server}...`);
    const deployArgs = [project, '--server', server, '--domain', domain];
    deploy(deployArgs);
  } else {
    console.log('[3/4] 跳过部署（未提供 --server）');
    console.log('   稍后手动执行: wl deploy ' + project + ' --server <host> --domain <domain>');
  }

  console.log('\n✅ 白标配置完成！');
  console.log(`   品牌配置: branding.json`);
  console.log(`   项目目录: ${process.cwd()}`);
  if (server) console.log(`   部署地址: https://${domain}`);
}

// ====== wl deploy ======
function deploy(args: string[]) {
  const product = args[0] || detectProject();

  if (!product) {
    console.error('Usage: wl deploy [project] --server <host> --domain <domain>');
    console.error('  或进入项目目录后直接运行: wl deploy --server <host> --domain <domain>');
    process.exit(1);
  }

  const serverIdx = args.indexOf('--server');
  const domainIdx = args.indexOf('--domain');
  const server = serverIdx >= 0 ? args[serverIdx + 1] : '';
  const domain = domainIdx >= 0 ? args[domainIdx + 1] : '';

  console.log(`\n🚀 部署 ${product} → ${server} (${domain})\n`);

  const deployer = DEPLOYERS[product];
  if (deployer) {
    deployer(server, domain);
  } else {
    // 通用 Docker 流程（fallback）
    console.log('[1/5] 构建 Docker 镜像...');
    execSync('docker compose build --no-cache', { stdio: 'inherit' });
    console.log('[2/5] 上传到服务器...');
    execSync(`rsync -avz --exclude node_modules . ${server}:/opt/${product}/`, { stdio: 'inherit' });
    console.log('[3/5] 启动服务...');
    execSync(`ssh ${server} "cd /opt/${product} && docker compose up -d"`, { stdio: 'inherit' });
    console.log('[4/5] 配置 Nginx + SSL...');
    const nginxConf = `server {\n  listen 80;\n  server_name ${domain};\n  location / {\n    proxy_pass http://127.0.0.1:3000;\n    proxy_http_version 1.1;\n    proxy_set_header Host $host;\n  }\n}`;
    execSync(`ssh ${server} "echo '${nginxConf.replace(/'/g, "'\\''")}' > /etc/nginx/sites-available/${domain} && ln -sf /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/ && systemctl reload nginx"`, { stdio: 'inherit' });
    console.log('[5/5] 健康检查...');
    try { execSync(`curl -sI https://${domain}`, { stdio: 'inherit' }); } catch {}
  }

  console.log(`\n✅ 部署完成！`);
}

// ====== wl update ======
function update(args: string[]) {
  const product = args[0] || detectProject();
  const serverIdx = args.indexOf('--server');
  const server = serverIdx >= 0 ? args[serverIdx + 1] : '';

  if (!product || !server) {
    console.error('Usage: wl update [project] --server <host>');
    process.exit(1);
  }

  console.log(`\n🔄 更新 ${product} 部署 → ${server}...`);

  // 重新部署合约（如果有合约变更）
  if (needsContracts(product)) {
    try {
      console.log('  重新部署合约...');
      deployContracts([product]);
    } catch {}
  }

  // 重新构建 + 上传（复用 deploy 逻辑）
  deploy(args);

  console.log('✅ 更新完成');
}

// ====== wl deploy-contracts ======
function deployContracts(args: string[]) {
  let project = args[0] || detectProject();

  if (!project) {
    console.error('Usage: wl deploy-contracts [project] [--rpc <url>] [--key <pk>] [--verify]');
    process.exit(1);
  }

  // cryptchat 无需合约部署
  if (!needsContracts(project)) {
    console.log(`✅ ${project} 无需合约部署（使用共享基础设施合约）`);
    return;
  }

  console.log(`\n🔗 部署 ${project} 合约...\n`);

  // 检查 branding.json
  if (!fs.existsSync('branding.json')) {
    // oxachain 可能在内层目录
    if (project === 'oxachain' && !fs.existsSync('branding.json')) {
      console.log('⚠️  brand.json 不存在，使用默认链配置\n');
    } else if (project !== 'oxachain') {
      console.error('❌ 未找到 branding.json，请先执行 wl brand 生成品牌配置');
      process.exit(1);
    }
  }

  // 找到正确的脚本
  const script = getContractScript(project);
  if (!script) {
    console.error(`❌ ${project} 项目缺少部署脚本`);
    console.error('   需要: deploy-contracts.sh 或 deploy-l1.sh');
    process.exit(1);
  }

  try {
    if (project === 'ceres') {
      // Ceres: 使用 Foundry Forge 部署
      const mode = args.find(a => a === '--full') ? 'full' : 'light';
      const rpcIdx = args.indexOf('--rpc');
      const keyIdx = args.indexOf('--key');
      const rpcUrl = rpcIdx >= 0 ? args[rpcIdx + 1] : 'http://127.0.0.1:8545';
      const privateKey = keyIdx >= 0 ? args[keyIdx + 1] : process.env.PRIVATE_KEY || '';
      if (!privateKey) {
        console.error('❌ 需要 --key <private_key> 参数或 PRIVATE_KEY 环境变量');
        process.exit(1);
      }

      console.log(`   模式: ${mode === 'full' ? '全新部署（全部合约）' : '仅部署 DID + Registry'}`);
      console.log(`   RPC: ${rpcUrl}\n`);

      if (mode === 'full') {
        // 完整部署：DID + Registry + InviteCore + FeeContract + GoldVault
        const relayer = args.find(a => a.startsWith('--relayer='))?.split('=')[1] || process.env.RELAYER_ADDRESS || '';
        if (!relayer) {
          console.log('⚠️  未指定 relayer 地址（--relayer=0x...），使用 deployer 地址');
        }
        execSync(`cd contracts && PRIVATE_KEY=${privateKey} RELAYER_ADDRESS=${relayer || privateKey} forge script script/DeployV2.s.sol --rpc-url ${rpcUrl} --private-key ${privateKey} --broadcast 2>&1`, { stdio: 'inherit' });
      } else {
        // 轻量部署：仅 CeresDID + CeresRegistry
        execSync(`cd contracts && PRIVATE_KEY=${privateKey} forge script script/Deploy.s.sol --rpc-url ${rpcUrl} --private-key ${privateKey} --broadcast 2>&1`, { stdio: 'inherit' });
      }
    } else {
      const extraArgs = args.filter(a => !DEPLOYERS[a] || a === project).join(' ').replace(project, '').trim();
      execSync(`bash ${script} ${extraArgs}`, { stdio: 'inherit' });
    }
    console.log(`\n✅ ${project} 合约部署完成`);
  } catch (err) {
    console.error(`❌ ${project} 合约部署失败，请检查日志`);
    process.exit(1);
  }
}

// ====== wl list ======
function list() {
  const current = detectProject();
  console.log('可白标部署的产品:\n');
  console.log('  bitbyte      — DEX (Flash + Max 双版本)');
  console.log('  zenonft      — NFT 市场');
  console.log('  cryptchat    — 加密社交');
  console.log('  ceres        — DID / 社交图谱');
  console.log('  predx        — 预测市场');
  console.log('  bridge       — 跨链桥');
  console.log('  pocketx      — Agent OS / 超级钱包');
  console.log('  oxachain     — AI-Native 公链');

  if (current) {
    console.log(`\n✓ 当前项目: ${current}`);
    tryCheckBranding(current);
  }
}

function tryCheckBranding(project: string) {
  const candidates = [
    'frontend-max-react/src/branding.json',
    'frontend-wagmi/src/branding.json',
    'frontend-bridge/src/branding.json',
    'branding.json',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const branding = JSON.parse(fs.readFileSync(c, 'utf8'));
        console.log(`  品牌: ${branding.brand?.name || 'N/A'}`);
        if (branding.chain) {
          console.log(`  链: ${branding.chain.network || 'N/A'} (Chain ID: ${branding.chain.chainId || 'N/A'})`);
        }
        if (branding.consensus) {
          console.log(`  出块时间: ${branding.consensus.period}s`);
          console.log(`  Signers: ${branding.consensus.signerCount}`);
          console.log(`  区块奖励: ${branding.consensus.blockRewardWei === '0' ? '关闭' : branding.consensus.blockRewardWei + ' wei'}`);
        }
      } catch {}
      return;
    }
  }
}

main();
