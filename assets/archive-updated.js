/* Fills the "Data current as of {date}" line on data-archive cards
 * (see _includes/card.html). Each card with an `updated_method` in
 * _data/projects.yml carries data-updated-method / data-updated-ref
 * attributes; the resolvers below turn them into the date the DATA
 * last changed — deliberately not S3 Last-Modified of pipeline
 * outputs, which bumps whenever `aws s3 sync` re-uploads a
 * regenerated file even when its content is unchanged.
 *
 *   usdm-map        ref = S3 key prefix up to the weekly filename stem
 *                   (e.g. "usdm/data/parquet/USDM_"). Weekly USDM
 *                   files are named by MAP date — the Tuesday the map
 *                   is valid, two days before its Thursday release —
 *                   so the newest filename is the archive's currency.
 *   github-file     ref = "<repo>/<path>" in the sustainable-fsa org.
 *                   Date of the last commit that CHANGED the file:
 *                   git records path history only on content change,
 *                   so routine pipeline reruns don't move it.
 *   manifest-dates  ref = S3 key of a manifest.json listing archive
 *                   files. Newest USDA-stamped date embedded in the
 *                   data-raw/ filenames — YYYYMMDD or MM-DD-YY(YY),
 *                   both naming styles FSA uses; the manifest
 *                   regenerates each run but the embedded dates only
 *                   advance when USDA posts new files.
 *
 * The sustainable-fsa bucket allows anonymous GET/HEAD and
 * ListObjectsV2 from any origin (the data portal at
 * data.sustainable-fsa.com relies on the same CORS policy);
 * api.github.com is CORS-open. Lines stay hidden until a lookup
 * succeeds, so failures degrade to no date rather than a wrong one.
 */
(function () {
  const S3 = "https://sustainable-fsa.s3.us-west-2.amazonaws.com";
  const fmt = new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });

  function isoValid(iso) {
    const d = new Date(`${iso}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) &&
      d.toISOString().slice(0, 10) === iso &&
      d.getUTCFullYear() >= 2000 &&
      d.getUTCFullYear() <= new Date().getUTCFullYear() + 1;
  }

  const resolvers = {
    // Newest weekly map date under the prefix. Year-scoped so the
    // listing stays one small page (≤53 keys); in early January the
    // current year may have no maps yet, so fall back one year.
    "usdm-map": async (ref) => {
      const year = new Date().getUTCFullYear();
      for (const y of [year, year - 1]) {
        const q = new URLSearchParams({ "list-type": "2", prefix: `${ref}${y}` });
        const res = await fetch(`${S3}/?${q}`);
        if (!res.ok) return null;
        const xml = await res.text();
        const dates = [...xml.matchAll(/<Key>[^<]*(\d{4}-\d{2}-\d{2})[^<]*<\/Key>/g)]
          .map((m) => m[1]).filter(isoValid).sort();
        if (dates.length) return dates[dates.length - 1];
      }
      return null;
    },

    "github-file": async (ref) => {
      const [repo, ...rest] = ref.split("/");
      const q = new URLSearchParams({ path: rest.join("/"), per_page: "1" });
      const res = await fetch(`https://api.github.com/repos/sustainable-fsa/${repo}/commits?${q}`);
      if (!res.ok) return null;
      const iso = (await res.json())[0]?.commit?.committer?.date?.slice(0, 10);
      return iso && isoValid(iso) ? iso : null;
    },

    // FSA stamps published files MM-DD-YY(YY) as well as YYYYMMDD.
    // Digit guards rather than \b: FSA suffixes duplicate names with
    // _0 ("07-09-26_0.pdf"), and \b treats that underscore as a word
    // char, dropping the file. The guards still keep the pattern from
    // starting mid-number in the scraper-log ISO dirs
    // ("log/2026-07-09/" — capture dates, not data dates), and
    // isoValid discards month/day-swapped false parses.
    "manifest-dates": async (ref) => {
      const res = await fetch(`${S3}/${encodeURI(ref)}`);
      if (!res.ok) return null;
      let newest = null;
      const consider = (iso) => {
        if (isoValid(iso) && (!newest || iso > newest)) newest = iso;
      };
      for (const entry of await res.json()) {
        if (typeof entry.path !== "string" || !entry.path.startsWith("data-raw/")) continue;
        for (const [raw] of entry.path.matchAll(/20\d{6}/g))
          consider(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`);
        for (const [, mm, dd, yy] of entry.path.matchAll(/(?<!\d)(\d{2})-(\d{2})-(\d{4}|\d{2})(?!\d)/g))
          consider(`${yy.length === 2 ? `20${yy}` : yy}-${mm}-${dd}`);
      }
      return newest;
    },
  };

  for (const el of document.querySelectorAll("[data-updated-method]")) {
    const resolve = resolvers[el.dataset.updatedMethod];
    if (!resolve) continue;
    resolve(el.dataset.updatedRef)
      .then((iso) => {
        if (!iso) return;
        const time = el.querySelector("time");
        time.dateTime = iso;
        time.textContent = fmt.format(new Date(`${iso}T00:00:00Z`));
        el.hidden = false;
      })
      .catch(() => {});
  }
})();
