import { routesFor } from "../mock/routes.js";
import type { Schema, SchemaField } from "../types.js";

const CSS = `:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0 auto;max-width:980px;padding:2rem 1.25rem;font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
h1{font-size:1.6rem}
h2{margin-top:2.5rem;border-bottom:1px solid #8884;padding-bottom:.35rem}
h3{font-size:1.05rem;margin-top:1.4rem}
a{color:#3b82f6}
nav ul{display:flex;flex-wrap:wrap;gap:.75rem;list-style:none;padding:0}
code{font:.92em ui-monospace,SFMono-Regular,Consolas,monospace;background:#8881;padding:.1rem .35rem;border-radius:4px}
table{border-collapse:collapse;width:100%;margin:.5rem 0}
th,td{border:1px solid #8884;padding:.4rem .55rem;text-align:left}
th{background:#8881}
pre{background:#8881;padding:.75rem;border-radius:8px;overflow:auto}
footer{margin-top:3rem;color:#888;font-size:.85rem}
section{scroll-margin-top:1rem}`;

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fieldLabel(f: SchemaField): string {
  if (f.type === "enum") return (f.values ?? []).join(" | ");
  if (f.type === "number" && f.format === "BRL") return "number (BRL)";
  if (f.type === "ref" || f.type === "array") return f.ref ? `${f.type} → ${f.ref}` : f.type;
  return f.type;
}

/**
 * Documentação HTML em página única (PRD-05 RF-06): âncoras por recurso,
 * CSS inline e zero dependências externas (offline). Determinística.
 */
export function buildHtmlDocs(schemas: Schema[]): string {
  const nav = schemas
    .map((s) => `<li><a href="#${esc(s.name.toLowerCase())}">${esc(s.name)}</a></li>`)
    .join("");
  const sections = schemas
    .map((s) => {
      const rows = s.fields
        .map(
          (f) =>
            `<tr><td><code>${esc(f.name)}</code></td><td>${esc(fieldLabel(f))}</td><td>${f.required ? "sim" : "não"}</td><td>${esc(f.generator ?? "—")}</td></tr>`,
        )
        .join("");
      const endpoints = routesFor(s)
        .map((r) => `<li><code>${esc(r)}</code></li>`)
        .join("");
      return `<section id="${esc(s.name.toLowerCase())}">
<h2>${esc(s.name)}</h2>
<h3>Endpoints</h3>
<ul class="endpoints">${endpoints}</ul>
<h3>Query Parameters</h3>
<table><thead><tr><th>Nome</th><th>Tipo</th></tr></thead><tbody><tr><td><code>page</code></td><td>number</td></tr><tr><td><code>limit</code></td><td>number</td></tr></tbody></table>
<h3>Campos</h3>
<table><thead><tr><th>Campo</th><th>Tipo</th><th>Obrigatório</th><th>Gerador</th></tr></thead><tbody>${rows}</tbody></table>
<h3>Response 200</h3>
<pre><code>{ "data": "${esc(s.name)}[]", "total": "number" }</code></pre>
</section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DevMock — Contrato da API</title>
<style>${CSS}</style>
</head>
<body>
<header>
<h1>DevMock — Contrato da API</h1>
<p>Gerado a partir dos Schemas em <code>.devmock/schemas/</code>.</p>
<nav><ul>${nav}</ul></nav>
</header>
<main>
${sections}
</main>
<footer>Gerado por DevMock — arquivo offline, sem dependências externas.</footer>
</body>
</html>
`;
}
