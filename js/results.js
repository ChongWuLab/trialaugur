// TrialAugur results: the readout ledger of the adjudicated prospective trials with the reasoning expert's forecast.

(async function () {
  const [R, rows] = await Promise.all([loadJSON("data/results.json"), loadJSON("data/readouts.json")]);
  const P = R.prospective;

  document.getElementById("lede").textContent =
    `Forecasts of the reasoning expert were recorded on ${fmtDate(P.recorded)} for the initial prospective cohort of ` +
    `${P.cohort} trials. By ${fmtDate(R.as_of)}, results had been reported for ${P.reported} trials after that date; ` +
    `${P.n} were adjudicated under prespecified outcome criteria (${P.nS} successes and ${P.nF} failures) and ` +
    `${P.unresolved} remained unresolved. Each row gives the evidence for the label, its primary source and the forecast.`;

  function scoreFmt(c) {
    const v = c.getValue(); if (v == null) return "";
    const ok = (v >= 0.5) === (c.getRow().getData().outcome === "success");
    return `<span class="sc ${ok ? "right" : "wrong"}">${f3(v)}</span>`;
  }
  const table = new Tabulator("#grid", {
    data: rows, layout: "fitDataStretch", columnDefaults: { headerWordWrap: true }, height: "680px",
    initialSort: [{ column: "date", dir: "desc" }],
    columns: [
      { title: "NCT ID", field: "nct", width: 128, frozen: true, formatter: (c) => nctLink(c.getValue()) },
      { title: "Readout", field: "date", width: 116, formatter: (c) => `<span class="mono">${fmtDate(c.getValue())}</span>` },
      { title: "Outcome", field: "outcome", width: 112, hozAlign: "center",
        formatter: (c) => (c.getValue() === "failure" ? pill("Failure", "fail") : pill("Success", "success")) },
      { title: "Phase", field: "phase", width: 76 },
      { title: "Adjudication evidence", field: "evidence", width: 360, cssClass: "wrap", headerSort: false },
      { title: "Source", field: "url", width: 150, headerSort: false,
        formatter: (c) => (c.getValue() ? `<a href="${esc(c.getValue())}" target="_blank" rel="noopener">${hostOf(c.getValue())} ↗</a>` : "") },
      { title: "Reasoning expert", field: "score", width: 104, hozAlign: "right", formatter: scoreFmt, sorter: "number" },
      { title: "Intervention (registry)", field: "intervention", width: 220, cssClass: "wrap" },
      { title: "Sponsor", field: "sponsor", width: 180, cssClass: "wrap" },
    ],
  });
  table.on("tableBuilt", () => {
    const ph = document.getElementById("f-phase");
    [...new Set(rows.map((r) => r.phase))].sort().forEach((v) => ph.insertAdjacentHTML("beforeend", `<option value="${v}">Phase ${v}</option>`));
    const q = document.getElementById("q"), out = document.getElementById("f-outcome"), cnt = document.getElementById("count");
    const apply = () => {
      const s = q.value.trim().toLowerCase();
      table.setFilter((r) => (!ph.value || r.phase === ph.value) && (!out.value || r.outcome === out.value) &&
        (!s || [r.nct, r.intervention, r.sponsor, r.evidence].join(" ").toLowerCase().includes(s)));
    };
    [q, ph, out].forEach((e) => e.addEventListener(e === q ? "input" : "change", apply));
    table.on("dataFiltered", (f, rs) => { cnt.textContent = `${rs.length} readouts`; });
    cnt.textContent = `${rows.length} readouts`;
  });
})();
