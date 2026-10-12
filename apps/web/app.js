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
  if (v === "home") renderHome();
  if (v === "workspace") requestAnimationFrame(fitAll);
  if (v === "research") loadResearchSide();
  if (v === "learn") loadDocs();
  if (v === "memory") loadMemory();
  if (v === "usage") loadUsage();
}
$("#views").onclick = (e) => { const b = e.target.closest("button"); if (b?.dataset.view) showView(b.dataset.view); };
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
  const list = [...new Set([S.project, ...S.projects].filter(Boolean))];
  // With no projects, "+ Add" must not be the selected option, or picking it fires no change event.
  const html = (list.length ? "" : `<option value="" selected disabled>No project yet</option>`) +
    list.map((p) => `<option value="${esc(p)}" ${p === S.project ? "selected" : ""}>${esc(p.split(/[\\/]/).pop())} — ${esc(p)}</option>`).join("") +
    `<option value="__add">+ Add project folder…</option>`;
  $("#project").innerHTML = $("#nt-project").innerHTML = html;
}
$("#project").onchange = $("#nt-project").onchange = (e) => {
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
  loadProfiles();
  loadSchedule();
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
    if (S.diffId) send({ t: "watch-diff", id: S.diffId });
    if (S.browserId) send({ t: "watch-browser", id: S.browserId });
    checkServerVersion();
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
      if (S.panes[S.focus] === m.task.id && !$("#info input:focus")) renderInfo();
    } else if (m.t === "meter") {
      S.meters.set(m.id, m.meter);
      updateMeter(m.id);
    } else if (m.t === "guard") {
      if (m.warnings?.length) S.guards.set(m.id, m); else S.guards.delete(m.id);
      if (current()?.id === m.id) renderInfo();
      if (S.diffId === m.id && S.lastDiff) showDiff(S.lastDiff);
    } else if (m.t === "verify") {
      S.verifying = S.verifying || new Set();
      if (m.running) S.verifying.add(m.id); else S.verifying.delete(m.id);
      if (current()?.id === m.id && !$("#info input:focus")) renderInfo();
    } else if (m.t === "quality") {
      if ($("#view-usage").classList.contains("active")) loadQuality();
    } else if (m.t === "race") {
      if (current()?.race === m.race.id && !$("#info input:focus")) renderInfo();
    } else if (m.t === "schedule") {
      S.schedule = m.schedule;
      renderBoard();
    } else if (m.t === "checkpoint") {
      if (current()?.id === m.id) loadCheckpoints(current());
    } else if (m.t === "queue") {
      if (current()?.id === m.id) renderQueue(m.queue);
    } else if (m.t === "alert") {
      S.alerts.unshift(m.alert);
      if ($("#view-usage").classList.contains("active")) renderAlerts();
    } else if (m.t === "browser-frame") {
      showFrame(m);
    } else if (m.t === "browser-error") {
      if (m.id === S.browserId) toast(m.error, "bad");
    } else if (m.t === "diff") {
      showDiff(m);
      codeOnDiff(m);
    } else if (m.t === "removed") {
      S.tasks.delete(m.id);
      dropTaskState(m.id);
      closeTab(m.id);
      renderBoard();
    } else if (m.t === "notify") {
      const kind = m.status === "failed" ? "bad" : m.status === "done" ? "ok" : "";
      toast(`${m.title} ${m.body}`, kind, () => { showView("workspace"); openTask(m.taskId); });
      // With push on, the service worker shows it (once), so the page doesn't.
      if (document.hidden && notifyState() === "on" && !store.get("push", false)) showNotification(m.title, m.body, m.taskId);
    }
  };
}
// Returns true only when the message actually went out.
const send = (m) => {
  if (S.ws?.readyState !== 1) return false;
  S.ws.send(JSON.stringify(m));
  return true;
};

// ---------------------------------------------------------------- notifications (🔔)
// States: on · muted (allowed, but turned off in mm) · ask (never asked) · blocked (denied in the browser)
// · unsupported (no Notification API, or not https/localhost — e.g. the phone over Wi-Fi).
function notifyState() {
  if (!("Notification" in window) || !window.isSecureContext) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission === "default") return "ask";
  return store.get("notify", true) ? "on" : "muted";
}
function showNotification(title, body, taskId) {
  try {
    const n = new Notification(title, { body, icon: "/icon.svg", tag: taskId || "mm" });
    n.onclick = () => { window.focus(); if (taskId) { showView("workspace"); openTask(taskId); } n.close(); };
    return true;
  } catch {
    return false; // Android Chrome only allows notifications from a service worker
  }
}
async function enableNotifications() {
  if (notifyState() === "ask") await Notification.requestPermission();
  if (Notification.permission === "granted") store.set("notify", true);
  renderBell();
}
function renderBell() {
  const st = notifyState();
  const bell = $("#bell");
  bell.dataset.state = st;
  bell.title = { on: "Notifications on", muted: "Notifications muted", ask: "Turn on notifications", blocked: "Notifications blocked by the browser", unsupported: "Notifications not available here" }[st];
  $("#bell-status").innerHTML = {
    on: `<b class="s-running">● On.</b> You'll get a Windows notification when a task needs you.`,
    muted: `<b class="s-stopped">● Muted.</b> Allowed by the browser, but Netheron won't send them.`,
    ask: `<b>● Off.</b> Click <b>Turn on</b>, then <b>Allow</b> in the browser prompt.`,
    blocked: `<b class="s-failed">● Blocked by the browser.</b> Click the icon left of the address bar → <b>Notifications</b> → <b>Allow</b>, then reload.`,
    unsupported: `<b class="s-failed">● Not available here.</b> Browsers only allow notifications on <code>localhost</code> or https. Over Wi-Fi, use <code>mm tunnel</code> (https), or rely on Netheron's own pop-ups.`,
  }[st];
  const t = $("#bell-toggle");
  t.hidden = st === "blocked" || st === "unsupported";
  t.textContent = st === "on" ? "Mute" : "Turn on";
  $("#bell-test").disabled = st !== "on";
  const p = $("#bell-push");
  p.disabled = !pushSupported() || st === "blocked";
  p.checked = pushSupported() && store.get("push", false);
}
$("#bell").onclick = (e) => {
  e.stopPropagation();
  renderBell();
  $("#bell-menu").hidden = !$("#bell-menu").hidden;
};
$("#bell-menu").onclick = (e) => e.stopPropagation();
document.addEventListener("click", () => ($("#bell-menu").hidden = true));
$("#bell-toggle").onclick = async () => {
  if (notifyState() === "on") store.set("notify", false);
  else await enableNotifications();
  renderBell();
};
$("#bell-test").onclick = async () => {
  if (store.get("push", false)) {
    const r = await api("/api/push/test", { body: {} }).catch(() => null);
    return toast(r?.sent ? `Push sent to ${r.sent} device(s). Hide this tab to see it.` : "Push didn't go out. Turn push off and on again.", r?.sent ? "ok" : "bad");
  }
  const ok = showNotification("Netheron: test notification", "Notifications work. You'll get one like this when a task needs you.");
  toast(ok ? "Test sent. Look at the bottom-right of your screen (check Windows Focus / Do Not Disturb if nothing shows)." : "This browser blocked it. On Android, notifications need Netheron installed as an app.", ok ? "ok" : "bad");
};
// Web push (P24 S2): a service worker shows notifications even when no Netheron tab is open.
const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && window.isSecureContext;
const b64ToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
async function setPush(on) {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (!on) {
    if (existing) { await api("/api/push/unsubscribe", { body: { endpoint: existing.endpoint } }); await existing.unsubscribe(); }
    store.set("push", false);
    return;
  }
  if (Notification.permission !== "granted") await Notification.requestPermission();
  if (Notification.permission !== "granted") throw new Error("Allow notifications first.");
  const { key } = await api("/api/push/key");
  const sub = existing ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
  await api("/api/push/subscribe", { body: { endpoint: sub.endpoint, agent: navigator.userAgent } });
  store.set("push", true);
}
$("#bell-push").onchange = async (e) => {
  try { await setPush(e.target.checked); toast(e.target.checked ? "Push on for this browser." : "Push off.", "ok"); }
  catch (err) { e.target.checked = false; toast(err.message, "bad"); }
};
navigator.serviceWorker?.addEventListener("message", (e) => { if (e.data?.openTask) { showView("workspace"); openTask(e.data.openTask); } });
// Permission can change in browser settings while mm is open.
document.addEventListener("visibilitychange", () => !document.hidden && renderBell());
renderBell();

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
  const worker = $("#nt-worker-wrap").hidden ? "" : $("#nt-worker").value;
  if (!S.project && !worker) return toast("Pick a project folder first (top right).", "bad");
  busy(e.submitter, async () => {
    const t = await api(worker ? `/api/workers/${worker}/tasks` : "/api/tasks", {
      body: {
        prompt: $("#nt-prompt").value,
        agent: $("#nt-agent").value,
        model: $("#nt-model").value.trim() || undefined,
        repo: S.project,
        isolate: $("#nt-isolate").checked,
        lean: $("#nt-lean").checked,
        parentId: $("#new-task").dataset.parent || undefined,
        budgetUsd: Number($("#nt-budget-usd").value) || 0,
        budgetMin: Number($("#nt-budget-min").value) || 0,
        autoHandoff: $("#nt-autohandoff").checked,
        checks: $("#nt-checks").value,
        profile: $("#nt-profile-row").hidden ? undefined : $("#nt-profile").value,
        pipeline: $("#nt-pipeline").value || undefined,
        when: $("#nt-when").value,
        at: $("#nt-when").value === "at" && $("#nt-at").value ? new Date($("#nt-at").value).toISOString() : undefined,
        daily: $("#nt-daily").checked,
        race: $("#nt-race").checked,
        browser: $("#nt-browser").checked && !$("#nt-browser").disabled,
      },
    });
    delete $("#new-task").dataset.parent;
    $("#nt-prompt").value = "";
    store.set("nt.last", { agent: $("#nt-agent").value, model: $("#nt-model").value.trim() });
    wizGo(1);
    if (worker) {
      toast(`Started on ${S.workers.find((w) => w.id === worker)?.name ?? "the worker"}. It shows on the board in a moment.`, "ok");
      return loadWorkerTasks();
    }
    if (t.race) {
      toast(`Race started on ${t.race.results.length || "several"} agents. Netheron judges when all have finished.`, "ok");
      return;
    }
    if (t.scheduled) {
      toast(`Scheduled for ${new Date(t.scheduled.run_at).toLocaleString()}${t.scheduled.repeat ? " (every day)" : ""}`, "ok");
      loadSchedule();
      return;
    }
    $("#nt-route").textContent = "";
    S.tasks.set(t.id, t);
    renderBoard();
    openTask(t.id);
    document.body.classList.remove("menu-open");
    if (notifyState() === "ask") enableNotifications(); // first task: ask once
  });
};

