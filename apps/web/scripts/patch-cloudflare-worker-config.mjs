import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const file = join(dir, entry);
    return statSync(file).isDirectory() ? walk(file) : (/^wrangler\.jsonc?$/.test(entry) ? [file] : []);
  });
}
const files = new Set([join(root, 'wrangler.json'), ...walk(join(root, '.open-next'))]);
let patched = 0;
for (const file of files) {
  if (!existsSync(file)) continue;
  const before = readFileSync(file, 'utf8');
  const after = before.replace(/\n\s*"services"\s*:\s*\[\s*\{\s*"binding"\s*:\s*"WORKER_SELF_REFERENCE"\s*,\s*"service"\s*:\s*"[^"]+"\s*\}\s*\]\s*,?/g, '');
  if (after !== before) { writeFileSync(file, after); patched += 1; }
}
console.log(`Patched Cloudflare Worker config files: ${patched}`);
