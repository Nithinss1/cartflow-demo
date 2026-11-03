#!/usr/bin/env node
// Applies QA failure-learning edits written by the QA run (qa-results/skill-updates.json)
// to skill files. Only files under .factory/skills/ may be edited, because the JSON is
// produced by an agent run and must not be able to rewrite workflows or app code.
const fs = require('node:fs');
const path = require('node:path');

const SKILLS_ROOT = path.resolve('.factory/skills');

function headingLevel(line) {
  const match = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
  return match ? { level: match[1].length, text: match[2] } : null;
}

function applyEdit(edit) {
  const { file, section, action, content } = edit;
  if (typeof file !== 'string' || typeof section !== 'string' || typeof content !== 'string') {
    throw new Error(`invalid edit: ${JSON.stringify(edit)}`);
  }
  if (action !== 'append' && action !== 'replace') throw new Error(`unknown action "${action}" for ${file}`);
  const target = path.resolve(file);
  if (!target.startsWith(SKILLS_ROOT + path.sep) || !target.endsWith('.md')) {
    throw new Error(`refusing to edit ${file}: only .factory/skills/**/*.md is allowed`);
  }
  if (!fs.existsSync(target)) throw new Error(`file not found: ${file}`);
  if (fs.lstatSync(target).isSymbolicLink() || !fs.realpathSync(target).startsWith(fs.realpathSync(SKILLS_ROOT) + path.sep)) {
    throw new Error(`refusing to edit ${file}: it resolves outside .factory/skills/`);
  }

  const lines = fs.readFileSync(target, 'utf8').split('\n');
  let inFence = false;
  const headings = lines.map(line => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return null; }
    return inFence ? null : headingLevel(line);
  });
  const start = headings.findIndex(heading => heading?.text === section);
  if (start === -1) throw new Error(`section "${section}" not found in ${file}`);
  const level = headings[start].level;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (headings[i] && headings[i].level <= level) { end = i; break; }
  }

  const insert = content.replace(/\s+$/, '').split('\n');
  if (action === 'replace') {
    lines.splice(start + 1, end - start - 1, '', ...insert, '');
  } else {
    let last = end;
    while (last > start + 1 && lines[last - 1].trim() === '') last--;
    lines.splice(last, 0, ...insert);
  }
  fs.writeFileSync(target, lines.join('\n'));
  console.log(`${action} -> ${file} # ${section}`);
}

const input = process.argv[2] || 'qa-results/skill-updates.json';
if (!fs.existsSync(input)) {
  console.log(`No ${input}; nothing to apply.`);
  process.exit(0);
}
const edits = JSON.parse(fs.readFileSync(input, 'utf8'));
if (!Array.isArray(edits)) throw new Error(`${input} must contain a JSON array`);
let failed = 0;
for (const edit of edits) {
  try { applyEdit(edit); } catch (error) { failed++; console.error(`skipped: ${error.message}`); }
}
console.log(`Applied ${edits.length - failed} of ${edits.length} edit(s).`);