// ---------------------------------------------------------------- new task wizard: 1 What → 2 Who → 3 Extras
// Start works on every step; the steps only decide what's on screen, never what's sent.
function wizGo(n) {
  const f = $("#new-task");
  f.dataset.step = n;
  $$("#nt-steps button").forEach((b) => b.classList.toggle("on", +b.dataset.step === n));
  $$(".wiz-step", f).forEach((d) => (d.hidden = +d.dataset.step !== n));
  $("#nt-back").hidden = n === 1;
  $("#nt-next").hidden = n === 3;
  wizSummary();
}
// Step labels say what's chosen ("2 Who: Claude Code"), so nothing chosen is out of sight.
function wizSummary() {
  const agent = $("#nt-agent").selectedOptions[0]?.textContent.replace(" (router decides)", "") ?? "";
  const model = $("#nt-model").value.trim();
  $('#nt-steps [data-step="2"]').textContent = `2 Who: ${agent}${model ? " · " + model : ""}${$("#nt-browser").checked && !$("#nt-browser").disabled ? " · 🌐" : ""}`;
  const when = $("#nt-when").value;
  const extras = [
    when !== "now" && "⏰", ($("#nt-race").checked || $("#nt-autohandoff").checked || $("#nt-pipeline").value) && "👥",
    $("#nt-checks").value && "✅", (!$("#nt-isolate").checked || !$("#nt-lean").checked || ($("#nt-worker-wrap").hidden ? "" : $("#nt-worker").value)) && "⚙",
  ].filter(Boolean).join("");
  $('#nt-steps [data-step="3"]').textContent = `3 Extras${extras ? ": " + extras : ""}`;
  $("#nt-sum-when").textContent = when === "now" ? "" : when === "reset" ? "after limit reset" : "at a time";
  $("#nt-sum-team").textContent = [$("#nt-race").checked && "race", $("#nt-autohandoff").checked && "auto hand-off", $("#nt-pipeline").value && "pipeline"].filter(Boolean).join(", ");
  $("#nt-sum-checks").textContent = $("#nt-checks").value ? $("#nt-checks").selectedOptions[0].textContent.split(":")[0] : "";
  $("#nt-sum-machine").textContent = [!$("#nt-isolate").checked && "no worktree", !$("#nt-lean").checked && "full context"].filter(Boolean).join(", ");
}
function focusNewTask() {
  wizGo(1);
  $("#nt-prompt").focus();
}
$("#nt-steps").onclick = (e) => { const b = e.target.closest("button"); if (b) wizGo(+b.dataset.step); };
$("#nt-next").onclick = () => wizGo(Math.min(3, +$("#new-task").dataset.step + 1));
$("#nt-back").onclick = () => wizGo(Math.max(1, +$("#new-task").dataset.step - 1));
$("#new-task").addEventListener("change", wizSummary);
$("#nt-model").addEventListener("input", wizSummary);
{
  const last = store.get("nt.last", null); // remember the last agent + model you used
  if (last && $(`#nt-agent option[value="${last.agent}"]`)) { $("#nt-agent").value = last.agent; $("#nt-model").value = last.model ?? ""; }
}

// ---------------------------------------------------------------- home: only what needs you
const DAY = 24 * 3600_000;
// Worked out from each task's live state, so a row goes away by itself once it's handled.
function needsYou(t) {
  const now = Date.now();
  const active = ["starting", "running", "idle"].includes(t.status);
  if (t.browser_wait && t.browser_wait !== "You took over") return { rank: 0, icon: "🌐", kind: "warn", text: `Asks for you in the browser: ${t.browser_wait}`, go: "Help" };
  if (t.stuck_at && active) return { rank: 1, icon: "❌", kind: "bad", text: "Looks stuck. Hand it off or stop it.", go: "Fix" };
  if (t.status === "failed" && now - t.updated < DAY) return { rank: 1, icon: "❌", kind: "bad", text: "Failed. See what happened.", go: "Look" };
  if (t.budget_hit && t.status === "idle") return { rank: 1, icon: "⏸", kind: "warn", text: "Budget reached. Continue or stop it.", go: "Decide" };
  if (t.wait_until > now && active) return { rank: 2, icon: "⏸", kind: "", text: `Paused by a usage limit until ${hhmm(t.wait_until)}. Nothing to do unless you want to hand it off.`, go: "Open" };
  if (t.status === "idle") return { rank: 2, icon: "💬", kind: "", text: "Finished a turn, waiting for your reply.", go: "Reply" };
  if (t.status === "done" && now - t.updated < DAY) return { rank: 3, icon: "✅", kind: "ok", text: "Done. Review the changes.", go: "Review" };
  return null;
}
function renderHome() {
  const tasks = [...S.tasks.values()];
  const rows = tasks.map((t) => ({ t, n: needsYou(t) })).filter((r) => r.n).sort((a, b) => a.n.rank - b.n.rank || b.t.updated - a.t.updated);
  const count = $("#home-count");
  count.hidden = !rows.length;
  count.textContent = rows.length;
  if (!$("#view-home").classList.contains("active")) return;
  $("#home-title").textContent = rows.length ? `Needs you (${rows.length})` : "Nothing needs you";
  $("#home-list").innerHTML = rows.map(({ t, n }) => `<div class="home-row ${n.kind}" data-id="${t.id}">
      <span class="home-ic">${n.icon}</span>
      <div class="grow"><div class="home-t">${esc(t.title)}</div><div class="muted small">${esc(n.text)}</div></div>
      <button class="${n.rank < 2 ? "primary" : ""}">${n.go}</button></div>`).join("")
    || `<p class="muted home-calm">All quiet. Agents show up here when they need a decision from you.</p>`;
  const running = tasks.filter((t) => ["starting", "running"].includes(t.status)).length;
  const sched = (S.schedule || []).length;
  $("#home-sum").textContent = [running ? `${running} running` : "nothing running", sched && `${sched} scheduled`, `${tasks.length} task${tasks.length === 1 ? "" : "s"} in total`].filter(Boolean).join(" · ");
}
$("#home-list").onclick = (e) => {
  const r = e.target.closest(".home-row");
  if (!r) return;
  showView("workspace");
  openTask(r.dataset.id);
};
$("#home-new").onclick = () => {
  showView("workspace");
  if (matchMedia("(max-width: 900px)").matches) document.body.classList.add("menu-open");
  focusNewTask();
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
  const sched = (S.schedule || []).length
    ? `<div class="col"><h4>Scheduled <span>${S.schedule.length}</span></h4>${S.schedule.map((s) => `<div class="sched-item"><div class="t">🌙 ${esc(s.title)}</div><div class="m">${new Date(s.run_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}${s.repeat ? " · daily" : ""}${s.when === "reset" ? " · after limit reset" : ""} <button class="link-btn" data-unschedule="${s.id}">cancel</button></div></div>`).join("")}</div>`
    : "";
  const remote = (S.workerTasks || []).map((r) => `<div class="col"><h4>🖥 ${esc(r.worker.name)} <span>${r.online ? r.tasks.length : "offline"}</span></h4>${
    r.online ? r.tasks.map((t) => `<div class="task remote" data-worker="${r.worker.id}" data-rtask="${esc(t.id)}" title="Opens ${esc(r.worker.name)}'s Netheron in a new tab"><div class="t">${esc(t.title)}</div><div class="m"><span class="s-${esc(t.status)}">●</span>${esc(t.agent)}<span class="badge">${esc(t.status)}</span></div></div>`).join("") || `<p class="muted small">No tasks.</p>`
      : `<p class="muted small">${esc(r.error)}</p>`}</div>`).join("");
  $("#board").innerHTML = sched + remote + COLS.map(([name, sts]) => {
    const list = tasks.filter((t) => sts.includes(t.status));
    if (!list.length) return "";
    return `<div class="col"><h4>${name}<span>${list.length}</span></h4>${list.map(taskCard).join("")}</div>`;
  }).join("") || `<p class="muted small">No tasks yet.</p>`;
  renderHome();
}
function taskCard(t) {
  const open = S.panes.includes(t.id) ? "open" : "";
  return `<div class="task ${open}" data-id="${t.id}">
    <div class="t">${esc(t.title)}</div>
    <div class="m"><span class="s-${t.status}">●</span>${esc(t.agent)}${t.model ? " · " + esc(t.model) : ""}<span class="badge">${esc(t.status)}</span>${t.browser_wait ? (t.browser_wait === "You took over" ? '<span class="badge" title="You are driving the browser">🌐 you&#39;re driving</span>' : '<span class="badge warn" title="Needs you in the browser">🌐 needs you</span>') : ""}</div>
  </div>`;
}
$("#board").onclick = async (e) => {
  const r = e.target.closest(".task.remote");
  if (r) {
    const w = window.open("about:blank", "_blank"); // opened now: pop-up blockers allow it
    const { url } = await api(`/api/workers/${r.dataset.worker}/open?task=${encodeURIComponent(r.dataset.rtask)}`);
    if (w) w.location = url;
    return;
  }
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
  syncRight();
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
  const code = S.mode === "code";
  $("#tabs").innerHTML = tabs.join("") + `<div class="tab-tools">
    <button class="side-toggle only-desktop ${sideHidden("side") ? "" : "on"}" data-side="side" title="Show / hide the task list">◧</button>
    <div class="seg"><button data-mode="term" class="${code ? "" : "active"}">Terminal</button><button data-mode="code" class="${code ? "active" : ""}">Code</button></div>
    ${code ? "" : `<button id="split-btn" title="Split view">${S.split ? "Single" : "Split"}</button>`}
    <button class="side-toggle only-desktop ${sideHidden("right") ? "" : "on"}" data-side="right" title="Show / hide Info · Diff · Preview">◨</button>
    <button id="right-btn" class="only-mobile">Details</button></div>`;
  $$("#tabs .side-toggle").forEach((b) => (b.onclick = () => toggleSide(b.dataset.side)));
  $$("#tabs .seg button").forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
  if (!code) $("#split-btn").onclick = () => { S.split = !S.split; if (!S.split) S.focus = 0; persistLayout(); renderTabs(); renderPanes(); };
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
  const ide = S.mode === "code" && renderIde();
  host.hidden = !!ide;
  $("#ide").hidden = !ide;
  if (ide) return requestAnimationFrame(fitAll);
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
    pane.innerHTML = `<div class="pane-head ${i === S.focus ? "focus" : ""}"><span>${t ? esc(`${t.agent} · ${t.title}`) : "Empty pane — open a task"}</span><span class="meter" data-meter="${id || ""}">${id ? meterText(S.meters.get(id)) : ""}</span><span>${t ? esc(t.branch || "") : ""}</span></div>`;
    pane.onmousedown = () => { if (S.focus !== i) { S.focus = i; renderTabs(); renderInfo(); syncRight(); $$(".pane-head").forEach((h, j) => h.classList.toggle("focus", j === i)); } };
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
  syncRight();
});
// The Diff tab and code mode both follow the focused task and share one live feed of file changes.
function syncRight() {
  if (S.rightTab === "diff" || S.mode === "code") loadDiff();
  else unwatchDiff();
  if (S.rightTab === "browser" && current()?.browser) watchBrowser(current().id);
  else unwatchBrowser();
  $("#right").classList.toggle("browsing", S.rightTab === "browser");
  window.dispatchEvent(new Event("resize")); // terminals refit to the new width
}

