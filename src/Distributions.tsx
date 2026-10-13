import { useState } from "react";
import { currencies, formatMoney, fromMinorUnits, makeId, toMinorUnits } from "./format";
import type { DistributionResult, InvestorInput, TaxRecord } from "./types";

type DistributionProps = {
  onUseForTax: (records: TaxRecord[]) => void;
  onPrint: () => void;
};
const blankInvestor = (): InvestorInput => ({ id: makeId(), name: "", share: "", paid: "" });

export function Distributions({ onUseForTax, onPrint }: DistributionProps) {
  const [property, setProperty] = useState("");
  const [period, setPeriod] = useState("");
  const [gross, setGross] = useState("");
  const [reserve, setReserve] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [investors, setInvestors] = useState<InvestorInput[]>([blankInvestor()]);
  const [result, setResult] = useState<DistributionResult | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function change<T extends keyof InvestorInput>(id: string, key: T, value: InvestorInput[T]) {
    setInvestors((items) => items.map((item) => item.id === id ? { ...item, [key]: value } : item));
    setResult(null);
  }
  function calculate() {
    const grossMinor = toMinorUnits(gross, currency);
    const reserveMinor = toMinorUnits(reserve || "0", currency);
    const problems: string[] = [];
    if (!gross.trim() || !Number.isFinite(grossMinor) || grossMinor < 0) problems.push("Enter a valid non-negative gross distribution.");
    if (!Number.isFinite(reserveMinor) || reserveMinor < 0) problems.push("Enter a valid non-negative reserve.");
    if (Number.isFinite(grossMinor) && Number.isFinite(reserveMinor) && reserveMinor > grossMinor) problems.push("The reserve cannot exceed the gross distribution.");
    if (investors.length === 0) problems.push("Add at least one investor.");
    investors.forEach((investor, index) => {
      const share = Number(investor.share);
      const paid = investor.paid.trim() ? toMinorUnits(investor.paid, currency) : null;
      if (!investor.name.trim()) problems.push(`Investor ${index + 1} needs a name or internal reference.`);
      if (!investor.share.trim() || !Number.isFinite(share) || share < 0 || share > 100) problems.push(`Investor ${index + 1} needs a valid share from 0 to 100%.`);
      if (paid !== null && (!Number.isFinite(paid) || paid < 0)) problems.push(`Investor ${index + 1} paid amount must be non-negative.`);
      if (investors.slice(0, index).some((previous) => previous.name.trim().toLowerCase() === investor.name.trim().toLowerCase())) problems.push(`Investor name “${investor.name}” is duplicated.`);
    });
    const shareTotal = investors.reduce((sum, investor) => sum + Number(investor.share || 0), 0);
    if (Math.abs(shareTotal - 100) > 0.005) problems.push(`Ownership shares total ${shareTotal.toFixed(2)}%; they must total 100%.`);
    if (problems.length) {
      setError(problems.join(" "));
      setNotice("");
      setResult(null);
      return;
    }

    const distributableMinor = grossMinor - reserveMinor;
    const pending = investors.map((investor, index) => {
      const exact = distributableMinor * Number(investor.share) / 100;
      return { investor, index, exact, estimateMinor: Math.floor(exact) };
    });
    let remaining = distributableMinor - pending.reduce((sum, item) => sum + item.estimateMinor, 0);
    [...pending].sort((a, b) => (b.exact - b.estimateMinor) - (a.exact - a.estimateMinor) || a.index - b.index).forEach((item) => {
      if (remaining > 0) {
        item.estimateMinor += 1;
        remaining -= 1;
      }
    });
    pending.sort((a, b) => a.index - b.index);
    const allocations = pending.map(({ investor, estimateMinor }) => {
      const paidMinor = investor.paid.trim() ? toMinorUnits(investor.paid, currency) : null;
      return { id: investor.id, name: investor.name.trim(), share: Number(investor.share), estimateMinor, paidMinor, varianceMinor: paidMinor === null ? null : paidMinor - estimateMinor };
    });
    setResult({ property: property.trim(), period: period.trim(), currency, grossMinor, reserveMinor, distributableMinor, allocations });
    setError("");
    setNotice("");
  }
  function updateField(setter: (value: string) => void, value: string) {
    setter(value);
    setResult(null);
  }
  function sendToTax() {
    if (!result) return;
    onUseForTax(result.allocations.map((allocation) => ({
      id: makeId(), description: `${result.property || "Property"} · ${allocation.name} distribution`,
      source: "Investor distribution", amount: fromMinorUnits(allocation.estimateMinor, result.currency).toFixed(result.currency === "JPY" ? 0 : 2),
    })));
    setNotice("Allocation estimates were added to tax records. Review tax treatment and supporting statements before using them.");
  }

  const paidTotal = result?.allocations.reduce((sum, item) => sum + (item.paidMinor ?? 0), 0) ?? 0;
  return (
    <section className="workflow-grid">
      <div className="panel entry-panel">
        <div className="panel-heading"><span className="eyebrow">Distribution workflow · 02</span><h2>Estimate investor allocations</h2><p>Review ownership-based estimates and reconcile against entered payment records.</p></div>
        <div className="form-stack">
          <div className="two-columns"><label className="field"><span>Property or fund</span><input value={property} maxLength={120} onChange={(event) => updateField(setProperty, event.target.value)} placeholder="Internal name" /></label><label className="field"><span>Distribution period</span><input value={period} maxLength={60} onChange={(event) => updateField(setPeriod, event.target.value)} placeholder="For example, Q3 2026" /></label></div>
          <div className="three-columns"><label className="field"><span>Gross distribution</span><input type="number" min="0" step={currency === "JPY" ? "1" : "0.01"} inputMode="decimal" value={gross} onChange={(event) => updateField(setGross, event.target.value)} placeholder="0.00" /></label><label className="field"><span>Reserve / holdback</span><input type="number" min="0" step={currency === "JPY" ? "1" : "0.01"} inputMode="decimal" value={reserve} onChange={(event) => updateField(setReserve, event.target.value)} /></label><label className="field"><span>Currency</span><select value={currency} onChange={(event) => updateField(setCurrency, event.target.value)}>{currencies.map((item) => <option key={item}>{item}</option>)}</select></label></div>
          <div className="records-section"><div className="section-title"><div><h3>Investor allocation &amp; reconciliation</h3><p>Ownership shares must total 100%. Enter paid amounts only when reconciling recorded payments.</p></div></div>
            <div className="record-list investor-list"><div className="investor-row investor-header"><span>Investor</span><span>Share %</span><span>Paid amount</span><span className="visually-hidden">Actions</span></div>
              {investors.map((investor) => <div className="investor-row" key={investor.id}><input aria-label="Investor name" value={investor.name} maxLength={120} onChange={(event) => change(investor.id, "name", event.target.value)} placeholder="Investor" /><input aria-label="Ownership share percent" type="number" min="0" max="100" step="0.01" inputMode="decimal" value={investor.share} onChange={(event) => change(investor.id, "share", event.target.value)} placeholder="0.00" /><input aria-label="Paid amount, optional" type="number" min="0" step={currency === "JPY" ? "1" : "0.01"} inputMode="decimal" value={investor.paid} onChange={(event) => change(investor.id, "paid", event.target.value)} placeholder="Optional" /><button className="remove-button" type="button" onClick={() => { setInvestors((items) => items.filter((item) => item.id !== investor.id)); setResult(null); }} aria-label={`Remove ${investor.name || "investor"}`}>×</button></div>)}
            </div><button className="button button-add" type="button" onClick={() => { setInvestors((items) => [...items, blankInvestor()]); setResult(null); }}>＋ Add investor</button>
          </div>
          {error && <p className="message message-error" role="alert">{error}</p>}{notice && <p className="message message-note" role="status">{notice}</p>}
          <div className="button-row"><button className="button button-primary" type="button" onClick={calculate}>Calculate allocation estimate</button><button className="button button-secondary" type="button" disabled={!result} onClick={onPrint}>Print / PDF</button></div>
        </div>
      </div>
      <div className="panel report-panel"><div className="report-heading"><div><span className="eyebrow">Estimate &amp; reconciliation</span><h2>Distribution preview</h2></div><span className="status-tag">No payment processing</span></div>
        {result ? <article className="report-content print-area"><span className="eyebrow">Allocation worksheet · estimate only</span><h2 className="report-title">{result.property || "Investor distribution"}</h2><p className="report-intro">{result.period || "Period not specified"} · ownership-based allocation using entered values.</p><div className="metric-grid"><Metric label="Gross distribution" value={formatMoney(fromMinorUnits(result.grossMinor, result.currency), result.currency)} /><Metric label="Reserve / holdback" value={formatMoney(fromMinorUnits(result.reserveMinor, result.currency), result.currency)} /><Metric label="Net available" value={formatMoney(fromMinorUnits(result.distributableMinor, result.currency), result.currency)} /></div>
          <table className="report-table"><thead><tr><th>Investor</th><th>Share</th><th>Estimated allocation</th><th>Paid amount</th><th>Variance</th></tr></thead><tbody>{result.allocations.map((allocation) => <tr key={allocation.id}><td>{allocation.name}</td><td>{allocation.share.toFixed(2)}%</td><td>{formatMoney(fromMinorUnits(allocation.estimateMinor, result.currency), result.currency)}</td><td>{allocation.paidMinor === null ? "Not entered" : formatMoney(fromMinorUnits(allocation.paidMinor, result.currency), result.currency)}</td><td>{allocation.varianceMinor === null ? "—" : formatMoney(fromMinorUnits(allocation.varianceMinor, result.currency), result.currency)}</td></tr>)}</tbody><tfoot><tr><td>Total</td><td>100.00%</td><td>{formatMoney(fromMinorUnits(result.distributableMinor, result.currency), result.currency)}</td><td>{formatMoney(fromMinorUnits(paidTotal, result.currency), result.currency)}</td><td>{formatMoney(fromMinorUnits(paidTotal - result.distributableMinor, result.currency), result.currency)}</td></tr></tfoot></table>
          <p className="compliance-note">Planning estimate only. Confirm governing documents, distribution rules, approvals, reserves, investor data, and reconciliation before processing payments. This tool does not initiate or record transactions.</p><footer className="report-footer">Calculated from the user-entered amount, reserve, and ownership percentages. No external transfer was performed.</footer><button className="button button-secondary transfer-button" type="button" onClick={sendToTax}>Add allocations to tax records</button></article> : <EmptyPreview title="Allocation preview" text="Enter a gross amount, reserve, and ownership percentages. A review estimate will appear here." />}
      </div>
    </section>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><small>{label}</small><strong>{value}</strong></div>;
}
function EmptyPreview({ title, text }: { title: string; text: string }) {
  return <div className="empty-preview"><span className="document-glyph" aria-hidden="true">↗</span><h3>{title}</h3><p>{text}</p></div>;
}
