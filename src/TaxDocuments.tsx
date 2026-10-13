import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { currencies, formatMoney, makeId, parseCsvLine } from "./format";
import type { Jurisdiction, TaxRecord } from "./types";

type TaxDocumentsProps = {
  records: TaxRecord[];
  onRecordsChange: (records: TaxRecord[]) => void;
  onPrint: () => void;
  externalNotice?: string;
};
type Draft = {
  jurisdiction: string;
  template: string;
  year: string;
  currency: string;
  name: string;
  reference: string;
  notes: string;
  records: TaxRecord[];
  total: number;
};

const jurisdictions: Jurisdiction[] = [
  { code: "US", name: "United States", currency: "USD" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "JP", name: "Japan", currency: "JPY" },
  { code: "OTHER", name: "Other / custom", currency: "USD" },
];
const templates: Record<string, string[]> = {
  US: ["Individual tax organizer", "W-2 information worksheet", "1099-INT information worksheet", "1099-NEC information worksheet", "Self-employment income & expense summary", "Charitable contribution record", "Investor distribution tax records"],
  CA: ["Personal income & deductions organizer", "Business income & expense summary", "Investor distribution tax records"],
  GB: ["Personal income & reliefs organizer", "Self-employment income & costs summary", "Investor distribution tax records"],
  AU: ["Individual income & deductions organizer", "Business income & expense summary", "Investor distribution tax records"],
  IN: ["Personal income & deduction organizer", "Business income & expense summary", "Investor distribution tax records"],
  NZ: ["Personal income & expense organizer", "Business income & expense summary"],
  IE: ["Personal income & reliefs organizer", "Business income & expense summary"],
  DE: ["Personal income records organizer", "Business income & expense summary"],
  FR: ["Personal income records organizer", "Business income & expense summary"],
  JP: ["Personal income & expense organizer", "Business income & expense summary"],
  OTHER: ["Custom tax document worksheet"],
};
const sources = ["Financial record", "Investor distribution", "Bank statement", "Brokerage statement", "Other"];