// ---------------------------------------------------------------- Browser tab (live view of the task's Chrome window)
// Frames arrive over the WebSocket only while this tab is open. While YOU have control, clicks/keys/scroll on the
// picture go to Chrome; while the agent drives, it's watch-only (the server refuses input too).
function watchBrowser(id) {
  if (S.browserId !== id) {
    S.browserId = id;
    S.bv = null;
    $("#bv-img").hidden = true;
    $("#bv-empty").hidden = false;
    $("#bv-url").textContent = "";
  }
  send({ t: "watch-browser", id });
}
function unwatchBrowser() {
  if (S.browserId) send({ t: "unwatch-browser" });
  S.browserId = null;
}
function showFrame(m) {
  if (m.id !== S.browserId) return;
  S.bv = { w: m.width, h: m.height };
  const img = $("#bv-img");
  img.src = `data:image/jpeg;base64,${m.data}`;
  img.hidden = false;
  $("#bv-empty").hidden = true;
  $("#bv-url").textContent = m.url || "";
}
function renderBrowserBar() {
  const t = current();
  const on = !!t?.browser;
  $("#rt-browser").hidden = !on;
  if (!on && S.rightTab === "browser") return $('#right-tabs [data-tab="info"]').click();
  if (!on) return;
  const mine = !!t.browser_wait;
  $("#bv-state").innerHTML = mine
    ? `<b>You have control</b>${t.browser_wait !== "You took over" ? ` (${esc(t.browser_wait)})` : ""}. Click and type on the picture. The agent waits.`
    : "The agent is driving. Watch only: press <b>Take over</b> to drive yourself.";
  $("#bv-take").hidden = mine;
  $("#bv-resume").hidden = !mine;
  $("#bv-stage").className = `bv-stage ${mine ? "user" : "agent"}`;
  for (const el of $$("#bv-type input, #bv-type button")) el.disabled = !mine;
}
const bvInput = (input) => {
  const t = current();
  if (!t?.browser || S.browserId !== t.id) return;
  if (!t.browser_wait) return toast("The agent is driving. Press Take over first.");
  send({ t: "browser-input", id: t.id, input });
};
const bvPoint = (e) => {
  const r = $("#bv-img").getBoundingClientRect();
  if (!S.bv || !r.width) return null;
  return { x: Math.round(((e.clientX - r.left) / r.width) * S.bv.w), y: Math.round(((e.clientY - r.top) / r.height) * S.bv.h) };
};
$("#bv-img").addEventListener("click", (e) => {
  const p = bvPoint(e);
  $("#bv-img").focus();
  if (p) bvInput({ kind: "click", ...p, count: Math.min(3, e.detail || 1) });
});
let bvWheelAt = 0;
$("#bv-img").addEventListener("wheel", (e) => {
  if (!current()?.browser_wait) return; // let the panel scroll normally while watching
  e.preventDefault();
  if (Date.now() - bvWheelAt < 60) return;
  bvWheelAt = Date.now();
  const p = bvPoint(e);
  if (p) bvInput({ kind: "scroll", ...p, dy: Math.max(-600, Math.min(600, e.deltaY * (e.deltaMode === 1 ? 40 : 1))) });
}, { passive: false });
const BV_KEYS = new Set(["Enter", "Tab", "Escape", "Backspace", "Delete", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"]);
$("#bv-img").addEventListener("keydown", (e) => {
  if (!current()?.browser_wait || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length === 1) bvInput({ kind: "text", text: e.key });
  else if (BV_KEYS.has(e.key)) bvInput({ kind: "key", key: e.key });
  else return;
  e.preventDefault();
});
$("#bv-type").onsubmit = (e) => {
  e.preventDefault();
  const text = $("#bv-text").value;
  if (!text) return;
  bvInput({ kind: "text", text });
  $("#bv-text").value = "";
};
$("#bv-enter").onclick = () => bvInput({ kind: "key", key: "Enter" });
const bvAct = (path, done) => async () => {
  const t = current();
  if (!t) return;
  const r = await api(`/api/tasks/${t.id}/browser/${path}`, { body: {} }).catch((err) => toast(err.message, "bad"));
  if (r && done) toast(done, "ok");
};
$("#bv-show").onclick = bvAct("show");
$("#bv-take").onclick = bvAct("takeover", "You have the browser. The agent is blocked until you press Resume.");
$("#bv-resume").onclick = bvAct("resume", "Handed back. The agent gets \"Done, continue\" as soon as it's waiting.");
function current() { return S.tasks.get(S.panes[S.focus]); }

function renderInfo() {
  renderBrowserBar();
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
      ${t.budget_usd || t.budget_min ? `<dt>Budget</dt><dd>${t.budget_usd ? "$" + t.budget_usd : ""}${t.budget_usd && t.budget_min ? " · " : ""}${t.budget_min ? t.budget_min + " min" : ""}${t.budget_hit ? ' <span class="s-stopped">reached</span>' : ""}</dd>` : ""}
      ${t.setup_note ? `<dt>Setup</dt><dd class="small">${esc(t.setup_note)}</dd>` : ""}
      ${t.auto_handoff ? `<dt>Auto hand-off</dt><dd>on (if stuck or limited)</dd>` : ""}
      ${checksRow(t)}
      ${rulesRow(t)}
      ${pipelineRow(t)}
      ${["pi", "omp"].includes(t.agent) ? `<dt>Note</dt><dd class="small muted">${t.agent === "pi" ? "Pi" : "Oh My Pi"} calls providers directly: usage, cost alarms and the live meter don't see it. Shared memory was put in its prompt (no MCP).</dd>` : ""}
      ${t.race ? `<dt>Race</dt><dd id="info-race"><span class="spinner"></span></dd>` : ""}
      ${t.profile ? `<dt>Account</dt><dd>${esc(S.profiles.find((p) => p.id === t.profile)?.name ?? t.profile)}</dd>` : ""}
    </dl>
    ${wave1Banners(t)}
    <div class="actions">
      <button data-act="stop">Stop</button>
      <button data-act="continue">Hand off…</button>
      <button data-act="diff">View diff</button>
      <button data-act="remove">Remove</button>
    </div>
    <div class="card-title">Live usage</div><div id="info-meter"></div>
    <div class="card-title">Message queue</div>
    <form id="info-queue" class="row"><input id="info-queue-text" class="grow" placeholder="Follow-up for the agent (sent when it's free)"><button>Queue</button></form>
    <div id="info-queue-list"></div>
    <div class="card-title">Checkpoints</div><div id="info-checkpoints"><span class="spinner"></span></div>
    <div class="card-title">Receipt</div><div id="info-receipt"><button data-act="receipt">Show receipt</button></div>
    <div class="card-title">Prompt</div><pre>${esc(t.prompt)}</pre>
    <div id="task-usage"></div>`;
  renderMeterBox();
  loadMeter(t.id);
  if (t.race) loadRace(t.race);
  loadQueue(t);
  loadCheckpoints(t);
  if (["done", "failed", "stopped"].includes(t.status)) showReceipt(t);
  $("#info-queue").onsubmit = async (ev) => {
    ev.preventDefault();
    const text = $("#info-queue-text").value.trim();
    if (!text) return;
    const r = await api(`/api/tasks/${t.id}/queue`, { body: { text } }).catch((err) => toast(err.message, "bad"));
    if (r) { $("#info-queue-text").value = ""; renderQueue(r.queue); }
  };
  api("/api/usage?hours=720").then((u) => {
    const rows = u.byTask.filter((r) => r.task === t.id);
    if (rows.length) $("#task-usage").innerHTML = `<div class="card-title">Model usage</div>` + table(rows, ["agent", "calls", "tokens_in", "tokens_out", "cost_usd", "rate_limited"]);
  }).catch(() => {});
}
$("#info").onclick = async (e) => {
  const act = e.target.dataset.act;
  const t = current();
  if (!act || !t) return;
  if (e.target.tagName === "A") e.preventDefault();
  await wave1Act(act, e.target, t);
  if (act === "stop") await api(`/api/tasks/${t.id}/stop`, { body: {} });
  if (act === "diff") $('#right-tabs [data-tab="diff"]').click();
  if (act === "continue") {
    $("#new-task").dataset.parent = t.id;
    $("#nt-prompt").value = `Continue: ${t.title}`;
    $("#nt-agent").value = "auto";
    focusNewTask();
    document.body.classList.add("menu-open");
    toast("Write the next step. The new agent will see this task's decisions and outcome in shared memory.");
  }
  if (act === "remove") {
    const wt = t.worktree && confirm(`Also delete the worktree folder?\n${t.cwd}\n(The branch ${t.branch} is kept.)`);
    if (!confirm(`Remove task "${t.title}"${t.status === "running" ? " and stop the agent" : ""}?`)) return;
    await api(`/api/tasks/${t.id}?worktree=${wt ? 1 : 0}`, { method: "DELETE" }).catch((err) => toast(err.message, "bad"));
  }
};

// Diff tab is live: the server watches the task's folder and pushes a new diff on every change.
function loadDiff() {
  const t = current();
  if (!t) return;
  if (S.diffId !== t.id) {
    S.diffId = t.id;
    $("#diff").innerHTML = `<span class="spinner"></span>`;
  }
  if (!send({ t: "watch-diff", id: t.id })) {
    // Not connected yet: show a one-off snapshot; the live feed starts on reconnect.
    api(`/api/tasks/${t.id}/diff`).then((d) => showDiff({ id: t.id, ...d })).catch((e) => ($("#diff").innerHTML = `<p class="muted">${esc(e.message)}</p>`));
  }
}
function unwatchDiff() {
  if (S.diffId) send({ t: "unwatch-diff" });
  S.diffId = null;
}
function showDiff(d) {
  if (d.id !== S.diffId) return;
  S.lastDiff = d;
  if ($("#diff .comment-row")) { S.pendingDiff = d; return; } // don't wipe a comment you're typing
  const box = $("#right .right-body");
  const top = box.scrollTop; // keep your place while it updates
  $("#diff").innerHTML = `<div class="row"><b class="grow">${d.files.length} changed file(s)</b>
      <span class="live" title="Updates automatically when files change">● live · ${new Date().toLocaleTimeString()}</span></div>
    ${guardBanner(d.id)}<pre>${esc(d.stat || "No changes yet.")}</pre>${d.diff ? `<p class="muted small">Click a line to send a comment to the agent.</p><div class="diff">${annotateDiff(d.diff)}</div>` : ""}`;
  box.scrollTop = top;
}
function renderDiff(text) {
  return text.split("\n").slice(0, 4000).map((l) => {
    const c = l.startsWith("diff --git") ? "f" : l.startsWith("@@") ? "h" : l.startsWith("+") && !l.startsWith("+++") ? "a" : l.startsWith("-") && !l.startsWith("---") ? "d" : "";
    return `<div class="${c}">${esc(l) || " "}</div>`;
  }).join("");
}


// ---------------------------------------------------------------- Wave 1: meter, guard, checkpoints, queue, receipt, alerts
S.meters = new Map();
S.guards = new Map();
S.alerts = [];
const fmtK = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n || 0));
const hhmm = (ms) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
function meterText(m) {
  if (!m || !m.calls) return "";
  return `${fmtK(m.tokensIn)} in · ${fmtK(m.tokensOut)} out · $${m.costUsd.toFixed(2)} · ctx ${fmtK(m.contextTokens)}${m.tokensPerSec ? ` · ${m.tokensPerSec} tok/s` : ""}`;
}
function updateMeter(id) {
  const txt = meterText(S.meters.get(id));
  $$(`[data-meter="${id}"]`).forEach((el) => (el.textContent = txt));
  if (current()?.id === id) renderMeterBox();
}
function renderMeterBox() {
  const t = current();
  const box = $("#info-meter");
  if (!t || !box) return;
  const m = S.meters.get(t.id);
  if (!m || !m.calls) return (box.innerHTML = `<p class="muted small">No model calls yet.</p>`);
  box.innerHTML = `<dl class="kv">
      <dt>Tokens</dt><dd>${fmtK(m.tokensIn)} in · ${fmtK(m.tokensOut)} out</dd>
      <dt>Cost</dt><dd>$${m.costUsd.toFixed(4)}${t.budget_usd ? ` of $${t.budget_usd} budget` : ""}</dd>
      <dt>Context</dt><dd>${fmtK(m.contextTokens)} tokens (last call)</dd>
      <dt>Speed</dt><dd>${m.tokensPerSec ? m.tokensPerSec + " tok/s" : "–"}</dd>
      <dt>Model</dt><dd>${esc(m.lastModel || "–")}</dd>
      <dt>Calls</dt><dd>${m.calls}${m.errors ? ` · <span class="s-failed">${m.errors} failed</span>` : ""}</dd>
      ${m.resetAt ? `<dt>Limit</dt><dd class="s-stopped">resets at ${hhmm(m.resetAt)}</dd>` : ""}
    </dl>`;
}
async function loadMeter(id) {
  try { S.meters.set(id, await api(`/api/tasks/${id}/meter`)); updateMeter(id); } catch {}
}

async function loadRace(rid) {
  const box = $("#info-race");
  if (!box) return;
  try {
    const { race, tasks } = await api(`/api/races/${rid}`);
    const rows = race.results.length ? race.results : tasks.map((t) => ({ task: t.id, agent: t.agent, model: t.model, status: t.status, checks: "–", lines: "–", costUsd: 0, score: "–" }));
    box.innerHTML = `<div class="small">${race.status === "running" ? "Running: judged when every contender has finished a turn." : race.status === "kept" ? "Winner kept, others removed." : "Judged."}${race.verify ? ` Checks: <code>${esc(race.verify)}</code>` : " No checks command: diff size and cost decide."}</div>
      <table class="grid"><tr><th></th><th>Agent</th><th>Status</th><th>Checks</th><th>Lines</th><th>$</th><th>Score</th><th></th></tr>
      ${rows.map((x) => `<tr><td>${x.task === race.winner ? "★" : ""}</td><td><a href="#" data-act="open-task" data-id="${esc(x.task)}">${esc(x.agent)}${x.model ? " " + esc(x.model) : ""}</a></td><td>${esc(x.status)}</td><td>${esc(x.checks)}</td><td>${esc(x.lines)}</td><td>${typeof x.costUsd === "number" ? x.costUsd.toFixed(2) : ""}</td><td>${esc(x.score)}</td>
        <td>${race.status !== "kept" ? `<button data-act="race-keep" data-rid="${esc(rid)}" data-task="${esc(x.task)}">Keep</button>` : ""}</td></tr>`).join("")}</table>
      ${race.status === "running" ? `<button data-act="race-judge" data-rid="${esc(rid)}">Judge now</button>` : ""}`;
  } catch (e) { box.textContent = e.message; }
}
function pipelineRow(t) {
  if (!t.pipeline) return "";
  const p = JSON.parse(t.pipeline);
  return `<dt>Pipeline</dt><dd class="ladder">${p.steps.map((s, i) => `<span class="step ${i === p.index ? "on" : i < p.index ? "done" : ""}">${esc(s.label || s.agent)} (${esc(s.agent)})</span>`).join(" → ")}<br><span class="muted small">Moves on when the agent says STEP DONE${t.checks ? " and checks pass" : ""}.</span></dd>`;
}
function rulesRow(t) {
  let rules = [];
  try { rules = JSON.parse(t.rules_given || "[]"); } catch {}
  return rules.length ? `<dt>Rules given</dt><dd><details><summary>${rules.length} project rule(s)</summary><ul>${rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></details></dd>` : "";
}
function checksRow(t) {
  const ladderHtml = t.dial_ladder ? JSON.parse(t.dial_ladder).map((c, i) => `<span class="step ${i === t.dial_step ? "on" : i < t.dial_step ? "done" : ""}">${esc(c.label)}</span>`).join(" → ") : "";
  let last = "";
  try { const r = JSON.parse(t.verify_last || "null"); if (r) last = `${r.ok ? '<span class="s-running">✓ pass</span>' : `<span class="s-failed">✗ fail (exit ${r.code})</span>`} · ${Math.round(r.ms / 1000)} s · ${hhmm(r.ts)}`; } catch {}
  const running = S.verifying?.has(t.id) ? ' <span class="spinner"></span> running…' : "";
  if (!t.checks && !t.verify_last) return `<dt>Checks</dt><dd><button data-act="run-checks">Run checks</button></dd>`;
  return `<dt>Checks</dt><dd>${esc(t.verify_cmd || "project default")}${running}<br>${last || "not run yet"} <button data-act="run-checks">Run now</button></dd>
    ${ladderHtml ? `<dt>Budget Dial</dt><dd class="ladder">${ladderHtml}</dd>` : ""}`;
}
function wave1Banners(t) {
  const out = [];
  if (t.browser && t.browser_wait) out.push(`<div class="banner warn">🌐 <b>Needs you in the browser:</b> ${esc(t.browser_wait)}. The agent can't act until you're done. <button data-act="browser-show">Show window</button> <button data-act="browser-resume" class="primary">Resume</button></div>`);
  else if (t.browser) out.push(`<div class="banner">🌐 This agent has a browser window. <button data-act="browser-show">Show window</button> <button data-act="browser-takeover">Take over</button></div>`);
  if (t.wait_until && t.wait_until > Date.now()) out.push(`<div class="banner warn">⏸ Usage limit hit. Netheron will ask the agent to continue at <b>${hhmm(t.wait_until)}</b>. <button data-act="cancel-wait">Don't resume</button> <button data-act="handoff-now">Hand off now</button></div>`);
  if (t.stuck_at) out.push(`<div class="banner bad">⚠ This agent looks stuck. <button data-act="handoff-now">Hand off now</button> <button data-act="rescue">Hand off with my own note…</button> <button data-act="stop">Stop</button></div>`);
  if (t.budget_hit) out.push(`<div class="banner warn">💰 Budget reached${t.budget_usd ? ` ($${t.budget_usd})` : ""}${t.budget_min ? ` (${t.budget_min} min)` : ""}. The agent was interrupted. Type in the terminal to continue.</div>`);
  if (t.handoff_to) out.push(`<div class="banner">↪ Handed off to <a href="#" data-act="open-task" data-id="${esc(t.handoff_to)}">${esc(S.tasks.get(t.handoff_to)?.agent ?? "the next agent")}: ${esc(S.tasks.get(t.handoff_to)?.title ?? t.handoff_to)}</a></div>`);
  if (t.handoff_from) out.push(`<div class="banner">↩ Continues the work of <a href="#" data-act="open-task" data-id="${esc(t.handoff_from)}">${esc(S.tasks.get(t.handoff_from)?.agent ?? "")}: ${esc(S.tasks.get(t.handoff_from)?.title ?? t.handoff_from)}</a> in the same folder.</div>`);
  const g = S.guards.get(t.id);
  if (g?.warnings?.length) {
    out.push(`<div class="banner bad">🛡 Possible damage after the last turn (compared with checkpoint #${g.checkpoint}):
      <ul>${g.warnings.map((w) => `<li><b>${esc(w.path)}</b> · ${esc(w.kind)}: ${esc(w.detail)} ${w.kind !== "git" ? `<button data-act="restore-file" data-n="${g.checkpoint}" data-path="${esc(w.path)}">Restore file</button>` : ""}</li>`).join("")}</ul>
      <button data-act="restore-all" data-n="${g.checkpoint}">Restore whole folder to #${g.checkpoint}</button></div>`);
  }
  return out.join("");
}

async function loadCheckpoints(t) {
  const box = $("#info-checkpoints");
  if (!box) return;
  try {
    const r = await api(`/api/tasks/${t.id}/checkpoints`);
    if (r.guard?.warnings?.length) S.guards.set(t.id, { id: t.id, ...r.guard });
    box.innerHTML = r.checkpoints.length
      ? `<div class="list">${[...r.checkpoints].reverse().slice(0, 15).map((c) => `<div class="cp-row"><span>#${c.n} · ${esc(c.label)} · ${hhmm(c.ts)}</span><button data-act="restore-all" data-n="${c.n}">Restore</button></div>`).join("")}</div>`
      : `<p class="muted small">None yet (taken after each agent turn).</p>`;
  } catch { box.innerHTML = `<p class="muted small">Not a git folder: no checkpoints.</p>`; }
}

function renderQueue(q) {
  const box = $("#info-queue-list");
  if (!box) return;
  box.innerHTML = (q || []).length
    ? q.map((m) => `<div class="q-row ${m.sent ? "sent" : ""}"><span>${m.sent ? "✓" : "⏳"} ${esc(m.text)}</span>${m.sent ? "" : `<button data-act="unqueue" data-qid="${m.id}" title="Remove">✕</button>`}</div>`).join("")
    : `<p class="muted small">Messages wait here and are sent when the agent is free.</p>`;
}
async function loadQueue(t) {
  try { renderQueue((await api(`/api/tasks/${t.id}/queue`)).queue); } catch {}
}

async function showReceipt(t) {
  const box = $("#info-receipt");
  box.innerHTML = `<span class="spinner"></span>`;
  try {
    const r = await api(`/api/tasks/${t.id}/receipt`);
    const mins = Math.round(r.durationMs / 60000);
    S.lastReceipt = r;
    box.innerHTML = `<div class="receipt">
      <dl class="kv">
        <dt>Duration</dt><dd>${mins} min</dd>
        <dt>Cost</dt><dd>$${r.meter.costUsd.toFixed(4)} · ${fmtK(r.meter.tokensIn)} in · ${fmtK(r.meter.tokensOut)} out · ${r.meter.calls} calls</dd>
        <dt>Files</dt><dd>${r.files.length ? r.files.map((f) => `${esc(f.status)} ${esc(f.path)}`).join("<br>") : "no changes"}</dd>
        <dt>Checkpoints</dt><dd>${r.checkpoints}</dd>
        <dt>Your messages</dt><dd>${r.sent} sent</dd>
        ${r.setup ? `<dt>Setup</dt><dd>${esc(r.setup)}</dd>` : ""}
      </dl>
      ${r.models.length ? `<div class="card-title">Models</div>${table(r.models, ["model", "auth", "calls", "tokens_in", "tokens_out", "cost_usd", "errors"])}` : ""}
      ${r.records.length ? `<div class="card-title">Recorded in memory</div><ul>${r.records.map((x) => `<li><b>${esc(x.kind)}</b>: ${esc(x.title)}</li>`).join("")}</ul>` : ""}
      ${r.alerts.length ? `<div class="card-title">Alerts</div><ul>${r.alerts.map((a) => `<li>${hhmm(a.ts)} · ${esc(a.kind)}: ${esc(a.message)}</li>`).join("")}</ul>` : ""}
      <button data-act="copy-receipt">Copy as Markdown</button></div>`;
  } catch (e) { box.innerHTML = `<p class="muted small">${esc(e.message)}</p>`; }
}
function receiptMarkdown(r) {
  const t = r.task;
  return [`## Task receipt: ${t.title}`, `- Agent: ${t.agent}${t.model ? ` (${t.model})` : ""} · status: ${t.status} · ${Math.round(r.durationMs / 60000)} min`,
    `- Cost: $${r.meter.costUsd.toFixed(4)} · ${r.meter.tokensIn} tokens in · ${r.meter.tokensOut} out · ${r.meter.calls} calls`,
    `- Files: ${r.files.map((f) => `${f.status} ${f.path}`).join(", ") || "none"}`, `- Checkpoints: ${r.checkpoints} · messages sent: ${r.sent}`,
    ...(r.records.length ? ["- Recorded:", ...r.records.map((x) => `  - ${x.kind}: ${x.title}`)] : []),
    ...(r.alerts.length ? ["- Alerts:", ...r.alerts.map((a) => `  - ${a.kind}: ${a.message}`)] : [])].join("\n");
}

async function wave1Act(act, el, t) {
  if (act === "race-judge") { await api(`/api/races/${el.dataset.rid}/judge`, { body: {} }).catch((e) => toast(e.message, "bad")); loadRace(el.dataset.rid); }
  if (act === "race-keep") {
    if (!confirm("Keep this one and remove the other contenders (with their worktrees)?")) return;
    await api(`/api/races/${el.dataset.rid}/keep`, { body: { task: el.dataset.task } }).catch((e) => toast(e.message, "bad"));
    toast("Kept. The other contenders were removed.", "ok");
  }
  if (act === "run-checks") {
    el.disabled = true;
    const r = await api(`/api/tasks/${t.id}/checks`, { body: {} }).catch((err) => toast(err.message, "bad"));
    if (r) toast(r.ok ? `Checks pass (${Math.round(r.ms / 1000)} s)` : `Checks fail (exit ${r.code})`, r.ok ? "ok" : "bad");
    renderInfo();
  }
  if (act === "handoff-now") {
    const r = await api(`/api/tasks/${t.id}/handoff`, { body: {} }).catch((err) => toast(err.message, "bad"));
    if (r) { S.tasks.set(r.id, r); renderBoard(); openTask(r.id); toast(`Handed off to ${r.agent}. It got a briefing of the work so far.`, "ok"); }
  }
  if (act === "open-task") { openTask(el.dataset.id); }
  if (act === "browser-show") await api(`/api/tasks/${t.id}/browser/show`, { body: {} }).catch((err) => toast(err.message, "bad"));
  if (act === "browser-takeover") {
    const r = await api(`/api/tasks/${t.id}/browser/takeover`, { body: {} }).catch((err) => toast(err.message, "bad"));
    if (r) toast("You have the browser. The agent is blocked until you press Resume.", "ok");
  }
  if (act === "browser-resume") {
    const r = await api(`/api/tasks/${t.id}/browser/resume`, { body: {} }).catch((err) => toast(err.message, "bad"));
    if (r) toast("Handed back. The agent gets \"Done, continue\" as soon as it's waiting.", "ok");
  }
  if (act === "cancel-wait") await api(`/api/tasks/${t.id}/cancel-wait`, { body: {} });
  if (act === "rescue") {
    $("#new-task").dataset.parent = t.id;
    $("#nt-prompt").value = `The previous agent (${t.agent}) got stuck on: ${t.title}. Check what it changed, then finish the task.`;
    const other = ["claude", "codex", "opencode"].find((a) => a !== t.agent && S.available?.[a] !== false) ?? "auto";
    $("#nt-agent").value = other;
    document.body.classList.add("menu-open");
    focusNewTask();
    toast(`Prefilled a hand-off to ${other}. The new agent sees this task's memory. Press Start.`);
  }
  if (act === "restore-file" || act === "restore-all") {
    const n = Number(el.dataset.n);
    const path = act === "restore-file" ? el.dataset.path : undefined;
    if (!path && !confirm(`Restore the whole folder to checkpoint #${n}? Files created after it are removed. (A safety checkpoint is taken first.)`)) return;
    const r = await api(`/api/tasks/${t.id}/restore`, { body: { n, path } }).catch((e) => toast(e.message, "bad"));
    if (r) toast(path ? `Restored ${path} from #${n}` : `Folder restored to #${n} (${r.deleted} newer file(s) removed)`, "ok");
    if (path) { const g = S.guards.get(t.id); if (g) g.warnings = g.warnings.filter((w) => w.path !== path); } else S.guards.delete(t.id);
    renderInfo();
  }
  if (act === "unqueue") renderQueue((await api(`/api/tasks/${t.id}/queue/${el.dataset.qid}`, { method: "DELETE" })).queue);
  if (act === "receipt") showReceipt(t);
  if (act === "copy-receipt" && S.lastReceipt) {
    try { await navigator.clipboard.writeText(receiptMarkdown(S.lastReceipt)); toast("Receipt copied", "ok"); } catch { toast("Couldn't copy (clipboard blocked)", "bad"); }
  }
}

// ---- diff comments → agent (P36)
function annotateDiff(text) {
  let file = "";
  let line = 0;
  return text.split("\n").slice(0, 4000).map((l) => {
    const c = l.startsWith("diff --git") ? "f" : l.startsWith("@@") ? "h" : l.startsWith("+") && !l.startsWith("+++") ? "a" : l.startsWith("-") && !l.startsWith("---") ? "d" : "";
    if (c === "f") file = (/ b\/(.+)$/.exec(l) || [])[1] || "";
    if (c === "h") line = Number((/\+(\d+)/.exec(l) || [])[1] || 1) - 1;
    let attrs = "";
    if (c === "a" || (c === "" && l.startsWith(" "))) { line++; attrs = ` data-file="${esc(file)}" data-line="${line}" title="Click to comment to the agent"`; }
    else if (c === "d") attrs = ` data-file="${esc(file)}" data-line="${line}" title="Click to comment to the agent"`;
    return `<div class="${c}${attrs ? " cl" : ""}"${attrs}>${esc(l) || " "}</div>`;
  }).join("");
}
$("#diff").addEventListener("click", (e) => {
  const row = e.target.closest(".diff .cl");
  if (!row || e.target.closest(".comment-row")) return;
  $$("#diff .comment-row").forEach((x) => x.remove());
  row.insertAdjacentHTML("afterend", `<div class="comment-row"><input placeholder="Comment for the agent on ${esc(row.dataset.file)}:${row.dataset.line}…"><button class="primary">Send</button><button data-cancel>✕</button></div>`);
  const box = row.nextElementSibling;
  const input = $("input", box);
  input.focus();
  const send = async () => {
    const text = input.value.trim();
    if (!text) return;
    const t = current();
    const r = await api(`/api/tasks/${t.id}/comment`, { body: { file: row.dataset.file, line: Number(row.dataset.line), text } }).catch((err) => toast(err.message, "bad"));
    if (r) toast(r.queue[0]?.sent ? "Sent to the agent" : "Queued: sent when the agent is free", "ok");
    box.remove();
    if (S.pendingDiff) { const d = S.pendingDiff; S.pendingDiff = null; showDiff(d); }
  };
  $("button.primary", box).onclick = send;
  $("[data-cancel]", box).onclick = () => { box.remove(); if (S.pendingDiff) { const d = S.pendingDiff; S.pendingDiff = null; showDiff(d); } };
  input.onkeydown = (ev) => { if (ev.key === "Enter") send(); if (ev.key === "Escape") $("[data-cancel]", box).click(); };
});
function guardBanner(id) {
  const g = S.guards.get(id);
  return g?.warnings?.length ? `<div class="banner bad">🛡 ${g.warnings.length} file(s) may be damaged: ${g.warnings.map((w) => esc(w.path)).join(", ")}. See <b>Info</b> to restore.</div>` : "";
}

// ---- account profiles (P13)
S.profiles = [];
S.projectProfiles = {};
async function loadProfiles() {
  try {
    const r = await api(`/api/profiles${S.project ? `?project=${encodeURIComponent(S.project)}` : ""}`);
    S.profiles = r.profiles;
    S.projectProfiles = r.projectDefaults || {};
  } catch {}
  renderProfilePicker();
}
function renderProfilePicker() {
  const agent = $("#nt-agent").value;
  const mine = S.profiles.filter((p) => p.agent === agent);
  $("#nt-profile-row").hidden = !mine.length;
  if (!mine.length) return;
  const def = S.projectProfiles[agent] || "";
  $("#nt-profile").innerHTML = `<option value="default">project default${def ? ` (${esc(mine.find((p) => p.id === def)?.name ?? "?")})` : " (normal login)"}</option><option value="">normal login</option>` +
    mine.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
}
$("#nt-agent").addEventListener("change", renderProfilePicker);
// The browser needs a tool connection (MCP): not for Pi / Oh My Pi / Shell.
function browserOption() {
  const off = ["pi", "omp", "shell"].includes($("#nt-agent").value);
  $("#nt-browser").disabled = off;
  $("#nt-browser-wrap").title = off ? "This agent has no tool connection, so it can't use the browser. Pick Claude Code, Codex or OpenCode." : "Give this agent its own window in Netheron's Chrome. It never types passwords or clicks pay/order/buy/delete, and asks you for logins.";
}
$("#nt-agent").addEventListener("change", browserOption);
browserOption();
function renderAccounts() {
  const by = (a) => S.profiles.filter((p) => p.agent === a);
  $("#acct-list").innerHTML = ["claude", "codex", "opencode"].map((a) => `<div class="acct-group"><b>${a}</b>
    ${by(a).length ? by(a).map((p) => `<div class="cp-row"><span>${esc(p.name)}${S.projectProfiles[a] === p.id ? ' <span class="badge">this project</span>' : ""}</span>
      <span><button data-login="${esc(p.id)}">Sign in</button> <button data-default="${esc(p.id)}" data-agent="${a}">${S.projectProfiles[a] === p.id ? "Unset default" : "Use for this project"}</button> <button data-del="${esc(p.id)}" title="Delete">✕</button></span></div>`).join("") : '<p class="muted small">Only the normal login.</p>'}</div>`).join("");
}
$("#acct-btn").onclick = async () => { await loadProfiles(); renderAccounts(); $("#acct-error").textContent = ""; $("#acct-dlg").showModal(); };
$("#acct-add").onclick = async () => {
  try {
    await api("/api/profiles", { body: { agent: $("#acct-agent").value, name: $("#acct-name").value } });
    $("#acct-name").value = "";
    await loadProfiles();
    renderAccounts();
  } catch (e) { $("#acct-error").textContent = e.message; }
};
$("#acct-list").onclick = async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.login) {
    const t = await api(`/api/profiles/${b.dataset.login}/login`, { body: {} }).catch((err) => ($("#acct-error").textContent = err.message));
    if (t?.id) { $("#acct-dlg").close(); S.tasks.set(t.id, t); renderBoard(); openTask(t.id); toast("Finish signing in in this terminal. The login is saved to this profile only.", "ok"); }
  }
  if (b.dataset.default) {
    if (!S.project) return ($("#acct-error").textContent = "Pick a project first.");
    const on = S.projectProfiles[b.dataset.agent] === b.dataset.default;
    await api("/api/profiles/default", { body: { project: S.project, agent: b.dataset.agent, profile: on ? "" : b.dataset.default } });
    await loadProfiles();
    renderAccounts();
  }
  if (b.dataset.del && confirm("Delete this profile and its saved login?")) {
    await api(`/api/profiles/${b.dataset.del}`, { method: "DELETE" });
    await loadProfiles();
    renderAccounts();
  }
};

// ---- remote workers (P25 S2)
S.workers = [];
S.workerTasks = [];
async function loadWorkers() {
  S.workers = await api("/api/workers").catch(() => []);
  const sel = $("#nt-worker");
  $("#nt-worker-wrap").hidden = !S.workers.length;
  sel.innerHTML = `<option value="">this PC</option>` + S.workers.map((w) => `<option value="${w.id}">🖥 ${esc(w.name)}</option>`).join("");
  $("#us-workers").innerHTML = S.workers.length
    ? `<div class="list">${S.workers.map((w) => `<div class="cp-row"><span>🖥 <b>${esc(w.name)}</b> · ${esc(w.url)} · folder <code>${esc(w.folder || "not set")}</code></span><span><button data-wk-folder="${w.id}">Folder…</button><button data-wk-del="${w.id}">✕</button></span></div>`).join("")}</div>`
    : `<p class="muted small">No workers yet.</p>`;
  loadWorkerTasks();
}
async function loadWorkerTasks() {
  S.workerTasks = await Promise.all(S.workers.map((w) => api(`/api/workers/${w.id}/tasks`).catch((e) => ({ worker: w, online: false, tasks: [], error: e.message }))));
  renderBoard();
}
setInterval(() => { if (S.workers.length && !document.hidden) loadWorkerTasks(); }, 10_000);
$("#us-workers").onclick = async (e) => {
  const del = e.target.dataset.wkDel;
  const fol = e.target.dataset.wkFolder;
  if (del) { await api(`/api/workers/${del}`, { method: "DELETE" }); return loadWorkers(); }
  if (fol) {
    const w = S.workers.find((x) => x.id === fol);
    const v = prompt(`Project folder on ${w.name} (a path on that machine):`, w.folder);
    if (v === null) return;
    await api(`/api/workers/${fol}/folder`, { body: { folder: v } }).catch((err) => toast(err.message, "bad"));
    loadWorkers();
  }
};
$("#us-worker-form").onsubmit = (e) => {
  e.preventDefault();
  busy(e.submitter, async () => {
    const w = await api("/api/workers", { body: { name: $("#wk-name").value, link: $("#wk-link").value, folder: $("#wk-folder").value } });
    $("#wk-name").value = $("#wk-link").value = $("#wk-folder").value = "";
    toast(`Connected to ${w.name}.`, "ok");
    loadWorkers();
  });
};

// ---- quality watch (P01)
async function loadQuality() {
  const box = $("#us-quality");
  if (!box) return;
  if (!S.project) return (box.innerHTML = `<p class="muted small">Pick a project first.</p>`);
  try {
    const q = await api(`/api/quality?project=${encodeURIComponent(S.project)}`);
    box.innerHTML = (q.scores.length
      ? `<table class="grid"><tr><th>Model</th><th>Runs</th><th>Pass rate</th><th>Last 5</th><th>Before</th></tr>${q.scores.map((s) => `<tr><td>${esc(s.agent)}${s.model ? " " + esc(s.model) : ""}</td><td>${s.runs}</td><td>${Math.round(s.passRate * 100)}%</td><td>${Math.round(s.recent * 100)}%</td><td>${s.previous === null ? "–" : Math.round(s.previous * 100) + "%"}${s.previous !== null && s.recent <= s.previous - 0.3 ? ' <span class="s-failed">▼</span>' : ""}</td></tr>`).join("")}</table>`
      : `<p class="muted small">No results yet.</p>`) +
      (q.evals.length ? `<div class="list">${q.evals.map((e) => `<div class="cp-row"><span>🧪 <b>${esc(e.title)}</b> · <code>${esc(e.verify)}</code></span><button data-del-eval="${e.id}">✕</button></div>`).join("")}</div>` : `<p class="muted small">No evals yet. Add one below.</p>`);
  } catch (e) { box.innerHTML = `<p class="muted small">${esc(e.message)}</p>`; }
}
$("#us-quality").onclick = async (e) => {
  const id = e.target.dataset.delEval;
  if (!id) return;
  await api(`/api/quality/evals/${id}`, { method: "DELETE" });
  loadQuality();
};
$("#us-eval-form").onsubmit = async (e) => {
  e.preventDefault();
  if (!S.project) return toast("Pick a project first.", "bad");
  try {
    await api("/api/quality/evals", { body: { project: S.project, title: $("#ev-title").value, prompt: $("#ev-prompt").value, verify: $("#ev-verify").value } });
    $("#ev-title").value = $("#ev-prompt").value = $("#ev-verify").value = "";
    loadQuality();
  } catch (err) { toast(err.message, "bad"); }
};
$("#ev-run").onclick = async () => {
  if (!S.project) return toast("Pick a project first.", "bad");
  if (!confirm("Run every eval on every available model now? This uses your subscription quota.")) return;
  const r = await api("/api/quality/run", { body: { project: S.project } }).catch((err) => toast(err.message, "bad"));
  if (r) toast(`Quality watch started: ${r.races.length} eval(s). Results appear here when judged.`, "ok");
};

// ---- Night Shift (P23)
S.schedule = [];
async function loadSchedule() {
  try { S.schedule = (await api("/api/schedule")).schedule; renderBoard(); } catch {}
}
$("#nt-when").onchange = () => {
  const v = $("#nt-when").value;
  $("#nt-at").hidden = v !== "at";
  $("#nt-daily-wrap").hidden = v === "now";
  $("#nt-start").textContent = v === "now" ? "▶ Start" : "▶ Schedule";
  wizSummary();
};
$("#board").addEventListener("click", async (e) => {
  const sid = e.target.dataset?.unschedule;
  if (!sid) return;
  e.stopPropagation();
  S.schedule = (await api(`/api/schedule/${sid}`, { method: "DELETE" })).schedule;
  renderBoard();
});
async function loadBrief() {
  const box = $("#us-brief");
  if (!box) return;
  try {
    const r = await api(`/api/brief?hours=${$("#us-brief-hours").value}`);
    box.innerHTML = r.tasks.length
      ? `<div class="list">${r.tasks.map((t) => `<div class="brief-row"><span class="s-${esc(t.status)}">●</span> <b>${esc(t.title)}</b> · ${esc(t.agent)}${t.model ? " " + esc(t.model) : ""} · ${esc(t.status)}${t.handoffTo ? " · handed off" : ""} · $${t.costUsd.toFixed(2)}${t.checks ? ` · checks ${esc(t.checks)}` : ""}${t.alerts.length ? `<div class="muted small">${t.alerts.map(esc).join("<br>")}</div>` : ""} <a href="#" data-open="${esc(t.id)}">open</a></div>`).join("")}</div>`
      : `<p class="muted small">Nothing ran in this period.</p>`;
  } catch (e) { box.innerHTML = `<p class="muted small">${esc(e.message)}</p>`; }
}
$("#us-brief-hours").onchange = loadBrief;
$("#us-brief").onclick = (e) => {
  const id = e.target.dataset.open;
  if (!id) return;
  e.preventDefault();
  showView("workspace");
  openTask(id);
};

// ---- worktree setup recipe (P35)
$("#nt-setup").onclick = async () => {
  if (!S.project) return toast("Pick a project folder first.", "bad");
  try {
    const r = await api(`/api/projects/setup?path=${encodeURIComponent(S.project)}`);
    $("#setup-copy").value = (r.copy || []).join("\n");
    $("#setup-link").value = (r.link || []).join("\n");
    $("#setup-run").value = r.run || "";
    $("#setup-verify").value = r.verify || "";
    $("#setup-auto").hidden = !r.auto;
    $("#setup-project").textContent = S.project;
    $("#setup-dlg").showModal();
  } catch (e) { toast(e.message, "bad"); }
};
$("#setup-save").onclick = async () => {
  try {
    await api("/api/projects/setup", { body: { path: S.project, copy: $("#setup-copy").value, link: $("#setup-link").value, run: $("#setup-run").value, verify: $("#setup-verify").value } });
    $("#setup-dlg").close();
    toast("Worktree setup saved for this project", "ok");
  } catch (e) { $("#setup-error").textContent = e.message; }
};

// ---- alerts in the Usage view (P07/P08)
function renderAlerts() {
  const box = $("#us-alerts");
  if (!box) return;
  box.innerHTML = S.alerts.length
    ? `<div class="list">${S.alerts.slice(0, 50).map((a) => `<div class="alert-row k-${esc(a.kind)}"><span class="badge">${esc(a.kind)}</span> ${hhmm(a.ts)} · ${esc(a.message)}${a.task && S.tasks.get(a.task) ? ` <a href="#" data-open="${esc(a.task)}">${esc(S.tasks.get(a.task).title)}</a>` : ""}</div>`).join("")}</div>`
    : `<p class="muted small">No alerts. Netheron watches for fast spending, cache drops, API-key billing and rate limits.</p>`;
}
$("#us-alerts").onclick = (e) => {
  const id = e.target.dataset.open;
  if (!id) return;
  e.preventDefault();
  showView("workspace");
  openTask(id);
};

// ---------------------------------------------------------------- code mode: VS Code-style (files | editor tabs, agent terminal below)
S.mode = store.get("mode", "term");
const C = {
  editor: null,
  loading: null,
  taskId: null,
  st: null, // editor state of the task on screen
  byTask: new Map(), // taskId -> { open: Map(path -> file), order: [paths], active, expanded: Set, filesKey }
  termH: store.get("termH", 0.35),
};
const activeFile = () => C.st?.open.get(C.st.active);
function taskState(id) {
  let st = C.byTask.get(id);
  if (!st) C.byTask.set(id, (st = { open: new Map(), order: [], active: null, expanded: new Set(), filesKey: "" }));
  return st;
}
function dropTaskState(id) {
  const st = C.byTask.get(id);
  if (!st) return;
  for (const f of st.open.values()) f.model.dispose();
  C.byTask.delete(id);
  if (C.taskId === id) { C.taskId = null; C.st = null; }
}
function loadMonaco() {
  return (C.loading ??= new Promise((ok, bad) => {
    const s = document.createElement("script");
    s.src = "/vendor/monaco/vs/loader.js";
    s.onload = () => {
      window.require.config({ paths: { vs: "/vendor/monaco/vs" } });
      window.require(["vs/editor/editor.main"], () => ok(window.monaco), bad);
    };
    s.onerror = () => bad(new Error("Couldn't load the editor (Monaco)."));
    document.head.append(s);
  }));
}
async function ensureEditor() {
  const monaco = await loadMonaco();
  if (C.editor) return monaco;
  const light = matchMedia("(prefers-color-scheme: light)").matches;
  C.editor = monaco.editor.create($("#code-editor"), {
    theme: light ? "vs" : "vs-dark", automaticLayout: true, minimap: { enabled: true }, fontSize: 13,
    scrollBeyondLastLine: false, smoothScrolling: true, cursorSmoothCaretAnimation: "on", padding: { top: 8 },
  });
  C.editor.onDidChangeModelContent(() => {
    const f = activeFile();
    if (!f) return;
    const dirty = f.model.getValue() !== f.saved;
    if (dirty !== f.dirty) { f.dirty = dirty; renderFileTabs(); }
  });
  C.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveFile());
  return monaco;
}

