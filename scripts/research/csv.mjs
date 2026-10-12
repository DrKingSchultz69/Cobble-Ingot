// Minimal CSV read/write for docs/research/pain-log.csv (RFC 4180: quotes, commas, newlines).
export const COLUMNS = [
  "id", "date_found", "role", "tool", "source_type", "link", "quote", "pain_summary", "theme",
  "severity_1to5", "agree_count", "workaround_they_use", "netheron_idea", "notes", "collected_by", "verified",
];

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((x) => x !== "")) rows.push(row); }
  const [header = [], ...data] = rows;
  // Older logs may lack newer columns: missing ones read as "".
  return data.map((r) => Object.fromEntries(COLUMNS.map((c) => [c, r[header.indexOf(c)] ?? ""])));
}

const cell = (v) => {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// UTF-8 with BOM so Excel shows emoji and non-English text correctly.
export function toCsv(rows) {
  return "﻿" + [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))].join("\r\n") + "\r\n";
}
