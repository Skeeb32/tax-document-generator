import { useState } from "react";
import { makeId } from "./format";
import type { ChecklistItem } from "./types";

type LaunchProps = { onPrint: () => void };
type Summary = { property: string; targetDate: string; lead: string; notes: string; items: ChecklistItem[]; percent: number };
const initialTitles = [
  "Acquisition approval recorded",
  "Property and ownership data verified",
  "Entity and investor records reviewed",
  "Vendor and supplier setup complete",
  "Operating budget and reserve confirmed",
  "Property operations handoff completed",
  "Required documents and agreements collected",
  "Launch sign-off recorded",
];
const blankItem = (title = ""): ChecklistItem => ({ id: makeId(), title, owner: "", status: "Not started" });
const statuses: ChecklistItem["status"][] = ["Not started", "In progress", "Ready", "Blocked"];

export function LaunchReadiness({ onPrint }: LaunchProps) {
  const [property, setProperty] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [lead, setLead] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState(initialTitles.map((title) => blankItem(title)));
  const [summary, setSummary] = useState<Summary | null>(null);

  function updateItem(id: string, change: Partial<ChecklistItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...change } : item));
    setSummary(null);
  }
  const readyCount = items.filter((item) => item.status === "Ready").length;
  const percent = items.length ? Math.round((readyCount / items.length) * 100) : 0;
  function createSummary() {
    const included = items.filter((item) => item.title.trim()).map((item) => ({ ...item }));
    if (!included.length) return;
    const ready = included.filter((item) => item.status === "Ready").length;
    setSummary({ property: property.trim() || "Property / acquisition not specified", targetDate, lead, notes, items: included, percent: Math.round(ready / included.length * 100) });
  }

  return (
    <section className="workflow-grid">
      <div className="panel entry-panel">
        <div className="panel-heading"><span className="eyebrow">Operations workflow · 03</span><h2>Prepare a property launch</h2><p>Coordinate the data, vendor, finance, and team handoffs that support a launch.</p></div>
        <div className="form-stack">
          <div className="two-columns"><label className="field"><span>Property or acquisition</span><input value={property} maxLength={120} onChange={(event) => { setProperty(event.target.value); setSummary(null); }} placeholder="Property name" /></label><label className="field"><span>Target launch date</span><input type="date" value={targetDate} onChange={(event) => { setTargetDate(event.target.value); setSummary(null); }} /></label></div>
          <label className="field"><span>Operations lead</span><input value={lead} maxLength={100} onChange={(event) => { setLead(event.target.value); setSummary(null); }} placeholder="Owner for this readiness review" /></label>
          <div className="readiness-meter"><div><span className="eyebrow">Checklist completion</span><strong>{percent}%</strong></div><div className="progress-track" role="progressbar" aria-label="Checklist completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div><small>{readyCount} of {items.length} items ready</small></div>
          <div className="records-section"><div className="section-title"><div><h3>Readiness checklist</h3><p>Assign an owner and status to each operational step.</p></div></div>
            <div className="record-list launch-list"><div className="launch-row launch-header"><span>Readiness item</span><span>Owner</span><span>Status</span><span className="visually-hidden">Actions</span></div>
              {items.map((item) => <div className="launch-row" key={item.id}><input aria-label="Readiness item" value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} placeholder="Checklist item" maxLength={150} /><input aria-label="Checklist owner" value={item.owner} onChange={(event) => updateItem(item.id, { owner: event.target.value })} placeholder="Owner" maxLength={100} /><select aria-label={`Status for ${item.title || "checklist item"}`} value={item.status} onChange={(event) => updateItem(item.id, { status: event.target.value as ChecklistItem["status"] })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select><button className="remove-button" type="button" onClick={() => { setItems((current) => current.filter((candidate) => candidate.id !== item.id)); setSummary(null); }} aria-label={`Remove ${item.title || "checklist item"}`}>×</button></div>)}
            </div><button className="button button-add" type="button" onClick={() => { setItems((current) => [...current, blankItem()]); setSummary(null); }}>＋ Add a checklist item</button>
          </div>
          <label className="field"><span>Open questions / launch notes</span><textarea rows={3} value={notes} maxLength={1200} onChange={(event) => { setNotes(event.target.value); setSummary(null); }} placeholder="Risks, decisions, or handoffs to confirm" /></label>
          <div className="button-row"><button className="button button-primary" type="button" onClick={createSummary}>Create readiness summary</button><button className="button button-secondary" type="button" disabled={!summary} onClick={onPrint}>Print / PDF</button></div>
        </div>
      </div>
      <div className="panel report-panel"><div className="report-heading"><div><span className="eyebrow">Acquisition &amp; operations</span><h2>Launch readiness</h2></div><span className="status-tag">Internal review</span></div>
        {summary ? <article className="report-content print-area"><span className="eyebrow">Property operations · Readiness review</span><h2 className="report-title">{summary.property}</h2><p className="report-intro">Acquisition and launch checklist summary.</p><div className="metadata-grid"><Meta label="Target launch date" value={summary.targetDate || "Not set"} /><Meta label="Operations lead" value={summary.lead || "Not assigned"} /><Meta label="Checklist readiness" value={`${summary.percent}% · ${summary.items.filter((item) => item.status === "Ready").length} of ${summary.items.length} items ready`} /><Meta label="Blocked items" value={String(summary.items.filter((item) => item.status === "Blocked").length)} /></div>
          <table className="report-table"><thead><tr><th>Readiness item</th><th>Owner</th><th>Status</th></tr></thead><tbody>{summary.items.map((item) => <tr key={item.id}><td>{item.title}</td><td>{item.owner || "Unassigned"}</td><td><span className={`source-chip ${item.status === "Ready" ? "chip-ready" : item.status === "Blocked" ? "chip-blocked" : ""}`}>{item.status}</span></td></tr>)}</tbody></table>{summary.notes && <><h3 className="report-section-title">Open questions / notes</h3><p className="report-notes">{summary.notes}</p></>}<p className="compliance-note">Internal planning summary. Confirm property details, approvals, vendor setup, operational handoffs, legal documents, and launch criteria with responsible teams.</p><footer className="report-footer">Checklist values are held in this browser session and are not shared with other users or systems.</footer></article> : <EmptyPreview title="Readiness summary" text="Track the operational handoffs that need to be complete before a property goes live." />}
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