// Hide the task list / right panel to give the editor room. Remembered separately for each mode;
// code mode starts with the right panel hidden.
function sideHidden(which) {
  return store.get(`hide.${S.mode}.${which}`, S.mode === "code" && which === "right");
}
function applySides() {
  document.body.classList.toggle("hide-side", sideHidden("side"));
  document.body.classList.toggle("hide-right", sideHidden("right"));
}
function toggleSide(which) {
  store.set(`hide.${S.mode}.${which}`, !sideHidden(which));
  applySides();
  renderTabs();
  requestAnimationFrame(fitAll);
}
function setMode(m) {
  S.mode = m;
  store.set("mode", m);
  applySides();
  renderTabs();
  renderPanes();
  syncRight();
}
// Called by renderPanes in code mode. Returns false when there's no task to show (falls back to the empty state).
function renderIde() {
  const t = current() ?? S.tasks.get(S.panes.find(Boolean));
  if (!t) return false;
  $("#ide-term").replaceChildren(termFor(t.id).el);
  $("#ide-term-title").textContent = `${t.agent} · ${t.title}`;
  applyTermHeight();
  if (C.taskId !== t.id) {
    const f = activeFile();
    if (f && C.editor) f.view = C.editor.saveViewState();
    C.taskId = t.id;
    C.st = taskState(t.id);
    $("#code-tree").innerHTML = "";
    loadLevel($("#code-tree"), "", 0);
    showActive();
  } else checkAllDisk();
  return true;
}

