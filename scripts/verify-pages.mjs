import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const index = await readFile('build/index.html', 'utf8');
assert.match(index, /Experiment de comprehensiune/);
const markers = [
  'raspuns_corect', 'exp_readability25.csv', 'selected_texts.csv', 'sb_secret_',
  'SUPABASE_SECRET_KEY', 'READABILITY_SERVICE_KEY'
];
let files = 0;
for (const file of await readdir('build', { recursive: true, withFileTypes: true })) {
  if (file.isDirectory()) continue;
  assert.ok(file.isFile() && /\.(?:html|js|css|json)$/.test(file.name), 'Fișier neașteptat: ' + file.name);
  const content = await readFile(join(file.parentPath, file.name), 'utf8');
  for (const marker of markers) assert.ok(!content.includes(marker), 'Conținut privat în ' + file.name);
  files++;
}
console.log(files + ' fișiere statice verificate.');

