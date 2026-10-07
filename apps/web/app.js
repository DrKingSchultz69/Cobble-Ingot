// mm workspace UI — no build step. Talks to the daemon over REST + one WebSocket.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const store = {
  get: (k, d) => { try { const v = localStorage.getItem("mm." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem("mm." + k, JSON.stringify(v)); } catch {} },
};

async function api(path, opts = {}) {
  const r = await fetch(path, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: opts.body ? { "content-type": "application/json" } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const j = r.headers.get("content-type")?.includes("json") ? await r.json() : await r.text();
  if (!r.ok) throw new Error(j?.error ?? `HTTP ${r.status}`);
  return j;
}

function toast(text, kind = "", onClick) {
  const t = document.createElement("div");
  t.className = `toast ${kind}`;
  t.textContent = text;
  t.onclick = () => { onClick?.(); t.remove(); };
  $("#toasts").append(t);
  setTimeout(() => t.remove(), 7000);
}

async function busy(btn, fn) {
  const label = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;
  try { return await fn(); } catch (e) { toast(e.message, "bad"); } finally { btn.disabled = false; btn.innerHTML = label; }
}

function md(text, sources = []) {
  const html = DOMPurify.sanitize(marked.parse(String(text ?? "")));
  if (!sources.length) return html;
  return html.replace(/\[(\d{1,2})\]/g, (m, n) => {
    const s = sources.find((x) => x.n === Number(n));
    return s ? `<a class="cite" href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">${n}</a>` : m;
  });
}

// ---------------------------------------------------------------- state
const S = {
  tasks: new Map(),
  projects: [],
  project: store.get("project", ""),
  open: store.get("open", []),
  panes: store.get("panes", [null, null]),
  split: store.get("split", false),
  focus: 0,
  terms: new Map(),
  rightTab: "info",
  previewPort: 4143,
  ws: null,
};

// ---------------------------------------------------------------- views
function showView(v) {
  $$("#views button").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
  $$(".view").forEach((s) => s.classList.toggle("active", s.id === `view-${v}`));
  document.body.classList.remove("menu-open");
  store.set("view", v);
  if (v === "workspace") requestAnimationFrame(fitAll);
  if (v === "research") loadResearchSide();
  if (v === "learn") loadDocs();
  if (v === "memory") loadMemory();
  if (v === "usage") loadUsage();
}
$("#views").onclick = (e) => e.target.dataset.view && showView(e.target.dataset.view);
$("#menu-btn").onclick = () => document.body.classList.toggle("menu-open");

function subtabs(container, attr, onChange) {
  $(container).onclick = (e) => {
    const b = e.target.closest("button");
    if (!b?.dataset[attr]) return;
    $$("button", $(container)).forEach((x) => x.classList.toggle("active", x === b));
    onChange(b.dataset[attr]);
  };
}

// ---------------------------------------------------------------- project picker
function renderProjects() {
  const sel = $("#project");
  const list = [...new Set([S.project, ...S.projects].filter(Boolean))];
  // With no projects, "+ Add" must not be the selected option, or picking it fires no change event.
  sel.innerHTML = (list.length ? "" : `<option value="" selected disabled>No project yet</option>`) +
    list.map((p) => `<option value="${esc(p)}" ${p === S.project ? "selected" : ""}>${esc(p.split(/[\\/]/).pop())} — ${esc(p)}</option>`).join("") +
    `<option value="__add">+ Add project folder…</option>`;
}
$("#project").onchange = (e) => {
  if (e.target.value === "__add") {
    renderProjects();
    return openPicker();
  }
  setProject(e.target.value);
};
$("#project-add").onclick = () => openPicker();

// ---------------------------------------------------------------- folder picker
const pick = { path: "", parent: null };
function openPicker() {
  $("#pick").showModal();
  browse(S.project || "");
}
async function browse(path) {
  const list = $("#pick-list");
  list.innerHTML = `<span class="spinner"></span>`;
  try {
    const r = await api(`/api/fs/dirs?path=${encodeURIComponent(path)}`);
    Object.assign(pick, r);
    $("#pick-path").value = r.path;
    $("#pick-up").disabled = r.parent == null;
    $("#pick-note").textContent = !r.path ? "Pick a drive or your home folder."
      : r.remote ? `${r.remote.github ? "GitHub" : r.remote.host}: ${r.remote.owner}/${r.remote.repo} · branch ${r.remote.branch} ✓`
      : r.git ? "Git repo ✓ (no remote, local only)" : "Not a git repo. Tasks work, but without their own worktree.";
    renderCloneNote();
    list.innerHTML = r.dirs.map((d) => `<div class="item" data-path="${esc(d.path)}">📁 ${esc(d.name)}${d.git ? `<span class="git">git</span>` : ""}</div>`).join("") ||
      `<p class="muted small">No sub-folders.</p>`;
  } catch (e) {
    list.innerHTML = `<p class="muted small">${esc(e.message)}</p>`;
  }
}
// Clone target: the folder open below, unless it's empty (drive list) or itself a repo; then ~/mm-projects.
let cloneDefault = "";
const cloneParent = () => (pick.path && !pick.git ? pick.path : cloneDefault);
function renderCloneNote() {
  $("#clone-note").textContent = cloneParent() ? `Clones into ${cloneParent()} (browse below to change).` : "";
}
api("/api/projects/clone-dir").then((r) => { cloneDefault = r.dir; renderCloneNote(); }).catch(() => {});
async function cloneNow() {
  const url = $("#clone-url").value.trim();
  if (!url) return toast("Paste a repo URL first.", "bad");
  const btn = $("#clone-go");
  $("#clone-note").textContent = "Cloning… big repos can take a minute.";
  const label = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;
  try {
    const r = await api("/api/projects/clone", { body: { url, parent: cloneParent() || undefined } });
    setProject(r.path);
    $("#clone-url").value = "";
    $("#pick").close();
    toast(`${r.reused ? "Already cloned" : "Cloned"}: ${r.path}`, "ok");
    renderCloneNote();
  } catch (e) {
    // Toasts sit under the modal dialog, so show the error inside it.
    $("#clone-note").innerHTML = `<span style="color:var(--bad)">${esc(e.message)}</span>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = label;
  }
}
$("#clone-go").onclick = cloneNow;
$("#clone-url").onkeydown = (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  cloneNow();
};
$("#pick-list").onclick = (e) => {
  const it = e.target.closest(".item");
  if (it) browse(it.dataset.path);
};
$("#pick-up").onclick = () => browse(pick.parent ?? "");
$("#pick-go").onclick = () => browse($("#pick-path").value);
$("#pick-path").onkeydown = (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  browse($("#pick-path").value);
};
$("#pick-use").onclick = async () => {
  // A pasted path that wasn't opened with Go yet: check it exists first.
  const typed = $("#pick-path").value.trim();
  if (typed && typed !== pick.path) {
    await browse(typed);
    if (pick.path !== $("#pick-path").value || !pick.path) return;
  }
  if (!pick.path) return;
  setProject(pick.path);
  $("#pick").close();
  toast(`Project: ${pick.path}`, "ok");
};
function setProject(p) {
  S.project = p;
  store.set("project", p);
  renderProjects();
  loadRemote();
  if ($("#view-memory").classList.contains("active")) loadMemory();
}
// Badge next to the project picker: the GitHub repo + branch this folder is connected to.
async function loadRemote() {
  const a = $("#project-remote");
  a.hidden = true;
  if (!S.project) return;
  try {
    const r = (await api(`/api/projects/info?path=${encodeURIComponent(S.project)}`)).remote;
    if (!r) return;
    a.href = r.web;
    a.title = `${r.remote}
Open on ${r.host}`;
    a.innerHTML = `${r.github ? "GitHub" : esc(r.host)} · ${esc(r.owner)}/${esc(r.repo)} <span class="br">· ${esc(r.branch)}</span>`;
    a.hidden = false;
  } catch {}
}

// ---------------------------------------------------------------- websocket
function connect() {
  const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
  S.ws = ws;
  ws.onopen = () => {
    $("#conn").classList.add("on");
    for (const id of new Set(S.panes.filter(Boolean))) send({ t: "attach", id });
  };
  ws.onclose = () => {
    $("#conn").classList.remove("on");
    setTimeout(connect, 1500);
  };
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.t === "data" || m.t === "buffer") {
      const t = S.terms.get(m.id);
      if (!t) return;
      if (m.t === "buffer") t.term.reset();
      t.term.write(m.data);
    } else if (m.t === "task") {
      S.tasks.set(m.task.id, m.task);
      renderBoard();
      renderTabs();
      if (S.panes[S.focus] === m.task.id) renderInfo();
    } else if (m.t === "removed") {
      S.tasks.delete(m.id);
      closeTab(m.id);
      renderBoard();
    } else if (m.t === "notify") {
      const kind = m.status === "failed" ? "bad" : m.status === "done" ? "ok" : "";
      toast(`${m.title} ${m.body}`, kind, () => { showView("workspace"); openTask(m.taskId); });
      if (document.hidden && "Notification" in window && Notification.permission === "granted") new Notification(m.title, { body: m.body });
    }
  };
}
const send = (m) => S.ws?.readyState === 1 && S.ws.send(JSON.stringify(m));

// ---------------------------------------------------------------- new task + router preview
let routeTimer;
$("#nt-prompt").oninput = () => {
  clearTimeout(routeTimer);
  routeTimer = setTimeout(previewRoute, 400);
};
$("#nt-agent").onchange = previewRoute;
async function previewRoute() {
  const prompt = $("#nt-prompt").value.trim();
  const out = $("#nt-route");
  if (!prompt || $("#nt-agent").value !== "auto") return (out.textContent = "");
  try {
    const d = await api("/api/route", { body: { prompt } });
    out.innerHTML = `→ <b>${esc(d.candidate.label)}</b> · ${esc(d.reason)}`;
  } catch (e) {
    out.textContent = e.message;
  }
}
$("#new-task").onsubmit = (e) => {
  e.preventDefault();
  if (!S.project) return toast("Pick a project folder first (top right).", "bad");
  busy(e.submitter, async () => {
    const t = await api("/api/tasks", {
      body: {
        prompt: $("#nt-prompt").value,
        agent: $("#nt-agent").value,
        model: $("#nt-model").value.trim() || undefined,
        repo: S.project,
        isolate: $("#nt-isolate").checked,
        lean: $("#nt-lean").checked,
        parentId: $("#new-task").dataset.parent || undefined,
      },
    });
    delete $("#new-task").dataset.parent;
    $("#nt-prompt").value = "";
    $("#nt-route").textContent = "";
    S.tasks.set(t.id, t);
    renderBoard();
    openTask(t.id);
    document.body.classList.remove("menu-open");
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  });
};

// ---------------------------------------------------------------- board
const COLS = [
  ["Needs you", ["idle"]],
  ["Running", ["starting", "running"]],
  ["Done", ["done"]],
  ["Failed / stopped", ["failed", "stopped"]],
];
function renderBoard() {
  const tasks = [...S.tasks.values()];
  $("#board").innerHTML = COLS.map(([name, sts]) => {
    const list = tasks.filter((t) => sts.includes(t.status));
    if (!list.length) return "";
    return `<div class="col"><h4>${name}<span>${list.length}</span></h4>${list.map(taskCard).join("")}</div>`;
  }).join("") || `<p class="muted small">No tasks yet.</p>`;
}
function taskCard(t) {
  const open = S.panes.includes(t.id) ? "open" : "";
  return `<div class="task ${open}" data-id="${t.id}">
    <div class="t">${esc(t.title)}</div>
    <div class="m"><span class="s-${t.status}">●</span>${esc(t.agent)}${t.model ? " · " + esc(t.model) : ""}<span class="badge">${esc(t.status)}</span></div>
  </div>`;
}
$("#board").onclick = (e) => {
  const c = e.target.closest(".task");
  if (c) {
    openTask(c.dataset.id);
    document.body.classList.remove("menu-open");
  }
};

// ---------------------------------------------------------------- tabs + panes + terminals
function openTask(id) {
  if (!S.open.includes(id)) S.open.push(id);
  if (!S.panes.includes(id)) S.panes[S.focus] = id;
  else S.focus = S.panes.indexOf(id);
  persistLayout();
  renderTabs();
  renderPanes();
  renderBoard();
  renderInfo();
  if (S.rightTab === "diff") loadDiff();
}
function closeTab(id) {
  S.open = S.open.filter((x) => x !== id);
  S.panes = S.panes.map((p) => (p === id ? null : p));
  const t = S.terms.get(id);
  if (t) {
    send({ t: "detach", id });
    t.term.dispose();
    t.el.remove();
    S.terms.delete(id);
  }
  persistLayout();
  renderTabs();
  renderPanes();
}
function persistLayout() {
  store.set("open", S.open);
  store.set("panes", S.panes);
  store.set("split", S.split);
}
function renderTabs() {
  const tabs = S.open.filter((id) => S.tasks.has(id)).map((id) => {
    const t = S.tasks.get(id);
    return `<div class="tab ${S.panes[S.focus] === id ? "active" : ""}" data-id="${id}"><span class="s-${t.status}">●</span><span>${esc(t.title.slice(0, 28))}</span><span class="x" data-close="${id}">×</span></div>`;
  });
  $("#tabs").innerHTML = tabs.join("") + `<div class="tab-tools">
    <button id="split-btn" title="Split view">${S.split ? "Single" : "Split"}</button>
    <button id="right-btn" class="only-mobile">Details</button></div>`;
  $("#split-btn").onclick = () => { S.split = !S.split; if (!S.split) S.focus = 0; persistLayout(); renderTabs(); renderPanes(); };
  $("#right-btn").onclick = () => document.body.classList.toggle("show-right");
}
$("#tabs").onclick = (e) => {
  const x = e.target.dataset.close;
  if (x) return closeTab(x);
  const tab = e.target.closest(".tab");
  if (tab) openTask(tab.dataset.id);
};

function renderPanes() {
  const host = $("#panes");
  host.classList.toggle("split", S.split);
  const ids = (S.split ? S.panes : [S.panes[0] ?? S.panes[1]]).map((id) => (id && S.tasks.has(id) ? id : null));
  if (!S.split && !S.panes[0] && S.panes[1]) { S.panes[0] = S.panes[1]; S.panes[1] = null; }
  $("#ws-empty").hidden = ids.some(Boolean);
  $$(".pane", host).forEach((p) => p.remove());
  ids.forEach((id, i) => {
    if (!id && !S.split) return;
    const pane = document.createElement("div");
    pane.className = "pane";
    const t = id && S.tasks.get(id);
    pane.innerHTML = `<div class="pane-head ${i === S.focus ? "focus" : ""}"><span>${t ? esc(`${t.agent} · ${t.title}`) : "Empty pane — open a task"}</span><span>${t ? esc(t.branch || "") : ""}</span></div>`;
    pane.onmousedown = () => { if (S.focus !== i) { S.focus = i; renderTabs(); renderInfo(); $$(".pane-head").forEach((h, j) => h.classList.toggle("focus", j === i)); } };
    if (id) pane.append(termFor(id).el);
    host.append(pane);
  });
  requestAnimationFrame(fitAll);
}

function termFor(id) {
  let t = S.terms.get(id);
  if (t) return t;
  const el = document.createElement("div");
  el.className = "term";
  const term = new Terminal({
    fontFamily: getComputedStyle(document.body).getPropertyValue("--mono"),
    fontSize: matchMedia("(max-width: 900px)").matches ? 12 : 13,
    cursorBlink: true,
    scrollback: 10000,
    theme: { background: getComputedStyle(document.body).getPropertyValue("--bg").trim() || "#0d0f12" },
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(el);
  term.onData((data) => send({ t: "input", id, data }));
  t = { term, fit, el };
  S.terms.set(id, t);
  send({ t: "attach", id });
  return t;
}
function fitAll() {
  for (const [id, t] of S.terms) {
    if (!t.el.isConnected) continue;
    try {
      t.fit.fit();
      send({ t: "resize", id, cols: t.term.cols, rows: t.term.rows });
    } catch {}
  }
}
addEventListener("resize", () => { clearTimeout(fitAll.t); fitAll.t = setTimeout(fitAll, 150); });

// phone key bar
$("#keybar").onclick = (e) => {
  const id = S.panes[S.focus];
  if (!id) return;
  if (e.target.id === "kb-type") {
    const text = prompt("Send text to the agent (Enter is added):");
    if (text != null) send({ t: "input", id, data: text + "\r" });
    return;
  }
  const k = e.target.dataset.key;
  if (k) send({ t: "input", id, data: JSON.parse(`"${k}"`) });
};

// ---------------------------------------------------------------- right panel
subtabs("#right-tabs", "tab", (tab) => {
  S.rightTab = tab;
  $$(".right-body > div").forEach((d) => d.classList.toggle("active", d.dataset.pane === tab));
  if (tab === "diff") loadDiff();
});
function current() { return S.tasks.get(S.panes[S.focus]); }

function renderInfo() {
  const t = current();
  if (!t) return ($("#info").innerHTML = `<p class="muted">Select a task.</p>`);
  const age = Math.round((Date.now() - t.created) / 60000);
  $("#info").innerHTML = `
    <h3>${esc(t.title)}</h3>
    <dl class="kv">
      <dt>Status</dt><dd class="s-${t.status}">${esc(t.status)}${t.exit_code != null ? ` (exit ${t.exit_code})` : ""}</dd>
      <dt>Agent</dt><dd>${esc(t.agent)}${t.model ? " · " + esc(t.model) : ""}</dd>
      <dt>Why</dt><dd>${esc(t.reason)}</dd>
      <dt>Category</dt><dd>${esc(t.category)}</dd>
      <dt>Branch</dt><dd>${esc(t.branch || "— (no worktree)")}</dd>
      <dt>Folder</dt><dd>${esc(t.cwd)}</dd>
      <dt>Started</dt><dd>${age} min ago</dd>
    </dl>
    <div class="actions">
      <button data-act="stop">Stop</button>
      <button data-act="continue">Hand off…</button>
      <button data-act="diff">View diff</button>
      <button data-act="remove">Remove</button>
    </div>
    <div class="card-title">Prompt</div><pre>${esc(t.prompt)}</pre>
    <div id="task-usage"></div>`;
  api("/api/usage?hours=720").then((u) => {
    const rows = u.byTask.filter((r) => r.task === t.id);
    if (rows.length) $("#task-usage").innerHTML = `<div class="card-title">Model usage</div>` + table(rows, ["agent", "calls", "tokens_in", "tokens_out", "cost_usd", "rate_limited"]);
  }).catch(() => {});
}
$("#info").onclick = async (e) => {
  const act = e.target.dataset.act;
  const t = current();
  if (!act || !t) return;
  if (act === "stop") await api(`/api/tasks/${t.id}/stop`, { body: {} });
  if (act === "diff") $('#right-tabs [data-tab="diff"]').click();
  if (act === "continue") {
    $("#new-task").dataset.parent = t.id;
    $("#nt-prompt").value = `Continue: ${t.title}`;
    $("#nt-agent").value = "auto";
    $("#nt-prompt").focus();
    document.body.classList.add("menu-open");
    toast("Write the next step. The new agent will see this task's decisions and outcome in shared memory.");
  }
  if (act === "remove") {
    const wt = t.worktree && confirm(`Also delete the worktree folder?\n${t.cwd}\n(The branch ${t.branch} is kept.)`);
    if (!confirm(`Remove task "${t.title}"${t.status === "running" ? " and stop the agent" : ""}?`)) return;
    await api(`/api/tasks/${t.id}?worktree=${wt ? 1 : 0}`, { method: "DELETE" }).catch((err) => toast(err.message, "bad"));
  }
};

async function loadDiff() {
  const t = current();
  if (!t) return;
  $("#diff").innerHTML = `<span class="spinner"></span>`;
  try {
    const d = await api(`/api/tasks/${t.id}/diff`);
    $("#diff").innerHTML = `<div class="row"><b class="grow">${d.files.length} changed file(s)</b><button id="diff-refresh">Refresh</button></div>
      <pre>${esc(d.stat || "No changes yet.")}</pre>${d.diff ? `<div class="diff">${renderDiff(d.diff)}</div>` : ""}`;
    $("#diff-refresh").onclick = loadDiff;
  } catch (e) {
    $("#diff").innerHTML = `<p class="muted">${esc(e.message)}</p>`;
  }
}
function renderDiff(text) {
  return text.split("\n").slice(0, 4000).map((l) => {
    const c = l.startsWith("diff --git") ? "f" : l.startsWith("@@") ? "h" : l.startsWith("+") && !l.startsWith("+++") ? "a" : l.startsWith("-") && !l.startsWith("---") ? "d" : "";
    return `<div class="${c}">${esc(l) || " "}</div>`;
  }).join("");
}

$("#pv-go").onclick = () => {
  const port = Number($("#pv-port").value);
  if (!port) return toast("Enter the port your dev server runs on.", "bad");
  store.set("pvport", port);
  // Cookies don't cross ports, so the server hands out a one-time link carrying the token.
  api(`/api/preview-link?port=${port}&host=${encodeURIComponent(location.hostname)}`).then((r) => ($("#pv-frame").src = r.url)).catch((e) => toast(e.message, "bad"));
};

// ---------------------------------------------------------------- research
let rsThread = null;
subtabs("#rs-mode", "mode", (m) => {
  $("#rs-answer-mode").hidden = m !== "answer";
  $("#rs-papers-mode").hidden = m !== "papers";
});
async function loadResearchSide() {
  const [threads, cols, info] = await Promise.all([api("/api/research/threads"), api("/api/collections"), api("/api/research/info")]).catch((e) => (toast(e.message, "bad"), [[], [], {}]));
  $("#rs-info").textContent = info.llm ? `model: ${info.llm} · search: ${info.search}` : "";
  $("#rs-threads").innerHTML = threads.map((t) => `<div class="item ${t.id === rsThread ? "active" : ""}" data-id="${t.id}" title="${esc(t.title)}">${esc(t.title)}</div>`).join("") || `<p class="muted small">No threads yet.</p>`;
  $("#rs-collections").innerHTML = cols.map((c) => `<div class="item" data-cid="${c.id}">${esc(c.name)} <span class="muted">(${c.items})</span></div>`).join("") || `<p class="muted small">Save papers or answers to a space.</p>`;
}
$("#rs-threads").onclick = (e) => { const id = e.target.closest(".item")?.dataset.id; if (id) openThread(Number(id)); };
$("#rs-collections").onclick = async (e) => {
  const id = e.target.closest(".item")?.dataset.cid;
  if (!id) return;
  const items = await api(`/api/collections/${id}`);
  $('#rs-mode [data-mode="answer"]').click();
  $("#rs-thread").innerHTML = `<h3>Space</h3>` + items.map((i) => `<div class="paper"><div class="pt">${esc(i.title)}</div><div class="pm">${esc(i.kind)} · ${esc(i.ref)}</div>${i.data?.url ? `<a href="${esc(i.data.url)}" target="_blank" rel="noopener">${esc(i.data.url)}</a>` : ""}</div>`).join("");
};
$("#rs-new").onclick = () => { rsThread = null; $("#rs-thread").innerHTML = ""; $("#rs-q").focus(); loadResearchSide(); };
async function openThread(id) {
  rsThread = id;
  const { messages } = await api(`/api/research/threads/${id}`);
  $("#rs-thread").innerHTML = "";
  for (let i = 0; i < messages.length; i += 2) renderAnswer(messages[i]?.content, messages[i + 1]);
  loadResearchSide();
}
function renderAnswer(q, m) {
  if (!m) return;
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<div class="q">${esc(q)}</div>
    <div class="sources">${m.sources.map((s) => `<div class="source"><a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">${s.n}. ${esc(s.title)}</a><div class="u">${esc(s.url)}</div></div>`).join("")}</div>
    <div class="md">${md(m.content ?? m.answer, m.sources)}</div>
    <div class="actions"><button data-send>Send to agent</button><button data-save>Save to space</button></div>
    ${m.followups?.length ? `<div class="followups"><div class="card-title">Follow up</div>${m.followups.map((f) => `<button data-fu="${esc(f)}">↳ ${esc(f)}</button>`).join("")}</div>` : ""}`;
  div.querySelector("[data-send]").onclick = () => {
    showView("workspace");
    $("#nt-prompt").value = `Use this research:\n\nQ: ${q}\n\n${m.content ?? m.answer}\n\nSources:\n${m.sources.map((s) => `[${s.n}] ${s.url}`).join("\n")}\n\nTask: `;
    $("#nt-prompt").focus();
    document.body.classList.add("menu-open");
  };
  div.querySelector("[data-save]").onclick = async () => {
    const name = prompt("Space name:", "Research");
    if (!name) return;
    await api("/api/collections/add", { body: { name, kind: "answer", ref: String(m.id ?? m.messageId), title: q, data: { answer: m.content ?? m.answer } } });
    toast(`Saved to ${name}`, "ok");
    loadResearchSide();
  };
  div.querySelectorAll("[data-fu]").forEach((b) => (b.onclick = () => { $("#rs-q").value = b.dataset.fu; $("#rs-form").requestSubmit(); }));
  $("#rs-thread").append(div);
  div.scrollIntoView({ behavior: "smooth", block: "start" });
}
$("#rs-form").onsubmit = (e) => {
  e.preventDefault();
  const q = $("#rs-q").value.trim();
  if (!q) return;
  busy(e.submitter, async () => {
    const pending = document.createElement("div");
    pending.className = "msg";
    pending.innerHTML = `<div class="q">${esc(q)}</div><p class="muted"><span class="spinner"></span> searching and reading sources…</p>`;
    $("#rs-thread").append(pending);
    try {
      const a = await api("/api/research/ask", { body: { q, focus: $("#rs-focus").value, deep: $("#rs-deep").checked, threadId: rsThread } });
      rsThread = a.threadId;
      $("#rs-q").value = "";
      renderAnswer(q, { ...a, content: a.answer });
      loadResearchSide();
    } finally {
      pending.remove();
    }
  });
};

// papers
let papers = [];
$("#pp-form").onsubmit = (e) => {
  e.preventDefault();
  const q = $("#pp-q").value.trim();
  if (!q) return;
  busy(e.submitter, async () => {
    papers = await api("/api/papers/search", { body: { q, n: 15 } });
    $("#pp-meter-out").innerHTML = "";
    renderPapers();
  });
};
function renderPapers() {
  $("#pp-results").innerHTML = papers.map((p) => `<div class="paper" data-id="${p.id}">
    <label class="row"><input type="checkbox" class="pp-pick" value="${p.id}"><span class="pt grow">${esc(p.title)}</span></label>
    <div class="pm">${esc(p.authors.slice(0, 4).join(", "))}${p.authors.length > 4 ? " et al." : ""} · ${p.year ?? "n.d."} · ${esc(p.venue)} · ${p.citations} citations
      ${p.url ? ` · <a href="${esc(p.url)}" target="_blank" rel="noopener">link</a>` : ""}${p.oaUrl ? ` · <a href="${esc(p.oaUrl)}" target="_blank" rel="noopener">open access</a>` : ""}</div>
    <details><summary>Abstract</summary><p class="small">${esc(p.abstract || "No abstract.")}</p></details>
    <div class="actions"><button data-snap>Study snapshot</button><button data-askp>Ask this paper</button></div>
    <div class="pp-out"></div></div>`).join("") || `<p class="muted">No papers found.</p>`;
}
$("#pp-results").onclick = async (e) => {
  const card = e.target.closest(".paper");
  if (!card) return;
  const out = $(".pp-out", card);
  if (e.target.matches("[data-snap]")) busy(e.target, async () => {
    const s = await api("/api/papers/snapshot", { body: { id: card.dataset.id } });
    out.innerHTML = `<dl class="kv">${Object.entries(s).map(([k, v]) => `<dt>${esc(k.replace(/_/g, " "))}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
  });
  if (e.target.matches("[data-askp]")) {
    const q = prompt("Ask this paper:");
    if (q) busy(e.target, async () => { out.innerHTML = md((await api("/api/papers/ask", { body: { id: card.dataset.id, question: q } })).answer); });
  }
};
const picked = () => $$(".pp-pick:checked").map((c) => c.value);
const exportPapers = (fmt) => {
  const ids = picked().length ? picked() : papers.map((p) => p.id);
  if (!ids.length) return toast("Search for papers first.", "bad");
  location.href = `/api/papers/export?format=${fmt}&ids=${ids.join(",")}`;
};
$("#pp-bib").onclick = () => exportPapers("bibtex");
$("#pp-ris").onclick = () => exportPapers("ris");
$("#pp-csv").onclick = () => exportPapers("csv");
$("#pp-save").onclick = async () => {
  const ids = picked();
  if (!ids.length) return toast("Tick the papers to save.", "bad");
  const name = prompt("Space name:", "Papers");
  if (!name) return;
  for (const p of papers.filter((x) => ids.includes(x.id))) await api("/api/collections/add", { body: { name, kind: "paper", ref: p.id, title: p.title, data: { url: p.url } } });
  toast(`Saved ${ids.length} paper(s) to ${name}`, "ok");
};
$("#pp-meter").onclick = (e) => {
  const question = $("#pp-q").value.trim();
  if (!question) return toast("Type a yes/no question in the search box first.", "bad");
  busy(e.target, async () => {
    const m = await api("/api/papers/meter", { body: { question, ids: picked().length ? picked() : papers.map((p) => p.id) } });
    const seg = (k, color) => (m.percent[k] ? `<span style="width:${m.percent[k]}%;background:${color}">${k} ${m.percent[k]}%</span>` : "");
    $("#pp-meter-out").innerHTML = `<div class="paper"><div class="pt">Consensus: ${esc(m.question)}</div>
      <div class="meter">${seg("yes", "var(--ok)")}${seg("possibly", "var(--warn)")}${seg("no", "var(--bad)")}</div>
      <div class="pm">${m.counts.yes} yes · ${m.counts.possibly} possibly · ${m.counts.no} no · ${m.counts.unrelated} unrelated</div>
      <details><summary>Per paper</summary>${m.perPaper.map((p) => `<div class="small"><b>${esc(p.verdict)}</b> — ${esc(p.title)}: ${esc(p.reason)}</div>`).join("")}</details></div>`;
  });
};

// ---------------------------------------------------------------- learn
subtabs("#ln-mode", "mode", (m) => {
  $$(".lmode").forEach((d) => d.classList.toggle("active", d.dataset.lmode === m));
  if (m === "bank") loadBank();
});
async function loadDocs() {
  const docs = await api("/api/learn/docs").catch(() => []);
  $("#ln-docs").innerHTML = docs.map((d) => `<div class="item" title="${esc(d.path)}">${esc(d.title)} <span class="muted">(${d.chunks})</span></div>`).join("") || `<p class="muted small">Nothing ingested yet.</p>`;
}
$("#ln-ingest").onsubmit = (e) => {
  e.preventDefault();
  busy(e.submitter, async () => {
    const r = await api("/api/learn/ingest", { body: { path: $("#ln-path").value.trim() } });
    $("#ln-ingest-out").textContent = `Added ${r.docs} doc(s), ${r.chunks} chunks.${r.skipped.length ? " Skipped: " + r.skipped.join(", ") : ""}`;
    loadDocs();
  });
};
const chatHistory = [];
$("#ln-chat-form").onsubmit = (e) => {
  e.preventDefault();
  const q = $("#ln-chat-q").value.trim();
  if (!q) return;
  $("#ln-chat").insertAdjacentHTML("beforeend", `<div class="bubble user">${esc(q)}</div>`);
  $("#ln-chat-q").value = "";
  busy(e.submitter, async () => {
    const r = await api("/api/learn/chat", { body: { q, history: chatHistory } });
    chatHistory.push({ role: "user", content: q }, { role: "assistant", content: r.answer });
    const srcs = r.sources.map((s) => ({ ...s, url: "#" }));
    $("#ln-chat").insertAdjacentHTML("beforeend", `<div class="bubble md">${md(r.answer, srcs)}${r.sources.length ? `<div class="small muted">Sources: ${r.sources.map((s) => `[${s.n}] ${esc(s.title)}`).join(" · ")}</div>` : ""}</div>`);
  });
};
$("#ln-solve-form").onsubmit = (e) => {
  e.preventDefault();
  busy(e.submitter, async () => {
    const r = await api("/api/learn/solve", { body: { problem: $("#ln-problem").value, useDocs: $("#ln-usedocs").checked } });
    $("#ln-solve-out").innerHTML = md(r.answer) + (r.usedDocs.length ? `<p class="small muted">Used notes: ${esc(r.usedDocs.join(", "))}</p>` : "");
  });
};
$("#ln-quiz-form").onsubmit = (e) => {
  e.preventDefault();
  busy(e.submitter, async () => {
    const qs = await api("/api/learn/quiz", { body: { topic: $("#ln-topic").value, n: Number($("#ln-n").value), difficulty: $("#ln-diff").value } });
    $("#ln-quiz").innerHTML = qs.map(quizCard).join("") || `<p class="muted">The model didn't return usable questions; try again.</p>`;
  });
};
function quizCard(q) {
  return `<div class="quiz-q" data-id="${q.id}"><b>${esc(q.question)}</b>${q.choices.map((c, i) => `<button data-choice="${i}">${String.fromCharCode(65 + i)}. ${esc(c)}</button>`).join("")}<div class="small qa"></div></div>`;
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-choice]");
  if (!b) return;
  const card = b.closest(".quiz-q");
  if (card.dataset.done) return;
  card.dataset.done = 1;
  const r = await api("/api/learn/answer", { body: { id: Number(card.dataset.id), choice: Number(b.dataset.choice) } });
  $$("[data-choice]", card).forEach((x) => x.classList.toggle("right", Number(x.dataset.choice) === r.answer));
  if (!r.correct) b.classList.add("wrong");
  $(".qa", card).innerHTML = `${r.correct ? "✅ Correct." : "❌ Not quite."} ${esc(r.explanation)}`;
});
async function loadBank() {
  const b = await api("/api/learn/bank");
  $("#ln-bank").innerHTML = (b.stats.length ? table(b.stats, ["topic", "questions", "attempts", "correct"]) : `<p class="muted">No questions yet. Make a quiz first.</p>`) +
    `<h3>Practice</h3>` + b.questions.slice(0, 30).map(quizCard).join("");
}