// ----- file tree
async function loadLevel(box, dir, depth) {
  const id = C.taskId;
  if (!box.children.length) box.innerHTML = `<span class="spinner"></span>`;
  try {
    const r = await api(`/api/tasks/${id}/files?dir=${encodeURIComponent(dir)}`);
    if (id !== C.taskId) return;
    const pad = `style="padding-left:${8 + depth * 12}px"`;
    box.innerHTML = r.dirs.map((d) => `<div class="item" data-dir="${esc(d.path)}" data-depth="${depth}" ${pad}><span class="ch">›</span>${esc(d.name)}</div><div class="kids" hidden></div>`).join("") +
      r.files.map((f) => `<div class="item file ${f.path === C.st.active ? "open" : ""}" data-file="${esc(f.path)}" ${pad}><span class="ch"></span>${esc(f.name)}</div>`).join("") ||
      `<p class="muted small" ${pad}>Empty</p>`;
    for (const it of box.querySelectorAll(":scope > .item[data-dir]")) if (C.st.expanded.has(it.dataset.dir)) toggleDir(it, true);
  } catch (e) {
    box.innerHTML = `<p class="muted small">${esc(/not found/.test(e.message) ? "The Netheron server is older than this page. Restart it (close the start-netheron window and open it again)." : e.message)}</p>`;
  }
}
function toggleDir(it, open) {
  const kids = it.nextElementSibling;
  kids.hidden = !open;
  it.classList.toggle("expanded", open);
  C.st.expanded[open ? "add" : "delete"](it.dataset.dir);
  if (open && !kids.dataset.loaded) {
    kids.dataset.loaded = "1";
    loadLevel(kids, it.dataset.dir, Number(it.dataset.depth) + 1);
  }
}
$("#code-tree").onclick = (e) => {
  const it = e.target.closest(".item");
  if (!it) return;
  if (it.dataset.file) {
    openFile(it.dataset.file);
    document.body.classList.remove("show-files");
  } else toggleDir(it, it.nextElementSibling.hidden);
};

