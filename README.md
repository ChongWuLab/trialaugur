# TrialAugur

A prospective benchmark for clinical trial outcome forecasts.

- **TrialDossier** uses a ClinicalTrials.gov identifier to assemble a standardized evidence dossier; **TrialOutlook**
  uses the dossier to forecast, with a GPT-5 reasoning expert, the probability that the trial meets its prespecified
  primary endpoint.
- **69 adjudicated readouts** of the initial prospective cohort of 694 trials, first disclosed after the forecasts were
  recorded on 29 July 2026 and adjudicated by 20 October 2026: 40 successes, 29 failures. Reasoning expert ROC AUC
  0.819 (95% CI 0.708 to 0.914), average precision 0.860; at 0.5 it identified 27 of 29 failures and classified 17 of 40
  successes as failures.
- **Prospective benchmark of 5,809 ongoing trials** of US listed companies, with forecasts recorded before outcome
  disclosure. The trial list is public; anyone can submit forecasts for pending trials (see the Contribute page).
- **Prespecified adjudication**: trials are classified by whether the reported results satisfy the prespecified criteria
  for the primary endpoints; trials terminated before completion are failures unless attainment of the primary endpoint
  has been reported; everything else stays unresolved. Every label links its primary source.

The site publishes the 69 adjudicated readouts with their evidence and the reasoning expert's recorded forecasts, and
the NCT IDs of the benchmark. Evidence dossiers, model inputs and the forecast values of the benchmark trials are not
published.

## Repository layout

This repository contains only the static website (GitHub Pages, `main` branch root).

```
index.html / results.html / benchmark.html / contribute.html
predictions.html  redirect to benchmark.html (old link)
css/          styling
js/config.js  deployment config: site name, domain, repo, paper (edit here only)
js/           page logic
data/         compact JSON consumed by the pages
downloads/    the 69 adjudicated readouts (CSV) and the benchmark NCT IDs (CSV)
submissions/  community forecast CSVs (via pull request)
```

## Citation

The accompanying manuscript is in preparation; a citation and link will appear here and on the site once public.

## Disclaimer

Research resource only. Not medical, clinical or investment advice. Adjudicated labels may be revised as further
evidence emerges; revisions are recorded.