// ---------------------------------------------------------------- memory
let memMode = "recent";
subtabs("#mem-mode", "mode", (m) => { memMode = m; loadMemory(); });
function needProject() {
  if (!S.project) { $("#mem-out").innerHTML = `<p class="muted">Pick a project folder (top right) to see its memory.</p>`; return false; }
  return true;
}
async function loadMemory() {
  if (!needProject()) return;
  const p = encodeURIComponent(S.project);
  api(`/api/memory/stats?project=${p}`).then((r) => ($("#mem-stats").innerHTML = r.stats.map((s) => `${esc(s.kind)}: <b>${s.n}</b>`).join(" · ") || "Not indexed yet.")).catch(() => {});
  const out = $("#mem-out");
  out.innerHTML = `<span class="spinner"></span>`;
  try {
    if (memMode === "recent") {
      const rows = await api(`/api/memory/recent?project=${p}`);
      out.innerHTML = rows.map((r) => `<div class="paper"><div class="pt">[${esc(r.kind)}] ${esc(r.title)}</div><div class="pm">${new Date(r.updated).toLocaleString()}${r.data?.agent ? " · by " + esc(r.data.agent) : ""}</div><div class="small">${esc(r.body)}</div></div>`).join("") || `<p class="muted">No decisions or outcomes recorded yet. Agents add them with mm_record.</p>`;
    } else if (memMode === "results") {
      const q = $("#mem-q").value.trim();
      if (!q) return (out.innerHTML = `<p class="muted">Type a search above.</p>`);
      const rows = await api(`/api/memory/search?project=${p}&q=${encodeURIComponent(q)}`);
      out.innerHTML = rows.map((r) => `<div class="paper"><div class="pt">[${esc(r.kind)}] ${esc(r.title)}</div><div class="small">${esc(r.snippet)}</div></div>`).join("") || `<p class="muted">No matches.</p>`;
    } else if (memMode === "tree") {
      out.innerHTML = `<pre>${esc((await api(`/api/memory/tree?project=${p}`)).text || "Not indexed yet.")}</pre>`;
    } else {
      out.innerHTML = `<p class="muted small">This is exactly what an agent receives from mm_get_context.</p><div class="md">${md((await api(`/api/memory/context?project=${p}&q=${encodeURIComponent($("#mem-q").value)}`)).text)}</div>`;
    }
  } catch (e) {
    out.innerHTML = `<p class="muted">${esc(e.message)}</p>`;
  }
}
$("#mem-search").onsubmit = (e) => { e.preventDefault(); $('#mem-mode [data-mode="results"]').click(); };
$("#mem-index").onclick = (e) => {
  if (!needProject()) return;
  busy(e.target, async () => {
    const r = await api("/api/memory/index", { body: { project: S.project } });
    toast(`Indexed ${r.files} files, ${r.symbols} symbols`, "ok");
    loadMemory();
  });
};
$("#mem-add").onsubmit = (e) => {
  e.preventDefault();
  if (!needProject()) return;
  busy(e.submitter, async () => {
    await api("/api/memory/record", { body: { project: S.project, kind: $("#mem-kind").value, title: $("#mem-title").value, body: $("#mem-body").value } });
    $("#mem-title").value = $("#mem-body").value = "";
    toast("Saved to shared memory", "ok");
    loadMemory();
  });
};

