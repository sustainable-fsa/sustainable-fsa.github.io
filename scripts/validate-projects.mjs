#!/usr/bin/env node
// Validates _data/projects.yml against the contract that _layouts/archives.html
// relies on: every entry must carry a `category` of exactly "data", "analysis",
// or "documents". A card renders only where `project.category == page.archive_category`,
// so a missing, misspelled, or mis-cased category silently drops the card from
// every page while the Jekyll build still succeeds. This check fails the CI run
// before that can ship. Run via `npm run lint:data`.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import yaml from "js-yaml";

const ALLOWED = new Set(["data", "analysis", "documents"]);
const UPDATED_METHODS = new Set(["usdm-map", "github-file", "github-release", "manifest-dates"]);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataFile = join(repoRoot, "_data", "projects.yml");

let projects;
try {
  projects = yaml.load(readFileSync(dataFile, "utf8"));
} catch (err) {
  console.error(`✖ Could not read/parse _data/projects.yml: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(projects)) {
  console.error("✖ _data/projects.yml must be a YAML list of project entries.");
  process.exit(1);
}

const errors = [];
projects.forEach((p, i) => {
  const label = p && typeof p === "object" && p.title ? `"${p.title}"` : `entry #${i + 1}`;
  if (!p || typeof p !== "object" || Array.isArray(p)) {
    errors.push(`${label}: is not a mapping.`);
    return;
  }
  if (!p.title || typeof p.title !== "string") {
    errors.push(`entry #${i + 1}: missing a string "title".`);
  }
  if (p.category === undefined || p.category === null) {
    errors.push(`${label}: missing "category" (must be one of: ${[...ALLOWED].join(", ")}).`);
  } else if (!ALLOWED.has(p.category)) {
    errors.push(`${label}: category "${p.category}" is not one of ${[...ALLOWED].join(", ")} — the card would render on no page.`);
  }
  // `updated_method`/`updated_ref` feed assets/archive-updated.js. A
  // malformed pair fails silently in the browser (the "Data current
  // as of" line just never appears), so shape-check it here.
  const hasMethod = p.updated_method !== undefined;
  const hasRef = p.updated_ref !== undefined;
  if (hasMethod !== hasRef) {
    errors.push(`${label}: updated_method and updated_ref must appear together.`);
  }
  if (hasMethod && !UPDATED_METHODS.has(p.updated_method)) {
    errors.push(`${label}: updated_method "${p.updated_method}" is not one of ${[...UPDATED_METHODS].join(", ")}.`);
  }
  // github-release refs are bare repo names in the sustainable-fsa
  // org; every other method's ref is a slash-containing key/path.
  if (hasRef && p.updated_method === "github-release") {
    if (typeof p.updated_ref !== "string" || !/^[A-Za-z0-9_.-]+$/.test(p.updated_ref)) {
      errors.push(`${label}: updated_ref "${p.updated_ref}" must be a bare repo name (no slashes) for github-release.`);
    }
  } else if (hasRef && (typeof p.updated_ref !== "string" || !/^[^/\s][^\s]*\/[^\s]*$/.test(p.updated_ref))) {
    errors.push(`${label}: updated_ref "${p.updated_ref}" must be a slash-containing key/prefix with no leading slash or whitespace.`);
  }
  // `image_background` is emitted verbatim inside a style attribute in
  // _includes/card.html (Liquid does not escape it), so a quote or
  // semicolon would silently mangle the card's markup.
  if (p.image_background !== undefined &&
      (typeof p.image_background !== "string" || !/^[a-z0-9#(),.% -]+$/i.test(p.image_background))) {
    errors.push(`${label}: image_background "${p.image_background}" must be a plain CSS color (letters, digits, #, commas, parens — it lands inside a style attribute).`);
  }
  // `doi` is a bare DOI (card.html prepends https://doi.org/); a full URL
  // or whitespace would produce a broken link.
  if (p.doi !== undefined &&
      (typeof p.doi !== "string" || !/^10\.\d{4,9}\/\S+$/.test(p.doi))) {
    errors.push(`${label}: doi "${p.doi}" must be a bare DOI like 10.5281/zenodo.15252842 (no https://doi.org/ prefix).`);
  }
});

if (errors.length > 0) {
  console.error(`✖ _data/projects.yml validation failed (${errors.length} problem${errors.length === 1 ? "" : "s"}):`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error(`\nEvery entry needs a category of ${[...ALLOWED].join(", ")} (see _layouts/archives.html).`);
  process.exit(1);
}

const counts = projects.reduce((acc, p) => {
  acc[p.category] = (acc[p.category] || 0) + 1;
  return acc;
}, {});
console.log(`✓ _data/projects.yml OK — ${projects.length} entries (${counts.data || 0} data, ${counts.analysis || 0} analysis, ${counts.documents || 0} documents).`);
