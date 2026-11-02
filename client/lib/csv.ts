export function downloadCsv(filename: string, rows: Array<Record<string, string | number>>): void {
  if (rows.length === 0) {
    const empty = "No data available\n";
    triggerDownload(filename, empty);
    return;
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const text = String(value);
    if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  };

  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header] ?? "")).join(",")),
  ].join("\n");

  triggerDownload(filename, csv);
}

function triggerDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