// ----- editor tabs
function renderFileTabs() {
  const st = C.st;
  $("#code-tabs").innerHTML = (st?.order ?? []).map((p) => {
    const f = st.open.get(p);
    return `<div class="ftab ${p === st.active ? "active" : ""} ${f.dirty ? "dirty" : ""}" data-path="${esc(p)}" title="${esc(p)}">
      <span class="name">${esc(p.split("/").pop())}</span><span class="x" data-close="${esc(p)}" title="Close"></span></div>`;
  }).join("");
  const f = activeFile();
  $("#code-save").disabled = !f?.dirty;
  $("#code-crumbs").textContent = f ? st.active.split("/").join("  ›  ") : "";
  $$("#code-tree .item.file").forEach((x) => x.classList.toggle("open", x.dataset.file === st?.active));
}
$("#code-tabs").onclick = (e) => {
  if (e.target.dataset.close) return closeFile(e.target.dataset.close);
  const t = e.target.closest(".ftab");
  if (t) switchTo(t.dataset.path);
};
$("#code-tabs").onauxclick = (e) => { // middle-click closes, like VS Code
  const t = e.target.closest(".ftab");
  if (t && e.button === 1) closeFile(t.dataset.path);
};
$("#code-files-btn").onclick = () => document.body.classList.toggle("show-files");
$("#code-save").onclick = () => saveFile();
// LSP-lite (P32): problems from the project's checker, shown as editor markers + a clickable list.
C.diags = [];
function applyMarkers() {
  if (!window.monaco || !C.st) return;
  for (const [path, f] of C.st.open) {
    const marks = C.diags.filter((d) => d.file === path).map((d) => ({
      startLineNumber: d.line, endLineNumber: d.line, startColumn: d.col, endColumn: d.col + 200,
      message: d.message, severity: d.severity === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
    }));
    monaco.editor.setModelMarkers(f.model, "netheron", marks);
  }
}
$("#code-check").onclick = async () => {
  if (!C.taskId) return;
  const b = $("#code-check");
  b.disabled = true;
  b.innerHTML = '<span class="spinner"></span>';
  try {
    const r = await api(`/api/tasks/${C.taskId}/diagnostics`, { body: {} });
    C.diags = r.items;
    const bar = $("#code-diag");
    bar.hidden = false;
    bar.innerHTML = !r.cmd ? "No type checker or linter found (set a checks command in ⚙ Worktree setup)."
      : r.items.length ? `<b>${r.items.length} problem(s)</b> · <code>${esc(r.cmd)}</code> · ${r.items.slice(0, 30).map((d, i) => `<a href="#" data-diag="${i}" class="${d.severity}">${esc(d.file)}:${d.line}</a>`).join(" ")}`
      : `✓ No problems · <code>${esc(r.cmd)}</code>`;
    applyMarkers();
  } catch (e) { toast(e.message, "bad"); }
  b.disabled = false;
  b.textContent = "Check code";
};
$("#code-diag").onclick = async (e) => {
  const i = e.target.dataset.diag;
  if (i === undefined) return;
  e.preventDefault();
  const d = C.diags[Number(i)];
  await openFile(d.file);
  applyMarkers();
  C.editor?.revealLineInCenter(d.line);
  C.editor?.setPosition({ lineNumber: d.line, column: d.col });
};
$("#code-keep").onclick = () => saveFile(true);
$("#code-reload").onclick = () => { const f = activeFile(); if (f?.disk) applyDisk(f, f.disk); };

