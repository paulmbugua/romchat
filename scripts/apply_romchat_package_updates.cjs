const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root) {
  throw new Error('Usage: node apply_romchat_package_updates.cjs <repo-root>');
}

function updateJson(relativePath, mutate) {
  const file = path.join(root, relativePath);
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  mutate(json);
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}

updateJson('package.json', (json) => {
  json.name = 'romchat';
  json.scripts.start = 'yarn workspace @romchat/backend start';
  json.scripts['start:backend'] = 'yarn workspace @romchat/backend start';
  json.scripts['start:web'] = 'yarn workspace @romchat/web start';
  json.scripts['dev:admin'] = 'yarn workspace @romchat/admin dev';
  json.scripts['build:admin'] = 'yarn workspace @romchat/admin build';
  json.scripts.build = 'turbo run build --filter=@romchat/backend... --filter=@romchat/web... --filter=@romchat/admin...';
  json.scripts['cf:build:web'] = 'yarn workspace @romchat/web cf:build';
  json.scripts['cf:deploy:web'] = 'yarn workspace @romchat/web cf:deploy';
  json.scripts['cf:build:admin'] = 'yarn workspace @romchat/admin cf:build';
  json.scripts['cf:deploy:admin'] = 'yarn workspace @romchat/admin cf:deploy';
});

updateJson('apps/web/package.json', (json) => {
  json.name = '@romchat/web';
});

updateJson('apps/admin/package.json', (json) => {
  json.name = '@romchat/admin';
});

updateJson('apps/backend/package.json', (json) => {
  json.name = '@romchat/backend';
  json.description = 'RomChat dating and messaging API';
});

updateJson('apps/mobile/package.json', (json) => {
  json.name = '@romchat/mobile';
});

updateJson('packages/shared/package.json', (json) => {
  json.name = '@romchat/shared';
});