// ---------------------------------------------------------------- usage
function table(rows, cols) {
  if (!rows.length) return `<p class="muted">No data.</p>`;
  cols ??= Object.keys(rows[0]);
  return `<div style="overflow-x:auto"><table class="grid"><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>${rows.map((r) => `<tr>${cols.map((c) => `<td>${esc(typeof r[c] === "number" ? r[c].toLocaleString() : r[c])}</td>`).join("")}</tr>`).join("")}</table></div>`;
}
async function loadUsage() {
  const u = await api(`/api/usage?hours=${$("#us-hours").value}`);
  $("#us-summary").innerHTML = table(u.summary);
  $("#us-tasks").innerHTML = table(u.byTask.map((r) => ({ ...r, task: S.tasks.get(r.task)?.title ?? r.task })));
}
$("#us-hours").onchange = loadUsage;

// ---------------------------------------------------------------- boot
async function boot() {
  const st = await api("/api/state");
  S.projects = st.projects;
  S.previewPort = st.previewPort ?? 4143;
  if (!S.project && st.projects[0]) S.project = st.projects[0];
  for (const t of st.tasks) S.tasks.set(t.id, t);
  S.open = S.open.filter((id) => S.tasks.has(id));
  S.panes = S.panes.map((id) => (id && S.tasks.has(id) ? id : null));
  renderProjects();
  loadRemote();
  renderBoard();
  renderTabs();
  renderPanes();
  renderInfo();
  const pv = store.get("pvport", "");
  if (pv) $("#pv-port").value = pv;
  const missing = Object.entries(st.availability).filter(([k, v]) => !v && k !== "openrouter").map(([k]) => k);
  if (missing.length) toast(`Not available on this machine: ${missing.join(", ")}`);
  connect();
  showView(store.get("view", "workspace"));
}
boot().catch((e) => toast(e.message, "bad"));
