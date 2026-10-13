import { useState } from "react";
import { Distributions } from "./Distributions";
import { LaunchReadiness } from "./LaunchReadiness";
import { TaxDocuments } from "./TaxDocuments";
import { makeId } from "./format";
import type { TaxRecord } from "./types";

type Workflow = "tax" | "distributions" | "launch";
const tabLabels: { id: Workflow; label: string; index: string; description: string }[] = [
  { id: "tax", label: "Tax document engine", index: "01", description: "Organize source records into review drafts." },
  { id: "distributions", label: "Investor distributions", index: "02", description: "Estimate allocations and reconcile paid amounts." },
  { id: "launch", label: "Acquisition & property launch", index: "03", description: "Track readiness across operational handoffs." },
];

export default function App() {
  const [active, setActive] = useState<Workflow>("tax");
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([{ id: makeId(), description: "", source: "Financial record", amount: "" }]);
  const [taxNotice, setTaxNotice] = useState("");
  function addDistributionRecords(records: TaxRecord[]) {
    setTaxRecords((current) => [...current.filter((record) => record.description || record.amount), ...records]);
    setTaxNotice(`${records.length} investor distribution estimate${records.length === 1 ? "" : "s"} added. Review their tax treatment and supporting statements.`);
    setActive("tax");
  }
  function printCurrent() {
    window.print();
  }
  return (
    <main className="app-shell">
      <header className="masthead"><a className="brand" href="#top" aria-label="Operations and Tax Studio home"><span className="brand-emblem" aria-hidden="true">OT</span><span>Operations <i>&amp;</i> Tax Studio</span></a><div className="privacy-label"><span className="privacy-dot" /> Private by design <span className="privacy-divider">·</span> Local session only</div></header>
      <section className="intro" id="top"><div className="intro-copy"><span className="eyebrow">The operations desk</span><h1>Move from raw details<br />to a ready review.</h1><p>A focused workspace for the work behind tax packets, investor distributions, and property launches.</p></div><aside className="intro-note"><span className="note-icon" aria-hidden="true">↳</span><p><strong>Review drafts, not final decisions.</strong><br />Values stay in this browser session. Nothing is filed, paid, or sent to an outside system.</p></aside></section>
      <nav className="workflow-tabs" role="tablist" aria-label="Studio workflows">{tabLabels.map((tab) => <button className={`workflow-tab ${active === tab.id ? "is-active" : ""}`} key={tab.id} type="button" role="tab" id={`tab-${tab.id}`} aria-selected={active === tab.id} aria-controls={`panel-${tab.id}`} onClick={() => setActive(tab.id)}><span className="tab-index">{tab.index}</span><span className="tab-copy"><strong>{tab.label}</strong><small>{tab.description}</small></span><span className="tab-arrow" aria-hidden="true">↗</span></button>)}</nav>
      <div id="panel-tax" role="tabpanel" aria-labelledby="tab-tax" className="workflow-panel" hidden={active !== "tax"}><TaxDocuments records={taxRecords} onRecordsChange={setTaxRecords} onPrint={printCurrent} externalNotice={taxNotice} /></div>
      <div id="panel-distributions" role="tabpanel" aria-labelledby="tab-distributions" className="workflow-panel" hidden={active !== "distributions"}><Distributions onUseForTax={addDistributionRecords} onPrint={printCurrent} /></div>
      <div id="panel-launch" role="tabpanel" aria-labelledby="tab-launch" className="workflow-panel" hidden={active !== "launch"}><LaunchReadiness onPrint={printCurrent} /></div>
      <footer className="app-footer"><p>Built for careful review. Check business rules and source documents with your finance, tax, legal, and operations teams.</p><span>Operations &amp; Tax Studio <b>·</b> 0.2</span></footer>
    </main>
  );
}
