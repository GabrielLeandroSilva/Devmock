// Bundle de produção: esbuild (resolve o symlink @devmock/core e reduz o vsix).
// Checagem de tipos fica no `lint` (tsc --noEmit); aqui é só emit.
const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

// dist limpo: só o bundle vai para o vsix (tsc antigo deixava órfãos).
fs.rmSync(dist, { recursive: true, force: true });

esbuild.buildSync({
  entryPoints: [path.join(root, "src", "extension.ts")],
  bundle: true,
  outfile: path.join(root, "dist", "extension.js"),
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node22",
  sourcemap: false,
  logLevel: "info",
});
console.log("bundle ok: dist/extension.js");
