// TrialOutlook benchmark: the 5,809 trials of the prospective benchmark as a table, one tab per phase,
// with a search box under every column heading.

(async function () {
  const B = await loadJSON("data/benchmark.json");
  document.getElementById("b-n").textContent = B.n.toLocaleString();
  const rows = B.rows.map(([nct, company, phase, drug, targets, disease]) => ({ nct, company, phase, drug, targets, disease }));
  const label = (p) => (p === "Early 1" ? "Early phase 1" : "Phase " + p);

  // phase tabs with counts
  const counts = {}; rows.forEach((r) => { counts[r.phase] = (counts[r.phase] || 0) + 1; });
  const tabs = document.getElementById("phasetabs");
  const tabList = [["", "All phases", rows.length]].concat(B.phases.filter((p) => counts[p]).map((p) => [p, label(p), counts[p]]));
  tabs.innerHTML = tabList.map(([v, t, n], i) =>
    `<button type="button" role="tab" data-phase="${v}" aria-selected="${i === 0}" class="${i === 0 ? "on" : ""}">${t}<span>${n.toLocaleString()}</span></button>`).join("");

  const wrapCol = (title, field, width) => ({ title, field, width, cssClass: "wrap", headerFilter: "input",
    headerFilterPlaceholder: "Search", headerFilterFunc: "like", formatter: (c) => esc(c.getValue()) });
  const table = new Tabulator("#grid", {
    data: rows, layout: "fitDataStretch", height: "680px", columnDefaults: { headerWordWrap: false, headerSortTristate: true },
    placeholder: "No trial matches these searches",
    columns: [
      { title: "NCT ID", field: "nct", width: 132, headerFilter: "input", headerFilterPlaceholder: "Search",
        formatter: (c) => nctLink(c.getValue()) },
      wrapCol("Company", "company", 190),
      { title: "Phase", field: "phase", width: 96, headerFilter: "input", headerFilterPlaceholder: "Search",
        sorter: (a, b) => B.phases.indexOf(a) - B.phases.indexOf(b) },
      wrapCol("Drug", "drug", 200),
      wrapCol("Drug targets", "targets", 190),
      wrapCol("Disease", "disease", 230),
    ],
  });

  const cnt = document.getElementById("count");
  let phase = "";
  const showCount = (n) => { cnt.textContent = `${n.toLocaleString()} of ${rows.length.toLocaleString()} trials`; };
  table.on("tableBuilt", () => showCount(rows.length));
  table.on("dataFiltered", (f, rs) => showCount(rs.length));
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    phase = b.dataset.phase;
    tabs.querySelectorAll("button").forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); });
    if (phase) table.setFilter("phase", "=", phase); else table.clearFilter();
  });
  document.getElementById("clear").addEventListener("click", () => table.clearHeaderFilter());
})();
