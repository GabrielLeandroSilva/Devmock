/** Conversor JSON→YAML mínimo (só o subset que geramos), sem dependências. */
export function toYaml(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (value === null || value === undefined) return "null\n";
  if (typeof value === "boolean" || typeof value === "number") return `${String(value)}\n`;
  if (typeof value === "string") return `${yamlString(value)}\n`;
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]\n";
    return value
      .map((item) => {
        // Objeto em lista vira "- k: v" com irmãos alinhados (formato canônico).
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
          const lines = toYaml(item, indent + 1).split("\n").filter((l) => l.length > 0);
          const first = lines[0].replace(/^ +/, "");
          return `${pad}- ${first}\n${lines.slice(1).join("\n")}${lines.length > 1 ? "\n" : ""}`;
        }
        return `${pad}- ${toYaml(item, indent + 1)}`;
      })
      .join("");
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "{}\n";
  return entries
    .map(([k, v]) => {
      // Chaves só-numéricas ("200") vão quotadas: YAML as leria como inteiro.
      const key = /^\d+$/.test(k) ? JSON.stringify(k) : /^[A-Za-z0-9_/-]+$/.test(k) ? k : JSON.stringify(k);
      if (v !== null && typeof v === "object") {
        const nested = toYaml(v, indent + 1);
        const isEmpty = nested === "[]\n" || nested === "{}\n";
        return isEmpty ? `${pad}${key}: ${nested}` : `${pad}${key}:\n${nested}`;
      }
      return `${pad}${key}: ${toYaml(v, indent + 1)}`;
    })
    .join("");
}

function yamlString(s: string): string {
  if (s === "" || /[:#{}[\],&*!|>'"%@`]/.test(s) || /^\s|\s$/.test(s) || /^(true|false|null|~|\d)/.test(s)) {
    return JSON.stringify(s);
  }
  return s;
}
