// TrialOutlook preliminary results: dot plot of the reasoning expert's forecasts for the adjudicated trials.
// Each dot is a trial at its forecast probability; successes stack above the axis and failures below it.
// A filled dot is a correct call at 0.5 and a hollow dot an incorrect one.

(async function () {
  const host = document.getElementById("dots");
  if (!host) return;
  const rows = (await loadJSON("data/readouts.json")).filter((r) => r.score != null);
  const NS = "http://www.w3.org/2000/svg";
  const COL = { success: "#4A7FB5", failure: "#C96442" };
  const tip = document.createElement("div");
  tip.className = "tip";
  document.body.appendChild(tip);
  const el = (name, attrs, parent) => {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  let pts = [];

  function render() {
    const W = host.clientWidth;
    if (!W) return;
    const gut = W < 480 ? 62 : 84, padR = 10, plotW = W - gut - padR;
    const bw = plotW >= 520 ? 0.025 : 0.05;                 // bin width in probability
    const pitch = plotW * bw, r = Math.min(6, pitch / 2 - 1.2), step = 2 * r + 2;
    const x = (p) => gut + p * plotW;
    const stacks = { success: {}, failure: {} };
    const dots = rows.slice().sort((a, b) => a.score - b.score).map((d) => {
      const bin = Math.min(Math.floor(d.score / bw), Math.round(1 / bw) - 1);
      const s = stacks[d.outcome];
      s[bin] = (s[bin] || 0) + 1;
      return { d, bin, k: s[bin] - 1 };
    });
    const tallest = (o) => Math.max(1, ...Object.values(stacks[o]));
    const top = 22, hS = tallest("success") * step + 6, hF = tallest("failure") * step + 6;
    const axisY = top + hS, H = axisY + hF + 34;
    host.textContent = "";
    const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img",
      "aria-label": "Forecast probabilities of the 69 adjudicated trials by outcome" }, host);

    // threshold and axis
    el("line", { x1: x(0.5), x2: x(0.5), y1: top - 6, y2: axisY + hF, stroke: "#CFCBBE", "stroke-width": 1 }, svg);
    el("line", { x1: x(0), x2: x(1), y1: axisY, y2: axisY, stroke: "#CFCBBE", "stroke-width": 1 }, svg);
    const text = (t, xx, yy, anchor, cls) => {
      const e = el("text", { x: xx, y: yy, "text-anchor": anchor, class: cls || "dt" }, svg);
      e.textContent = t;
      return e;
    };
    text("0.5", x(0.5), top - 10, "middle");
    [0, 0.25, 0.75, 1].forEach((v) => text(String(v), x(v), axisY + hF + 16, "middle"));
    text("Forecast probability of success", x(0.5), H - 2, "middle");
    const n = (o) => rows.filter((d) => d.outcome === o).length;
    text("Success", 0, axisY - hS / 2 - 2, "start", "dl");
    text(String(n("success")), 0, axisY - hS / 2 + 14, "start");
    text("Failure", 0, axisY + hF / 2 - 2, "start", "dl");
    text(String(n("failure")), 0, axisY + hF / 2 + 14, "start");

    pts = dots.map(({ d, bin, k }) => {
      const up = d.outcome === "success", ok = (d.score >= 0.5) === up;
      const cx = x((bin + 0.5) * bw), cy = up ? axisY - 4 - r - k * step : axisY + 4 + r + k * step;
      const c = el("circle", { cx, cy, r: ok ? r : r - 0.9, fill: ok ? COL[d.outcome] : "#FAF9F5",
        stroke: COL[d.outcome], "stroke-width": ok ? 0 : 1.8 }, svg);
      return { d, cx, cy, c, ok };
    });
    svg.addEventListener("pointermove", (e) => show(e, svg));
    svg.addEventListener("pointerdown", (e) => show(e, svg));
    svg.addEventListener("pointerleave", hide);
  }

  let cur = null;
  function hide() {
    tip.style.display = "none";
    if (cur) cur.c.removeAttribute("class");
    cur = null;
  }
  function show(e, svg) {
    const b = svg.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top;
    let best = null, bd = 24 * 24;
    for (const p of pts) {
      const q = (p.cx - mx) ** 2 + (p.cy - my) ** 2;
      if (q < bd) { bd = q; best = p; }
    }
    if (!best) return hide();
    if (cur !== best) {
      if (cur) cur.c.removeAttribute("class");
      cur = best;
      best.c.setAttribute("class", "hot");
      tip.textContent = "";
      const line = (t, cls) => { const s = document.createElement("div"); if (cls) s.className = cls; s.textContent = t; tip.appendChild(s); };
      line(`${f3(best.d.score)} · ${best.d.outcome === "success" ? "Success" : "Failure"}${best.ok ? "" : " · incorrect call"}`, "tv");
      line(best.d.intervention);
      line(`${best.d.sponsor} · ${best.d.nct}`, "tm");
    }
    tip.style.display = "block";
    const tw = tip.offsetWidth, left = Math.min(Math.max(8, e.clientX + 14), window.innerWidth - tw - 8);
    tip.style.left = left + "px";
    tip.style.top = e.clientY + 16 + "px";
  }

  render();
  let t = null;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { hide(); render(); }, 120); });
})();
