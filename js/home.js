// TrialAugur home: example readout, paper box.

(async function () {
  const S = window.SITE;
  document.getElementById("paper-cite").textContent = S.paper.citation;
  if (S.paper.status === "published") {
    document.getElementById("paper-tag").remove();
    document.getElementById("paper-note").innerHTML = S.paper.url
      ? `<a href="${S.paper.url}" target="_blank" rel="noopener">${S.paper.url}</a>` : "";
  }

  const [R, rows] = await Promise.all([loadJSON("data/results.json"), loadJSON("data/readouts.json")]);
  const P = R.prospective;

  // worked example: XPORT-EC-042, a failure predicted by the reasoning expert
  const c = rows.find((r) => r.nct === "NCT05611931");
  if (c) {
    const ok = (c.score >= 0.5) === (c.outcome === "success");
    document.getElementById("case").innerHTML = `
      <div class="cardlabel">Example readout</div>
      <div class="trialid">${c.nct} · phase ${c.phase} · read out ${fmtDate(c.date)}</div>
      <div class="trialname">XPORT-EC-042, selinexor maintenance in TP53 wild type endometrial cancer</div>
      ${pill("Failure · primary PFS endpoint missed", "fail")}
      <div class="calls" style="margin-top:16px">
        <div><span>Reasoning expert, recorded ${fmtDate(P.recorded)}</span>
          <b class="${ok ? "ok" : "bad"}">${f3(c.score)} · ${c.score >= 0.5 ? "success" : "failure"} ${ok ? "✓" : "✗"}</b></div>
      </div>
      <div class="foot">${esc(c.evidence)}. <a href="${esc(c.url)}" target="_blank" rel="noopener">Source ↗</a></div>`;
  }
})();
