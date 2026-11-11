// TrialOutlook: shared helpers, header and footer. Loaded at the end of <body>.

const MARK = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="#C96442"/></svg>`;

// ---------- data + formatting helpers ----------
async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path + " " + r.status);
  return r.json();
}
const f3 = (v) => (v == null ? "" : Number(v).toFixed(3));
const minus = (s) => String(s).replace(/^-/, "−");
const ciText = (c) => (c ? `${minus(f3(c[0]))} to ${minus(f3(c[1]))}` : "");
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(s, year = true) {
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return `${d} ${MON[m - 1]}${year ? " " + y : ""}`;
}
function pill(text, klass) { return `<span class="pill ${klass}">${text}</span>`; }
function nctLink(v) {
  return `<a class="mono" href="https://clinicaltrials.gov/study/${v}" target="_blank" rel="noopener">${v}</a>`;
}
function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return "source"; }
}
function esc(s) { return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

const pct1 = (a, b) => `${((100 * a) / b).toFixed(1)}%`;

// ---------- header and footer (after the helpers they use) ----------
(function () {
  const S = window.SITE;
  const page = document.body.dataset.page || "";
  const NAV = [
    ["index.html", "home", "Overview"],
    ["results.html", "results", "Results"],
    ["benchmark.html", "benchmark", "Benchmark"],
    ["preliminary.html", "preliminary", "Preliminary results"],
    ["contribute.html", "contribute", "Contribute"],
  ];

  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML = `
      <header class="nav"><div class="wrap navin">
        <a class="logo" href="index.html">${MARK}${S.name}</a>
        <nav id="mainnav">
          ${NAV.map(([href, id, label]) =>
            `<a href="${href}" class="${id === page ? "active" : ""}">${label}</a>`).join("")}
          <a href="${S.repoUrl}" target="_blank" rel="noopener">GitHub</a>
        </nav>
        <a class="cta" href="contribute.html">Submit forecasts</a>
        <button class="menu-btn" aria-label="Menu" onclick="document.getElementById('mainnav').classList.toggle('open')">&#9776;</button>
      </div></header>`;
    const nav = header.querySelector(".nav");
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML = `
      <footer class="foot"><div class="wrap">
        <div class="row">
          <div>${S.name} · data cut ${fmtDate(S.snapshotDate)} · forecasts recorded before outcome disclosure</div>
          <div>Research resource only. Not medical, clinical or investment advice.</div>
        </div>
        <div class="lic">The contents of this site are available under a
          <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener license">Creative Commons Attribution-NonCommercial 4.0 International licence (CC BY-NC 4.0)</a>.
          Commercial use is not permitted.</div>
      </div></footer>`;
  }

  document.querySelectorAll("a[data-site-link]").forEach((a) => {
    const kind = a.dataset.siteLink;
    if (kind === "repo") a.href = S.repoUrl;
    if (kind === "issues") a.href = S.repoUrl.replace(/\/$/, "") + "/issues";
    if (kind === "submit") a.href = S.repoUrl.replace(/\/$/, "") + "/issues/new?template=forecast_submission.yml";
    if (kind === "base") a.href = S.baseUrl;
  });
})();
