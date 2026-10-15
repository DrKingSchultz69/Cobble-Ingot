/* @ds-bundle: {"format":4,"namespace":"Lattice","components":[{"name":"LatticeField"},{"name":"Button"},{"name":"StatusChip"}]} */
/* Netheron Lattice: a drifting network of nodes that reaches for the pointer and carries red pulses,
   magnetic buttons, and a status chip. Original code, free to use. No libraries, no network. */
(function () {
  "use strict";

  function rgba(hex, a) {
    var h = String(hex).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h.slice(0, 6), 16);
    if (isNaN(n)) return "rgba(128,128,128," + a + ")";
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }

  function readColors(el) {
    var cs = getComputedStyle(el);
    var get = function (n, d) { return cs.getPropertyValue(n).trim() || d; };
    return { bg: get("--bg", "#0a0a0b"), line: get("--line", "#2b2b30"), node: get("--node", "#5a5a63"), deep: get("--accent-deep", "#4a0d14"), accent: get("--accent", "#e11d2e"), hot: get("--accent-hot", "#ffb3bb") };
  }

  var reduceMQ = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  /**
   * Lattice.flow(canvas, options): nodes drift and link to their neighbours. Near the pointer they light up
   * and reach for it; a press fires a red pulse that hops outward link by link. With no one around, a pulse
   * fires on its own every few seconds.
   * options: density (0.3–2, default 1), link (max link length px, default 120), radius (pointer reach px,
   *          default 170), hop (ms per link, default 110), auto (seconds between idle pulses, 0 = off, default 6),
   *          seed (default 7), interactive (default true), still (one frame, no motion).
   * Returns { start(), stop(), destroy(), pulse(x?, y?) }. Pauses when hidden or off screen; honours reduced motion.
   */
  function flow(canvas, options) {
    var o = Object.assign({ density: 1, link: 120, radius: 170, hop: 110, auto: 6, seed: 7, interactive: true, still: false }, options || {});
    var ctx = canvas.getContext("2d");
    var host = canvas.parentElement || canvas;
    var w = 0, h = 0, raf = 0, running = false, frame = 0, now = 0, last = 0, lastPulse = 0, lastTouch = -1e9;
    lastPulse = 1.2 - o.auto; // the first idle pulse comes soon after it appears
    var N = []; // nodes: { x, y, vx, vy, glow, fire }
    var waves = []; // pulses: { t0, hops: Int16Array per node }
    var c = readColors(canvas);
    var ptr = { x: -1e5, y: -1e5 };
    var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(o.seed * 7919 + 1);

    function size() {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.max(18, Math.min(240, Math.round(w * h / 4200 * o.density)));
      N = []; waves = [];
      for (var i = 0; i < n; i++) {
        var a = rnd() * 6.283, s = 0.08 + rnd() * 0.16;
        N.push({ x: rnd() * w, y: rnd() * h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, glow: 0, fire: 0 });
      }
    }

    function nearest(x, y) {
      var best = 0, bd = 1e12;
      for (var i = 0; i < N.length; i++) { var dx = N[i].x - x, dy = N[i].y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
      return best;
    }

    // A pulse: hop counts from the source over the links as they are right now (breadth first, 9 hops at most).
    function pulse(x, y) {
      if (!N.length) return;
      var src = x == null ? Math.floor(rnd() * N.length) : nearest(x, y);
      var hops = new Int16Array(N.length).fill(-1), q = [src], L2 = o.link * o.link;
      hops[src] = 0;
      while (q.length) {
        var a = q.shift();
        if (hops[a] >= 9) continue;
        for (var b = 0; b < N.length; b++) {
          if (hops[b] !== -1) continue;
          var dx = N[a].x - N[b].x, dy = N[a].y - N[b].y;
          if (dx * dx + dy * dy < L2) { hops[b] = hops[a] + 1; q.push(b); }
        }
      }
      waves.push({ t0: now, hops: hops });
      if (waves.length > 4) waves.shift();
      lastPulse = now;
    }

    function draw() {
      if (++frame % 30 === 0) c = readColors(canvas);
      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, w, h);
      var R = o.radius, L = o.link, hop = o.hop / 1000, i, j, a, b, dx, dy, d;

      // pulse progress: each node fires when the wave front reaches it
      for (var k = waves.length - 1; k >= 0; k--) {
        var wv = waves[k], front = (now - wv.t0) / hop, done = true;
        for (i = 0; i < N.length; i++) {
          var hp = wv.hops[i];
          if (hp < 0) continue;
          if (front >= hp && front < hp + 1) N[i].fire = Math.max(N[i].fire, 1 - (front - hp));
          if (front < hp + 1) done = false;
        }
        if (done && front > 12) waves.splice(k, 1);
      }

      // links, bucketed by strength so each colour is one stroke
      var rest = [[], [], []], lit = [[], [], []];
      for (i = 0; i < N.length; i++) {
        a = N[i];
        for (j = i + 1; j < N.length; j++) {
          b = N[j]; dx = a.x - b.x; dy = a.y - b.y;
          if (Math.abs(dx) > L || Math.abs(dy) > L) continue;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d > L) continue;
          var s = 1 - d / L, heat = Math.max(Math.min(a.glow, b.glow), Math.min(a.fire, b.fire) * 1.5);
          var lv = s > 0.66 ? 2 : s > 0.33 ? 1 : 0;
          (heat > 0.15 ? lit : rest)[lv].push(a.x, a.y, b.x, b.y);
        }
      }
      ctx.lineWidth = 1;
      for (var lv2 = 0; lv2 < 3; lv2++) {
        stroke(rest[lv2], rgba(c.node, 0.22 + lv2 * 0.22));
        stroke(lit[lv2], rgba(c.accent, 0.35 + lv2 * 0.3));
      }

      // the pointer's own links: nodes in reach connect to it
      if (ptr.x > -1e4) {
        var reach = [];
        for (i = 0; i < N.length; i++) {
          dx = N[i].x - ptr.x; dy = N[i].y - ptr.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < R * 0.75) reach.push(N[i].x, N[i].y, ptr.x, ptr.y);
        }
        stroke(reach, rgba(c.accent, 0.55));
      }

      // pulse heads: a bright dot with a short tail travelling along each link it is crossing
      var tails = [];
      ctx.fillStyle = c.hot;
      ctx.beginPath();
      for (k = 0; k < waves.length; k++) {
        var wv2 = waves[k], fr = (now - wv2.t0) / hop;
        for (i = 0; i < N.length; i++) {
          var hi = wv2.hops[i];
          if (hi < 0 || fr < hi || fr >= hi + 1) continue;
          for (j = 0; j < N.length; j++) {
            if (wv2.hops[j] !== hi + 1) continue;
            dx = N[j].x - N[i].x; dy = N[j].y - N[i].y;
            if (dx * dx + dy * dy > L * L) continue;
            var p = fr - hi, px = N[i].x + dx * p, py = N[i].y + dy * p;
            ctx.moveTo(px + 3, py); ctx.arc(px, py, 3, 0, 6.2832);
            tails.push(N[i].x + dx * Math.max(0, p - 0.45), N[i].y + dy * Math.max(0, p - 0.45), px, py);
          }
        }
      }
      ctx.fill();
      ctx.lineWidth = 2; stroke(tails, c.hot); ctx.lineWidth = 1;

      // nodes
      for (i = 0; i < N.length; i++) {
        a = N[i];
        var g = Math.max(a.glow, a.fire), r = 1.6 + g * 2.4;
        ctx.fillStyle = g > 0.6 ? c.hot : g > 0.15 ? c.accent : c.node;
        ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, 6.2832); ctx.fill();
        if (a.fire > 0.5) { ctx.strokeStyle = rgba(c.accent, a.fire - 0.5); ctx.beginPath(); ctx.arc(a.x, a.y, r + 6 * (1 - a.fire) + 3, 0, 6.2832); ctx.stroke(); }
      }
    }

    function stroke(seg, color) {
      if (!seg.length) return;
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (var m = 0; m < seg.length; m += 4) { ctx.moveTo(seg[m], seg[m + 1]); ctx.lineTo(seg[m + 2], seg[m + 3]); }
      ctx.stroke();
    }

    function move(dt) {
      var R = o.radius;
      for (var i = 0; i < N.length; i++) {
        var a = N[i];
        a.x += a.vx * dt * 60; a.y += a.vy * dt * 60;
        if (a.x < 0 || a.x > w) { a.vx *= -1; a.x = Math.max(0, Math.min(w, a.x)); }
        if (a.y < 0 || a.y > h) { a.vy *= -1; a.y = Math.max(0, Math.min(h, a.y)); }
        var dx = ptr.x - a.x, dy = ptr.y - a.y, d = Math.sqrt(dx * dx + dy * dy), target = 0;
        if (d < R) { target = 1 - d / R; var pull = target * 0.012 * dt * 60; a.x += dx * pull; a.y += dy * pull; }
        a.glow += (target - a.glow) * Math.min(1, dt * 8);
        a.fire = Math.max(0, a.fire - dt * 0.9); // lit links keep an afterglow for about a second
      }
    }

    function loop(ts) {
      if (!running) return;
      var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts; now += dt;
      if (o.auto > 0 && now - lastPulse > o.auto && now - lastTouch > 3) pulse();
      move(dt); draw();
      raf = requestAnimationFrame(loop);
    }
    function start() { if (running || o.still || reduceMQ.matches) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    function local(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function onMove(e) { var p = local(e); ptr.x = p.x; ptr.y = p.y; lastTouch = now; }
    function onLeave() { ptr.x = ptr.y = -1e5; }
    function onDown(e) {
      if (e.target.closest && e.target.closest("button, a, input, textarea, select, [role=button]")) return;
      var p = local(e); lastTouch = now; pulse(p.x, p.y);
    }

    size(); draw();
    if (o.interactive) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("pointerdown", onDown);
    }
    var visible = true;
    var ro = new ResizeObserver(function () { size(); draw(); });
    ro.observe(canvas);
    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !document.hidden) start(); else stop(); });
    io.observe(canvas);
    var onVis = function () { if (document.hidden) stop(); else if (visible) start(); };
    document.addEventListener("visibilitychange", onVis);
    start();
    return {
      start: start, stop: stop, pulse: pulse,
      destroy: function () {
        stop(); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
        host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave); host.removeEventListener("pointerdown", onDown);
      }
    };
  }

  /**
   * Lattice.magnetic(root?): .lt-mag elements under root (default document) lean a few px toward the
   * pointer while it is over them. Off under reduced motion. Returns an off() function.
   */
  function magnetic(root) {
    root = root || document;
    var cur = null;
    function reset(el) { if (el) el.style.transform = ""; }
    function onMove(e) {
      if (reduceMQ.matches) return;
      var el = e.target.closest && e.target.closest(".lt-mag");
      if (el !== cur) { reset(cur); cur = el; }
      if (!el || el.disabled) return;
      var r = el.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.transform = "translate(" + (dx * 4).toFixed(1) + "px," + (dy * 3).toFixed(1) + "px)";
    }
    function onOut(e) { if (cur && !cur.contains(e.relatedTarget)) { reset(cur); cur = null; } }
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerout", onOut);
    return function off() { root.removeEventListener("pointermove", onMove); root.removeEventListener("pointerout", onOut); reset(cur); };
  }

  var GLYPH = { starting: "◌", running: "●", idle: "◆", done: "✓", failed: "✕", stopped: "■" };
  /** Lattice.status(state, word?): HTML for a status chip: glyph + colour + word. */
  function status(state, word) {
    var s = GLYPH[state] ? state : "running";
    var w = String(word || s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; });
    return '<span class="lt-status" data-s="' + s + '"><span class="lt-status__g" aria-hidden="true">' + GLYPH[s] + "</span>" + w + "</span>";
  }

  window.Lattice = { flow: flow, magnetic: magnetic, status: status, glyphs: GLYPH };
})();
