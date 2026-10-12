/* DevMock Studio — lógica do painel (sem inline; CSP estrito). */
(function () {
  const vscode = acquireVsCodeApi();
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const state = vscode.getState() || { model: "", rows: [blankRow()] };
  function blankRow() { return { n: "", t: "string", r: false, g: "(tipo)", e: "" }; }

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
    };
  }

  function persist() {
    const c = collect();
    vscode.setState(c);
  }

  function showBox(kind, text) {
    const box = $("#msg");
    box.className = "alert " + (kind === "error" ? "alert-error" : "alert-ok");
    box.textContent = text;
    box.classList.remove("hidden");
  }

  // Restaura estado (sobrevive a recarregamentos do painel).
  $("#model").value = state.model || "";
  (state.rows && state.rows.length ? state.rows : [blankRow()]).forEach(addRow);
  $("#model").addEventListener("input", persist);
  const seedInput = $("#seed");
  if (seedInput && window.DM_SEED != null) seedInput.value = window.DM_SEED;

  $("#add").onclick = () => addRow();
  $("#save").onclick = () => {
    const c = collect();
    const fields = c.rows.map((r) => ({
      name: r.n,
      type: r.t,
      required: r.r,
      generator: r.g === "(tipo)" ? undefined : r.g,
      values: r.e ? r.e.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    }));
    vscode.postMessage({ kind: "save", model: c.model, fields });
  };
  $("#preview").onclick = () => {
    const c = collect();
    const fields = c.rows.map((r) => ({
      name: r.n,
      type: r.t,
      required: r.r,
      generator: r.g === "(tipo)" ? undefined : r.g,
      values: r.e ? r.e.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    }));
    vscode.postMessage({
      kind: "preview",
      model: c.model,
      fields,
      records: Math.max(1, parseInt($("#records").value, 10) || 20),
      seed: $("#seed").value === "" ? undefined : $("#seed").value,
    });
  };

  window.addEventListener("message", (e) => {
    const msg = e.data || {};
    if (msg.kind === "error") showBox("error", msg.text);
    if (msg.kind === "ok") showBox("ok", msg.text);
    if (msg.kind === "previewResult") {
      const pre = $("#previewOut");
      pre.textContent = msg.text;
      pre.classList.remove("hidden");
      const badge = $("#previewBadge");
      if (badge) badge.textContent = msg.label || "";
    }
  });
})();
