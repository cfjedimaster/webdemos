# DOCX template to PDF

```js
import { OfficeConverter, OfficeTemplate } from 'officeparser/browser-native-pdf'
```

Grab the Word document as binary data:

```js
const response = await fetch('/assets/customerReport.docx')
const template = new Uint8Array(await response.arrayBuffer())
```

Here's the data to fill the template:

```js
const data = {
  customerName: 'Northwind & Co',
  date: '2026-10-16',
  productsTotal: 7,
  reportYear: 2026,
  profit: 2500,
  losses: 125,
  recommendation: 'Continue growing.',
  reporter: 'Sam Reporter',
}
```

Render a new Word document with the data:

```js
const docx = await OfficeTemplate.render(template, { data })
```

Convert the rendered document to PDF. The result's `value` is the PDF's binary
data:

```js
const { value: pdfBytes } = await OfficeConverter.convert(docx, 'pdf', {
  generatorConfig: { pdfConfig: { engine: 'native' } },
})
```

For example, open the PDF in a new tab:

```js
const pdf = new Blob([pdfBytes], { type: 'application/pdf' })
window.open(URL.createObjectURL(pdf), '_blank')
```

The browser-native PDF engine requires the `pdf-lib` package. The DOCX template
should contain matching placeholders such as `{{customerName}}` and `{{profit}}`.
