#!/usr/bin/env node
// Small startup script to run programmatic migrations then start the server.
// This file is ESM to match package.json "type": "module"
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function runCommand(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...options });
  if (res.status !== 0) {
    console.error(`Command failed: ${cmd} ${args.join(' ')}`);
    process.exit(res.status || 1);
  }
}

async function main() {
  try {
    console.log('🔄 Running programmatic DB migrations (schema-setup)...');

    // Prefer running compiled JS if available
    const schemaSetupPathJS = join(__dirname, 'schema-setup.js');
    const schemaSetupPathTS = join(__dirname, 'schema-setup.ts');

    if (existsSync(schemaSetupPathJS)) {
      // Run with node
      runCommand('node', [schemaSetupPathJS]);
    } else if (existsSync(schemaSetupPathTS)) {
      // If TS source exists in production, attempt to run with tsx (if installed)
      runCommand('npx', ['tsx', schemaSetupPathTS]);
    } else {
      console.log('⚠️ schema-setup not found, skipping programmatic migrations.');
    }

    console.log('✅ Migrations complete. Starting app server...');

    // Finally start the server
    // If dist/index.js exists (built app), start it. Otherwise try src/index.ts via tsx.
    const distIndex = join(__dirname, '..', 'dist', 'index.js');
    if (existsSync(distIndex)) {
      runCommand('node', [distIndex]);
    } else {
      // fallback to tsx start
      runCommand('npx', ['tsx', join(__dirname, '..', 'server', 'index.ts')]);
    }

  } catch (err) {
    console.error('Startup script failed:', err);
    process.exit(1);
  }
}

main();
