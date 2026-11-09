// TrialAugur home: example readout, stat strip, paper box.

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

  document.getElementById("s-cohort").textContent = P.cohort.toLocaleString();
  document.getElementById("s-eval").textContent = P.n;
  document.getElementById("s-eval-l").textContent =
    `outcomes disclosed after forecast recording on ${fmtDate(P.recorded)} and adjudicated: ${P.nS} successes, ${P.nF} failures`;
  document.getElementById("s-roc").textContent = f3(P.roc[0]);
  document.getElementById("s-roc-l").textContent = `ROC AUC of the reasoning expert (95% CI ${ciText(P.roc.slice(1))})`;
  document.getElementById("s-note").textContent =
    `Average precision ${f3(P.ap[0])} (95% CI ${ciText(P.ap.slice(1))}). At the prespecified probability threshold of 0.5, ` +
    `the reasoning expert correctly identified ${P.f_correct} of ${P.nF} failures ` +
    `(${pct1(P.f_correct, P.nF)}) but incorrectly classified ${P.s_incorrect} of ${P.nS} successes as failures.`;

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
