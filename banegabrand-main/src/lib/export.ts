export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(title: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;color:#111}
    h1{font-size:18px;margin:0 0 12px}
    .meta{color:#666;font-size:12px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
    th{background:#f4f6f8}
    @media print{ .no-print{display:none} }
  </style></head><body>
  <h1>${title}</h1>
  <div class="meta">Generated ${new Date().toLocaleString()}</div>
  <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${rows
    .map(
      (r) =>
        `<tr>${headers
          .map((h) => `<td>${(r[h] ?? "").toString().replace(/</g, "&lt;")}</td>`)
          .join("")}</tr>`,
    )
    .join("")}</tbody></table>
  <div class="no-print" style="margin-top:16px"><button onclick="window.print()">Print / Save as PDF</button></div>
  <script>setTimeout(()=>window.print(),300)</script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
