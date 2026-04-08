#!/usr/bin/env bun

import {
    chmodSync,
    writeFileSync
} from 'fs';
import { join } from 'path';

const dist = join(import.meta.dir, '..', 'dist');

// Unix launcher (bash) — buffers stdin before passing to node/bun
// Copilot CLI closes stdin very quickly. Bash's cat buffers it instantly.
// Auto-detects runtime: prefers bun if available, falls back to node.
const sh = `#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
JS="$SCRIPT_DIR/copilot-statusline.js"
if command -v bun >/dev/null 2>&1; then
  RT=bun
else
  RT=node
fi
if [ -t 0 ]; then
  exec "$RT" "$JS" "$@"
else
  INPUT=$(cat)
  echo "$INPUT" | exec "$RT" "$JS" "$@"
fi
`;
writeFileSync(join(dist, 'launcher.sh'), sh);
chmodSync(join(dist, 'launcher.sh'), 0o755);

// Windows launcher (cmd)
// On Windows, cmd.exe reads stdin synchronously so no buffering wrapper needed.
// Auto-detects runtime: prefers bun if available, falls back to node.
const cmd = `@echo off\r
set "SCRIPT_DIR=%~dp0"\r
where bun >nul 2>&1 && (\r
  bun "%SCRIPT_DIR%copilot-statusline.js" %*\r
  exit /b %errorlevel%\r
)\r
node "%SCRIPT_DIR%copilot-statusline.js" %*\r
`;
writeFileSync(join(dist, 'launcher.cmd'), cmd);

console.log('✓ Generated launcher.sh and launcher.cmd');