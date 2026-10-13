# Operations & Tax Studio

A browser-only operations workspace for organizing tax source records, estimating investor distribution allocations, and tracking acquisition/property launch readiness.

## Run it

Open `index.html` in a modern browser. No build step, server, account, or external dependency is required.

## Workflows

- **Tax document engine:** Select a jurisdiction and worksheet type, assemble financial or investor source records, import a simple CSV, validate descriptions and non-negative amounts, flag possible duplicate rows, and create a printable review draft. Distribution estimates can be added as tax source records.
- **Investor distributions:** Enter a gross distribution, reserve, currency, and investor ownership percentages. The tool checks that investor names are unique and shares total 100%, estimates rounded allocations, and compares optional paid amounts to the estimate.
- **Acquisition & property launch:** Track readiness items, owners, status, launch date, and open questions. Generate and print an internal launch summary.

## Privacy and limits

All entered values and imported CSV contents are processed in the browser page. There is no backend, analytics, local storage, or network call. Values are discarded when the page is closed or refreshed. Avoid entering government identifiers, bank details, or other highly sensitive data.

The tax worksheets are informational organizers, not official government forms or tax advice. The distribution workflow performs only a simple ownership-percentage allocation; it does not apply investor agreements, distribution waterfalls, tax withholding, fees, or approval policies. It does not initiate or record payments. The launch checklist is an internal planning aid. Verify outputs with the responsible finance, tax, legal, and operations teams.

## CSV format

Use one record per line with columns `description,amount,source`. A header row is optional. Amounts should be plain numeric values; source may be `Financial record`, `Investor distribution`, `Bank statement`, `Brokerage statement`, or another value (which is grouped as `Other`). CSV parsing supports quoted commas and escaped quotes within a line.

## Extend the catalog

Edit the `jurisdictions`, `templates`, and `launchDefaults` arrays in `index.html` to add template choices, jurisdictions, or launch checklist items. The app is a static prototype; it does not connect to financial systems or operational software.
