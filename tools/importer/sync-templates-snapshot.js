#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * Inlines the current tools/importer/page-templates.json (name/urls/blocks only)
 * into import-wknd.js between the WKND_TEMPLATES_SNAPSHOT markers, so the bundled
 * importer carries the template→block mapping without any runtime fs access.
 *
 * Run before bundling: node tools/importer/sync-templates-snapshot.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname);
const templatesPath = path.join(root, 'page-templates.json');
const scriptPath = path.join(root, 'import-wknd.js');

const data = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
const slim = {
  templates: (data.templates || []).map((t) => ({
    name: t.name,
    urls: t.urls || [],
    blocks: t.blocks || [],
  })),
};

const START = '/* WKND_TEMPLATES_SNAPSHOT_START */';
const END = '/* WKND_TEMPLATES_SNAPSHOT_END */';
const snapshot = `${START}\nconst PAGE_TEMPLATES = ${JSON.stringify(slim)};\n${END}`;

let src = fs.readFileSync(scriptPath, 'utf8');
const re = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
if (!re.test(src)) {
  console.error('Snapshot markers not found in import-wknd.js');
  process.exit(1);
}
src = src.replace(re, snapshot);
fs.writeFileSync(scriptPath, src);
console.log(`Inlined ${slim.templates.length} templates into import-wknd.js`);