function switchTo(path) {
  const cur = activeFile();
  if (cur && C.editor) cur.view = C.editor.saveViewState();
  C.st.active = path;
  showActive();
}
async function showActive() {
  renderFileTabs();
  const f = activeFile();
  $("#code-empty").hidden = !!f;
  $("#code-conflict").hidden = !f?.disk;
  if (!f) return C.editor?.setModel(null);
  await ensureEditor();
  C.editor.setModel(f.model);
  if (f.view) C.editor.restoreViewState(f.view);
  C.editor.focus();
}
async function openFile(path) {
  const st = C.st;
  if (!st.open.has(path)) {
    let data, monaco;
    try {
      [data, monaco] = await Promise.all([api(`/api/tasks/${C.taskId}/file?path=${encodeURIComponent(path)}`), ensureEditor()]);
    } catch (e) {
      return toast(e.message, "bad");
    }
    if (st !== C.st) return;
    if (!st.open.has(path)) {
      // Language comes from the extension in the model's URI.
      const uri = monaco.Uri.parse(`file:///${C.taskId}/${path.split("/").map(encodeURIComponent).join("/")}`);
      const model = monaco.editor.getModel(uri) ?? monaco.editor.createModel(data.content, undefined, uri);
      st.open.set(path, { model, hash: data.hash, saved: data.content, dirty: false, disk: null, view: null });
      st.order.push(path);
    }
  }
  switchTo(path);
}
function closeFile(path) {
  const st = C.st;
  const f = st.open.get(path);
  if (!f) return;
  if (f.dirty && !confirm(`${path} has unsaved changes. Close anyway?`)) return;
  const i = st.order.indexOf(path);
  st.order.splice(i, 1);
  st.open.delete(path);
  if (st.active === path) st.active = st.order[Math.min(i, st.order.length - 1)] ?? null;
  if (C.editor?.getModel() === f.model) C.editor.setModel(null);
  f.model.dispose();
  showActive();
}
async function saveFile(force = false) {
  const f = activeFile();
  if (!f) return;
  const path = C.st.active;
  const content = f.model.getValue();
  try {
    const r = await api(`/api/tasks/${C.taskId}/file`, { body: { path, content, baseHash: f.hash, force } });
    Object.assign(f, { hash: r.hash, saved: content, dirty: f.model.getValue() !== content, disk: null });
    $("#code-conflict").hidden = true;
    renderFileTabs();
  } catch (e) {
    if (/changed on disk/.test(e.message)) {
      f.disk = await api(`/api/tasks/${C.taskId}/file?path=${encodeURIComponent(path)}`).catch(() => null);
      $("#code-conflict").hidden = false;
    } else toast(e.message, "bad");
  }
}
function applyDisk(f, data) {
  const active = f === activeFile();
  const view = active && C.editor ? C.editor.saveViewState() : null;
  f.model.setValue(data.content);
  if (view) C.editor.restoreViewState(view);
  Object.assign(f, { hash: data.hash, saved: data.content, dirty: false, disk: null });
  if (active) $("#code-conflict").hidden = true;
  renderFileTabs();
}
// Live: an agent changed open files. Reload clean ones quietly; for ones you're editing, offer a choice.
async function checkAllDisk() {
  const st = C.st;
  if (!st) return;
  for (const [path, f] of st.open) {
    let data;
    try { data = await api(`/api/tasks/${C.taskId}/file?path=${encodeURIComponent(path)}`); } catch { continue; }
    if (data.hash === f.hash || st !== C.st) continue;
    if (f.dirty) {
      f.disk = data;
      if (f === activeFile()) $("#code-conflict").hidden = false;
    } else applyDisk(f, data);
  }
}
function codeOnDiff(m) {
  if (S.mode !== "code" || m.id !== C.taskId || !C.st) return;
  checkAllDisk();
  // Files added or deleted: reload the tree, keeping open folders open.
  const key = m.files.map((f) => f.status + f.path).sort().join("|");
  if (key !== C.st.filesKey) {
    if (C.st.filesKey) loadLevel($("#code-tree"), "", 0);
    C.st.filesKey = key;
  }
}