export function TaxDocuments({ records, onRecordsChange, onPrint, externalNotice = "" }: TaxDocumentsProps) {
  const [jurisdiction, setJurisdiction] = useState("US");
  const [template, setTemplate] = useState(templates.US[0]);
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [currency, setCurrency] = useState("USD");
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(externalNotice);
  useEffect(() => { if (externalNotice) setNotice(externalNotice); }, [externalNotice]);
  const fileInput = useRef<HTMLInputElement>(null);
  const currentTemplates = templates[jurisdiction] ?? templates.OTHER;

  function changeJurisdiction(code: string) {
    const selected = jurisdictions.find((item) => item.code === code) ?? jurisdictions[0];
    setJurisdiction(code);
    setCurrency(selected.currency);
    setTemplate((templates[code] ?? templates.OTHER)[0]);
    setDraft(null);
  }
  function updateRecord(id: string, change: Partial<TaxRecord>) {
    onRecordsChange(records.map((record) => record.id === id ? { ...record, ...change } : record));
    setDraft(null);
  }
  function addRecord() {
    onRecordsChange([...records, { id: makeId(), description: "", source: "Financial record", amount: "" }]);
    setDraft(null);
  }
  function removeRecord(id: string) {
    onRecordsChange(records.filter((record) => record.id !== id));
    setDraft(null);
  }
  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const lines = (await file.text()).split(/\r?\n/).filter((line) => line.trim());
      const parsed = lines.map(parseCsvLine);
      const header = parsed[0]?.map((cell) => cell.toLowerCase());
      const hasHeader = header?.some((cell) => ["description", "amount", "source"].includes(cell)) ?? false;
      if (hasHeader && (!header?.includes("description") || !header.includes("amount"))) {
        throw new Error("CSV headers must include description and amount.");
      }
      const nextRecords = (hasHeader ? parsed.slice(1) : parsed).flatMap((cells) => {
        const descriptionIndex = hasHeader ? header!.indexOf("description") : 0;
        const amountIndex = hasHeader ? header!.indexOf("amount") : 1;
        const sourceIndex = hasHeader ? header!.indexOf("source") : 2;
        const description = cells[descriptionIndex] ?? "";
        const amount = cells[amountIndex] ?? "";
        const rawSource = sourceIndex < 0 ? "Financial record" : cells[sourceIndex] || "Financial record";
        if (!description && !amount) return [];
        return [{ id: makeId(), description, amount, source: sources.includes(rawSource) ? rawSource : "Other" }];
      });
      onRecordsChange([...records, ...nextRecords]);
      setDraft(null);
      setError("");
      setNotice(`${nextRecords.length} row${nextRecords.length === 1 ? "" : "s"} imported. Review the data before generating a draft.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read this CSV file.");
      setNotice("");
    } finally {
      event.target.value = "";
    }
  }
  function generateDraft() {
    const populated = records.filter((record) => record.description.trim() || record.amount.trim());
    const problems = populated.flatMap((record, index) => {
      if (!record.description.trim()) return [`Record ${index + 1} needs a description.`];
      if (!record.amount.trim()) return [`Record ${index + 1} needs an amount.`];
      if (!Number.isFinite(Number(record.amount)) || Number(record.amount) < 0) return [`Record ${index + 1} needs a non-negative amount.`];
      return [];
    });
    if (problems.length) {
      setError(problems.join(" "));
      setDraft(null);
      return;
    }
    const seen = new Set<string>();
    let duplicates = 0;
    populated.forEach((record) => {
      const key = `${record.description.toLowerCase()}|${record.source}|${record.amount}`;
      if (seen.has(key)) duplicates += 1;
      seen.add(key);
    });
    setError("");
    setNotice(duplicates ? `${duplicates} exact duplicate record${duplicates === 1 ? "" : "s"} found. Review to avoid double counting.` : "");
    setDraft({
      jurisdiction: jurisdictions.find((item) => item.code === jurisdiction)?.name ?? "Other / custom",
      template,
      year,
      currency,
      name,
      reference,
      notes,
      records: populated.map((record) => ({ ...record })),
      total: populated.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    });
  }

  return (
    <section className="workflow-grid">
      <div className="panel entry-panel">
        <div className="panel-heading"><span className="eyebrow">Tax workflow · 01</span><h2>Build a review-ready worksheet</h2><p>Pull together the source records behind a tax document draft.</p></div>
        <div className="form-stack">
          <label className="field"><span>Jurisdiction</span><select value={jurisdiction} onChange={(event) => changeJurisdiction(event.target.value)}>{jurisdictions.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
          <label className="field"><span>Document type</span><select value={template} onChange={(event) => { setTemplate(event.target.value); setDraft(null); }}>{currentTemplates.map((item) => <option key={item}>{item}</option>)}</select><small>Templates organize source records; they are not official tax forms.</small></label>
          <div className="two-columns"><label className="field"><span>Tax year</span><select value={year} onChange={(event) => setYear(event.target.value)}>{Array.from({ length: 9 }, (_, index) => String(new Date().getFullYear() - 1 - index)).map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Currency</span><select value={currency} onChange={(event) => setCurrency(event.target.value)}>{currencies.map((item) => <option key={item}>{item}</option>)}</select></label></div>
          <label className="field"><span>Person, business, or property</span><input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="Name for the worksheet" /></label>
          <label className="field"><span>Internal reference <small>Optional · no government ID or bank details</small></span><input value={reference} maxLength={80} onChange={(event) => setReference(event.target.value)} placeholder="File, investor, or property reference" /></label>
          <div className="records-section"><div className="section-title"><div><h3>Financial and investor records</h3><p>Import a CSV or bring allocation estimates from the next workflow.</p></div><button className="button button-quiet" type="button" onClick={() => fileInput.current?.click()}>Import CSV</button><input ref={fileInput} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={importCsv} /></div>
            <p className="format-hint">One record per line: description, amount, source · headers optional</p>
            <div className="record-list" role="table" aria-label="Tax source records"><div className="record-row record-header" role="row"><span>Record</span><span>Source</span><span>Amount</span><span className="visually-hidden">Actions</span></div>
              {records.map((record) => <div className="record-row" role="row" key={record.id}><input aria-label="Record description" value={record.description} onChange={(event) => updateRecord(record.id, { description: event.target.value })} placeholder="Record or payer" maxLength={160} /><select aria-label="Record source" value={record.source} onChange={(event) => updateRecord(record.id, { source: event.target.value })}>{sources.map((source) => <option key={source}>{source}</option>)}</select><input aria-label="Record amount" type="number" inputMode="decimal" min="0" step="0.01" value={record.amount} onChange={(event) => updateRecord(record.id, { amount: event.target.value })} placeholder="0.00" /><button className="remove-button" type="button" onClick={() => removeRecord(record.id)} aria-label="Remove record">×</button></div>)}
            </div><button className="button button-add" type="button" onClick={addRecord}>＋ Add a record</button>
          </div>
          <label className="field"><span>Notes for review</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1200} placeholder="Context, questions, or items to verify" /></label>
          {error && <p className="message message-error" role="alert">{error}</p>}{notice && <p className="message message-note" role="status">{notice}</p>}
          <div className="button-row"><button className="button button-primary" type="button" onClick={generateDraft}>Generate review draft</button><button className="button button-secondary" type="button" disabled={!draft} onClick={onPrint}>Print / PDF</button></div>
        </div>
      </div>
      <div className="panel report-panel"><div className="report-heading"><div><span className="eyebrow">Prepared document</span><h2>Tax records preview</h2></div><span className="status-tag">Review draft</span></div>
        {draft ? <article className="report-content print-area"><span className="eyebrow">{draft.jurisdiction} · {draft.year} · Review draft</span><h2 className="report-title">{draft.template}</h2><p className="report-intro">Source-record worksheet assembled for review.</p><div className="metadata-grid"><Meta label="Person / business / property" value={draft.name || "Not specified"} /><Meta label="Internal reference" value={draft.reference || "Not specified"} /><Meta label="Jurisdiction" value={draft.jurisdiction} /><Meta label="Tax year" value={draft.year} /></div>
          <table className="report-table"><thead><tr><th>Source record</th><th>Source type</th><th>Amount · {draft.currency}</th></tr></thead><tbody>{draft.records.length ? draft.records.map((record) => <tr key={record.id}><td>{record.description}</td><td><span className="source-chip">{record.source}</span></td><td>{formatMoney(Number(record.amount), draft.currency)}</td></tr>) : <tr><td colSpan={3}>No source records added</td></tr>}</tbody><tfoot><tr><td colSpan={2}>Listed source total</td><td>{formatMoney(draft.total, draft.currency)}</td></tr></tfoot></table>
          {draft.notes && <><h3 className="report-section-title">Notes for review</h3><p className="report-notes">{draft.notes}</p></>}<p className="compliance-note">Informational draft only. Check source records, applicable rules, and official forms with the relevant tax authority or a qualified professional. This worksheet does not calculate tax owed or file a return.</p><footer className="report-footer">Values remain in this browser session. No payment, filing, or external transfer was performed.</footer></article> : <EmptyPreview title="Your draft will appear here" text="Choose a document, add records from financial or investor sources, then generate a review draft." />}
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="metadata-cell"><small>{label}</small><strong>{value}</strong></div>;
}
function EmptyPreview({ title, text }: { title: string; text: string }) {
  return <div className="empty-preview"><span className="document-glyph" aria-hidden="true">↗</span><h3>{title}</h3><p>{text}</p></div>;
}
