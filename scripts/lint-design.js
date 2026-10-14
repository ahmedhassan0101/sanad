// فحص الهوية: يفشل لو وجد ألوانًا خام أو ml-/mr-/pl-/pr- في المكوّنات.
// التوكنز مسموحة في globals.css فقط، ومكوّنات shadcn الجاهزة (ui/) خارج الفحص.
const fs = require("node:fs");
const path = require("node:path");

const ROOTS = ["src/app", "src/components"];
// المستثنى: shadcn الجاهزة (ui/ لا تُستبدل) وglobals.css (بيت التوكنز).

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const RAW_COLOR = /[:\s"`](?:bg|text|border|ring|decoration|accent|outline|fill|stroke|from|via|to)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|black|white)-(50|100|200|300|400|500|600|700|800|900|950)\b/;
const PHYSICAL = /[:\s"`]\b(ml|mr|pl|pr)-\d/;

function files(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...files(p));
    else if (/\.(tsx?|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

let bad = 0;
for (const root of ROOTS) {
  for (const f of files(root)) {
    if (f.endsWith("globals.css")) continue;
    if (f.includes(`components${path.sep}ui${path.sep}`)) continue;
    const lines = fs.readFileSync(f, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const [re, what] of [[HEX, "hex"], [RAW_COLOR, "raw-color"], [PHYSICAL, "physical-side"]]) {
        const m = line.match(re);
        if (m) {
          console.error(`${f}:${i + 1} [${what}] ${m[0]} :: ${line.trim().slice(0, 100)}`);
          bad++;
        }
      }
    });
  }
}
if (bad > 0) {
  console.error(`lint:design فشل: ${bad} مخالفة`);
  process.exit(1);
}
console.log("lint:design سليم");
