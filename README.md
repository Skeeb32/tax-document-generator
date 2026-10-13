# Tax Document Studio

A private-by-design, browser-only starter for organizing tax information into printable worksheets. Choose a jurisdiction, select a template, enter records and amounts, preview the document, and use your browser's print dialog to save a PDF.

## Run it

Open `index.html` in a modern browser. No build step, server, account, or external dependency is required.

## Included starter catalog

The catalog includes individual organizers and business income/expense summaries for the United States, Canada, United Kingdom, Australia, India, New Zealand, Ireland, Germany, France, and Japan. US examples include W-2, 1099-INT, 1099-NEC information worksheets, a self-employment summary, and a charitable contribution record. “Other / custom” offers a general worksheet.

These are informational organizers and drafts. The app does not calculate tax liability, reproduce official government forms, provide tax advice, or submit a filing. Verify all requirements and figures with the relevant tax authority or a qualified tax professional.

## Privacy

All entered values are processed in the browser page. The starter has no backend, analytics, local storage, or network calls. Values are discarded when the page is closed or refreshed. Avoid entering Social Security numbers, tax identification numbers, bank details, or other highly sensitive identifiers.

## Extend the catalog

Add template metadata to the `documents` array in `index.html`. Each entry uses a jurisdiction ID from `jurisdictions` and includes a title, description, category, and badge. The shared worksheet layout can be extended with template-specific fields as needed.
