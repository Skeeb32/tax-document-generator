# Operations & Tax Studio

React and TypeScript application for browser-local tax source records, investor distribution estimates, and acquisition/property launch readiness.

## Development

- `npm run dev` starts the Vite development server.
- `npm run build` type-checks the application and creates the static site in `dist/`.

## Privacy and limits

The app keeps input values in React state in the active page session. It does not write records to a server or browser storage, and it does not connect to payment, tax, or operations systems. CSV imports are read by the browser locally.

Tax worksheets are informational organizers, not official government forms or tax advice. Distribution estimates use only the entered ownership percentages and reserve; they do not apply investment agreements, waterfalls, fees, tax withholding, or approvals. No payment is initiated. The property launch checklist is a planning tool.
