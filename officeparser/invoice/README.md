# Invoice PDF demo

Put `invoiceTemplate.docx` in this directory, then run:

```sh
npm install
npm start
```

This demo requires Node.js 22.13 or newer.

By default, the script reads `invoices.json` and writes one PDF per invoice to
`output/`. You can pass another JSON file and output directory:

```sh
node script.js ./my-invoices.json ./generated-invoices
```

The JSON file has an `invoices` array. Each entry requires a positive integer
`invoiceNumber`, customer `name` and `email`, and at least one `lineItems`
entry with a `description`, positive integer `quantity`, and non-negative
numeric `unitCost`.

The Word template can use these invoice fields:

- `{{invoiceNumber}}` — read from each invoice's JSON data.
- `{{invoiceDate}}` — the date the script runs; format with
  `{{invoiceDate | format "MMMM d, yyyy"}}` if desired.
- `{{recipientName}}` and `{{recipientEmail}}`
- `{{subtotal | format "$#,##0.00"}}`
- `{{salesTax | format "$#,##0.00"}}` — calculated at 5%.
- `{{total | format "$#,##0.00"}}` — subtotal plus sales tax (total due).

To repeat item rows in a Word table, put `{{ for item in lineItems }}` in the
first cell of the detail row and `{{ endfor }}` in its last cell. In between,
use `{{item.description}}`, `{{item.quantity}}`,
`{{item.unitCost | format "$#,##0.00"}}`, and
`{{item.total | format "$#,##0.00"}}`. The same line total is also available
as `{{item.lineTotal}}`. Add a header row above it and place the subtotal, sales
tax, and total due below the table.

The script uses officeparser's native PDF engine, so no browser or separate
Office installation is needed.
