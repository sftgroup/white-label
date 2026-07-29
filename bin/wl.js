#!/usr/bin/env node

// @0xainetoem/white-label CLI

import('../dist/cli/index.js').catch((err) => {
  console.error('CLI error:', err.message);
  process.exit(1);
});
