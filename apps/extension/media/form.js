/* DevMock Studio — lógica do painel (sem inline; CSP estrito). */
(function () {
  const vscode = acquireVsCodeApi();
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function blankRow() { return { n: "", t: "string", r: false, g: "(tipo)", e: "" }; }

  const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const KINDS = ["list", "item", "create", "update", "patch", "delete", "custom"];
  function blankRoute() { return { m: "GET", p: "", k: "list", s: "", b: "" }; }

  /** Converte Schema do host para linhas da UI (values[] -> texto vírgula). */
  function toUi(schema) {
    return {
      model: schema.name || "",
      rows: (schema.fields || []).map((f) => ({
        n: f.name || "",
        t: f.type || "string",
        r: !!f.required,
        g: f.generator || "(tipo)",
        e: (f.values || []).join(","),
      })),
      customRoutes: Array.isArray(schema.routes) && schema.routes.length > 0,
      routes: (Array.isArray(schema.routes) ? schema.routes : []).map((route) => ({
        m: String(route.method || "GET").toUpperCase(),
        p: route.path || "",
        k: route.kind || "custom",
        s: route.response && route.response.status !== undefined ? String(route.response.status) : "",
        b: route.response && route.response.body !== undefined ? JSON.stringify(route.response.body) : "",
        o: route,
      })),
    };
  }

  function genOptionsHtml(current) {
    return window.DM_GENERATORS.map((g) => `<option value="${g}"${g === current ? " selected" : ""}>${g}</option>`).join("");
  }
  function typeOptionsHtml(current) {
    return window.DM_TYPES.map((t) => `<option value="${t}"${t === current ? " selected" : ""}>${t}</option>`).join("");
  }

  function addRow(data) {
    const d = data || blankRow();
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td><input class="n" value="${escapeHtml(d.n)}" placeholder="name"/></td>` +
      `<td><select class="t">${typeOptionsHtml(d.t)}</select></td>` +
      `<td><input type="checkbox" class="r"${d.r ? " checked" : ""}/></td>` +
      `<td><select class="g">${genOptionsHtml(d.g)}</select></td>` +
      `<td><input class="e" value="${escapeHtml(d.e)}" placeholder="ACTIVE,BLOCKED"/></td>` +
      `<td><button class="btn btn-secondary del">×</button></td>`;
    tr.querySelector(".del").onclick = () => { tr.remove(); persist(); };
    tr.addEventListener("input", persist);
    tr.addEventListener("change", persist);
    $("#fields").appendChild(tr);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function methodOptionsHtml(current) {
    const values = METHODS.includes(current) ? METHODS : [...METHODS, current].filter(Boolean);
    return values.map((m) => `<option value="${escapeHtml(m)}"${m === current ? " selected" : ""}>${escapeHtml(m)}</option>`).join("");
  }
  function kindOptionsHtml(current) {
    const values = KINDS.includes(current) ? KINDS : [...KINDS, current].filter(Boolean);
    return values.map((k) => `<option value="${escapeHtml(k)}"${k === current ? " selected" : ""}>${escapeHtml(k)}</option>`).join("");
  }

  function addRoute(data) {
    const d = data || blankRoute();
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td><select class="m">${methodOptionsHtml(d.m)}</select></td>` +
      `<td><input class="p" value="${escapeHtml(d.p)}" placeholder="/v1/users"/></td>` +
      `<td><select class="k">${kindOptionsHtml(d.k)}</select></td>` +
      `<td><input class="s" type="number" min="200" max="599" value="${escapeHtml(d.s)}" placeholder="200"/></td>` +
      `<td><input class="b" value="${escapeHtml(d.b)}" placeholder='{"ok":true}'/></td>` +
      `<td><button class="btn btn-secondary del">×</button></td>`;
    tr._origRoute = d.o;
    tr.querySelector(".del").onclick = () => { tr.remove(); persist(); };
    tr.addEventListener("input", persist);
    tr.addEventListener("change", persist);
    $("#routes").appendChild(tr);
  }

  function syncRoutes() {
    const custom = $("#customRoutes").checked;
    $("#routesBox").classList.toggle("hidden", !custom);
    if (custom && $$("#routes tr").length <= 1) addRoute();
  }

  function collect() {
    return {
      model: $("#model").value,
      rows: $$("#fields tr").slice(1).map((tr) => ({
        n: $(".n", tr).value,
        t: $(".t", tr).value,
        r: $(".r", tr).checked,
        g: $(".g", tr).value,
        e: $(".e", tr).value,
      })),
      customRoutes: $("#customRoutes").checked,
      routes: $$("#routes tr").slice(1).map((tr) => ({
        m: $(".m", tr).value,
        p: $(".p", tr).value,
        k: $(".k", tr).value,
        s: $(".s", tr).value,
        b: $(".b", tr).value,
        o: tr._origRoute,
      })),
    };
  }

  function persist() {
    const c = collect();
    vscode.setState(c);
    scheduleAutoPreview(c);
  }

  // Preview automático com debounce: gera a cada edição sem poluir (silencioso).
  let autoTimer = undefined;
  function scheduleAutoPreview(c) {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      const hasModel = (c.model || "").trim().length > 0;
      const hasField = c.rows.some((r) => (r.n || "").trim().length > 0);
      if (!hasModel || !hasField) return;
      sendPreview(c, true);
    }, 600);
  }

  function toFields(rows) {
    return rows.map((r) => ({
      name: r.n,
      type: r.t,
      required: r.r,
      generator: r.g === "(tipo)" ? undefined : r.g,
      values: r.e ? r.e.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    }));
  }

  function toRoutes(rows) {
    const routes = [];
    for (let index = 0; index < rows.length; index++) {
      const r = rows[index];
      const path = (r.p || "").trim();
      const status = (r.s || "").trim();
      const body = (r.b || "").trim();
      if (!path) {
        const touched = !!r.o || status || body || (r.k && r.k !== "list") || (r.m && r.m !== "GET");
        if (touched) {
          return { error: `Rota ${index + 1} sem path — preencha ou remova a linha.` };
        }
        continue;
      }
      // Preserva props da rota original (summary etc.); só method/path/kind/response mudam.
      const original = r.o && typeof r.o === "object" ? r.o : {};
      const route = { ...original, method: r.m, path, kind: r.k };
      if (status || body) {
        route.response = { ...(original.response || {}) };
        if (status) route.response.status = Number(status);
        else delete route.response.status;
        if (body) {
          try {
            route.response.body = JSON.parse(body);
          } catch {
            return { error: `Body inválido em ${r.m} ${path}: use JSON válido.` };
          }
        } else {
          delete route.response.body;
        }
        if (Object.keys(route.response).length === 0) delete route.response;
      } else {
        delete route.response;
      }
      routes.push(route);
    }
    return { routes };
  }

  function sendPreview(c, silent) {
    vscode.postMessage({
      kind: "preview",
      silent: !!silent,
      model: c.model,
      fields: toFields(c.rows),
      records: Math.max(1, parseInt($("#records").value, 10) || 5),
      seed: $("#seed").value === "" ? undefined : $("#seed").value,
    });
  }

  function showBox(kind, text) {
    const box = $("#msg");
    box.className = "alert " + (kind === "error" ? "alert-error" : "alert-ok");
    box.textContent = text;
    box.classList.remove("hidden");
  }

  // Restaura estado (sobrevive a recarregamentos do painel).
  // Modo edição: DM_INITIAL (injetado pelo host) vence quando não há estado salvo.
  const saved = vscode.getState();
  const initial = window.DM_INITIAL;
  const hasSaved = saved && typeof saved.model === "string" && (saved.model !== "" || (saved.rows || []).length > 0);
  const boot = hasSaved ? saved : (initial ? toUi(initial) : { model: "", rows: [blankRow()], customRoutes: false, routes: [] });
  $("#model").value = boot.model || "";
  (boot.rows && boot.rows.length ? boot.rows : [blankRow()]).forEach(addRow);
  $("#customRoutes").checked = !!boot.customRoutes;
  (boot.routes || []).forEach(addRoute);
  syncRoutes();
  $("#model").addEventListener("input", persist);
  const seedInput = $("#seed");
  if (seedInput && window.DM_SEED != null) seedInput.value = window.DM_SEED;

  $("#add").onclick = () => addRow();
  $("#customRoutes").addEventListener("change", () => { syncRoutes(); persist(); });
  $("#addRoute").onclick = () => { addRoute(); persist(); };
  $("#resetRoutes").onclick = () => {
    $("#customRoutes").checked = false;
    $$("#routes tr").slice(1).forEach((tr) => tr.remove());
    syncRoutes();
    persist();
  };
  $("#save").onclick = () => {
    const c = collect();
    let routes;
    if (c.customRoutes) {
      const parsed = toRoutes(c.routes);
      if (parsed.error) {
        showBox("error", parsed.error);
        return;
      }
      routes = parsed.routes;
    }
    vscode.postMessage({ kind: "save", model: c.model, fields: toFields(c.rows), routes });
  };
  $("#preview").onclick = () => sendPreview(collect(), false);
  const recSeed = () => persist();
  $("#records").addEventListener("input", recSeed);
  $("#seed").addEventListener("input", recSeed);

  window.addEventListener("message", (e) => {
    const msg = e.data || {};
    if (msg.kind === "error") showBox("error", msg.text);
    if (msg.kind === "ok") showBox("ok", msg.text);
    if (msg.kind === "previewResult") {
      const pre = $("#previewOut");
      pre.textContent = msg.text;
      pre.classList.remove("hidden");
    }
  });
})();