// ----- terminal panel under the editor: drag the bar to resize, click the title to fold it
function applyTermHeight() {
  $("#ide-term-wrap").style.height = `${Math.round(C.termH * 100)}%`;
}
$("#ide-drag").onpointerdown = (e) => {
  if (e.target.closest("button")) return;
  e.preventDefault();
  const box = $("#ide-main").getBoundingClientRect();
  const bar = e.currentTarget;
  bar.setPointerCapture(e.pointerId);
  document.body.classList.add("dragging");
  bar.onpointermove = (ev) => {
    C.termH = Math.min(0.85, Math.max(0.06, (box.bottom - ev.clientY) / box.height));
    applyTermHeight();
  };
  bar.onpointerup = () => {
    bar.onpointermove = bar.onpointerup = null;
    document.body.classList.remove("dragging");
    store.set("termH", C.termH);
    fitAll();
  };
};
$("#ide-term-toggle").onclick = () => {
  if (C.termH > 0.1) {
    store.set("termHOpen", C.termH);
    C.termH = 0.06;
  } else C.termH = store.get("termHOpen", 0.35);
  store.set("termH", C.termH);
  applyTermHeight();
  requestAnimationFrame(fitAll);
};

// ----- "restart Netheron" banner: the page is newer than the running server
async function checkServerVersion() {
  let stale = false;
  try { stale = (await api("/api/version")).stale; } catch (e) { stale = /not found|404/.test(e.message); }
  $("#stale").hidden = !stale;
}
setInterval(checkServerVersion, 60_000);
applySides();

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
    focusNewTask();
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
  S.alerts = (await api(`/api/alerts?hours=${$("#us-hours").value}`).catch(() => ({ alerts: [] }))).alerts;
  renderAlerts();
  loadBrief();
  loadQuality();
}
$("#us-hours").onchange = loadUsage;

// ---------------------------------------------------------------- boot
async function boot() {
  const st = await api("/api/state");
  S.projects = st.projects;
  S.available = st.availability;
  S.previewPort = st.previewPort ?? 4143;
  if (!S.project && st.projects[0]) S.project = st.projects[0];
  for (const t of st.tasks) S.tasks.set(t.id, t);
  S.open = S.open.filter((id) => S.tasks.has(id));
  S.panes = S.panes.map((id) => (id && S.tasks.has(id) ? id : null));
  renderProjects();
  loadRemote();
  loadProfiles();
  renderBoard();
  renderTabs();
  renderPanes();
  renderInfo();
  const pv = store.get("pvport", "");
  if (pv) $("#pv-port").value = pv;
  const missing = Object.entries(st.availability).filter(([k, v]) => !v && !["openrouter", "pi", "omp"].includes(k)).map(([k]) => k);
  if (missing.length) toast(`Not available on this machine: ${missing.join(", ")}`);
  connect();
  loadWorkers();
  const hashTask = /^#task=(.+)$/.exec(location.hash)?.[1];
  showView(hashTask && S.tasks.has(hashTask) ? "workspace" : "home");
  if (hashTask && S.tasks.has(hashTask)) openTask(hashTask);
  wizGo(1);
}
boot().catch((e) => toast(e.message, "bad"));
