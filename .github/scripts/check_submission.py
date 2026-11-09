"""Check a forecast submission opened with the issue form and store the accepted CSV.

Reads the issue from environment variables set by .github/workflows/forecast_submission.yml (the issue text is never
interpolated into a shell command). Writes check/comment.md, check/status (accepted or rejected) and, when accepted,
submissions/<model_name>/<recorded time>_issue<number>.csv plus a row in submissions/index.csv. Standard library only.
"""
import csv, io, os, re, sys, urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BENCH = os.path.join(ROOT, "downloads", "trialoutlook_benchmark_5809_trials.csv")
OUT = os.path.join(ROOT, "check")
MAX_BYTES = 10 * 1024 * 1024
URL_RE = re.compile(r"https://github\.com/(?:user-attachments/files/\d+/[^\s)\]]+|[\w.-]+/[\w.-]+/files/\d+/[^\s)\]]+)")
COLS = ["nct_id", "p_success", "model_name", "generated_at"]


def sections(body):
    """Issue form bodies are '### Label' headings followed by the answer."""
    out, cur = {}, None
    for line in (body or "").replace("\r\n", "\n").split("\n"):
        m = re.match(r"^###\s+(.*\S)\s*$", line)
        if m:
            cur = m.group(1).strip().lower(); out[cur] = []
        elif cur is not None:
            out[cur].append(line)
    return {k: "\n".join(v).strip() for k, v in out.items()}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "forecast-submission-check"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError("the file is larger than 10 MB")
    return data.decode("utf-8-sig")


def main():
    os.makedirs(OUT, exist_ok=True)
    body, number = os.environ.get("ISSUE_BODY", ""), os.environ.get("ISSUE_NUMBER", "0")
    action = os.environ.get("EVENT_ACTION", "opened")
    recorded = os.environ.get("UPDATED_AT" if action == "edited" else "CREATED_AT") or datetime.now(timezone.utc).isoformat()
    recorded_dt = datetime.fromisoformat(recorded.replace("Z", "+00:00")).astimezone(timezone.utc)
    sec = sections(body)
    method = sec.get("method name", "").strip().strip("`")
    raw = sec.get("forecasts csv", "")
    errors, notes = [], []

    text = None
    urls = URL_RE.findall(raw)
    if urls:
        try:
            text = fetch(urls[0])
            if len(urls) > 1: notes.append(f"{len(urls)} files were attached; only the first was checked.")
        except Exception as e:
            errors.append(f"The attached file could not be downloaded ({e}).")
    else:
        pasted = re.sub(r"^```\w*\n|\n```$", "", raw.strip())
        if pasted.lower().startswith("nct_id"):
            text = pasted
        else:
            errors.append("No CSV was found: attach the CSV file or paste the CSV text starting with the header row.")

    rows = []
    if text is not None:
        reader = csv.DictReader(io.StringIO(text))
        header = [h.strip() for h in (reader.fieldnames or [])]
        missing = [c for c in COLS if c not in header]
        if missing:
            errors.append("Missing columns: " + ", ".join(missing) + ". Required: " + ", ".join(COLS) + ".")
        else:
            bench = {r["nct_id"] for r in csv.DictReader(open(BENCH, encoding="utf-8"))}
            seen, models = set(), set()
            for k, r in enumerate(reader, start=2):
                r = {(a or "").strip(): (b or "").strip() for a, b in r.items() if a}
                nct, p, model, gen = r.get("nct_id", ""), r.get("p_success", ""), r.get("model_name", ""), r.get("generated_at", "")
                bad = []
                if nct not in bench: bad.append(f"{nct or 'empty nct_id'} is not a benchmark trial")
                elif nct in seen: bad.append(f"{nct} appears more than once")
                try:
                    pv = float(p)
                    if not 0 <= pv <= 1: bad.append(f"p_success {p} is outside 0 to 1")
                except ValueError:
                    bad.append(f"p_success '{p}' is not a number")
                try:
                    gd = datetime.strptime(gen, "%Y-%m-%d").date()
                    if gd > recorded_dt.date(): bad.append(f"generated_at {gen} is after the submission date")
                except ValueError:
                    bad.append(f"generated_at '{gen}' is not a date written YYYY-MM-DD")
                if not model: bad.append("model_name is empty")
                if bad:
                    errors.append(f"Row {k}: " + "; ".join(bad))
                else:
                    seen.add(nct); models.add(model)
                    rows.append([nct, f"{float(p):g}", model, gen])
            if not rows and not errors: errors.append("The CSV has no forecast rows.")
            if len(models) > 1: errors.append("model_name must be the same in every row (found " + ", ".join(sorted(models)) + ").")
            if method and models and method not in models:
                errors.append(f"The method name in the form ({method}) differs from model_name in the CSV ({', '.join(sorted(models))}).")

    stamp = recorded_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    if errors:
        shown = errors[:20] + ([f"... and {len(errors) - 20} more problems."] if len(errors) > 20 else [])
        msg = ["**Submission check: changes needed.** Nothing was stored. Edit this issue to fix the file; the check runs again "
               "and the edit time becomes the recorded time.", ""] + [f"- {e}" for e in shown]
        status = "rejected"
    else:
        model = rows[0][2]
        safe = re.sub(r"[^A-Za-z0-9_.]+", "_", model)[:80] or "model"
        rel = f"submissions/{safe}/{recorded_dt.strftime('%Y%m%dT%H%M%SZ')}_issue{number}.csv"
        path = os.path.join(ROOT, *rel.split("/"))
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh, lineterminator="\n"); w.writerow(COLS); w.writerows(rows)
        index = os.path.join(ROOT, "submissions", "index.csv")
        new = not os.path.exists(index)
        with open(index, "a", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh, lineterminator="\n")
            if new: w.writerow(["recorded_at_utc", "issue", "model_name", "trials", "file"])
            w.writerow([stamp, number, model, len(rows), rel])
        msg = ["**Submission check: accepted.**", "",
               f"- Method: `{model}`", f"- Forecasts: {len(rows):,} benchmark trials",
               f"- Recorded at: {stamp} (UTC)", f"- Stored as: `{rel}`", "",
               "Each trial is scored only if its outcome was first disclosed after the recorded time. Results are released on "
               "the last day of each month."] + ([""] + [f"- {n}" for n in notes] if notes else [])
        status = "accepted"
    open(os.path.join(OUT, "comment.md"), "w", encoding="utf-8").write("\n".join(msg) + "\n")
    open(os.path.join(OUT, "status"), "w", encoding="utf-8").write(status)
    print(status, len(rows), "rows;", len(errors), "problems")


if __name__ == "__main__":
    sys.exit(main())
