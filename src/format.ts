export const currencies = ["USD", "CAD", "GBP", "AUD", "INR", "NZD", "EUR", "JPY"];

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
}

export function toMinorUnits(value: string, currency: string): number {
  const numeric = Number(value);
  const scale = currency === "JPY" ? 1 : 100;
  return Number.isFinite(numeric) ? Math.round(numeric * scale) : Number.NaN;
}

export function fromMinorUnits(value: number, currency: string): number {
  return value / (currency === "JPY" ? 1 : 100);
}

export function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("A CSV row has an unmatched quote.");
  cells.push(cell.trim());
  return cells;
}
