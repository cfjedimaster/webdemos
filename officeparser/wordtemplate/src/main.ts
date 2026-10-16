import './style.css'
import { OfficeConverter, OfficeTemplate } from 'officeparser/browser-native-pdf'

type CustomerReport = {
  customerName: string
  date: string
  productsTotal: string
  reportYear: number
  profit: string
  losses: string
  recommendation: string
  reporter: string
}

const formElement = document.querySelector<HTMLFormElement>('#customer-report-form')

if (!formElement) {
  throw new Error('Customer report form was not found.')
}

const form = formElement

function readCustomerReport(formElement: HTMLFormElement): CustomerReport {
  const formData = new FormData(formElement)
  const stringValue = (name: keyof CustomerReport): string => {
    const value = formData.get(name)
    if (typeof value !== 'string') {
      throw new Error(`Missing form value: ${name}`)
    }
    return value
  }

  const dateValue = stringValue('date')
  const date = new Date(`${dateValue}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid report date.')
  }

  const productsTotal = Number(stringValue('productsTotal'))
  const profit = Number(stringValue('profit'))
  const losses = Number(stringValue('losses'))
  if (![productsTotal, profit, losses].every(Number.isFinite)) {
    throw new Error('Product total, profit, and losses must be valid numbers.')
  }

  return {
    customerName: stringValue('customerName'),
    date: new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date),
    productsTotal: new Intl.NumberFormat('en-US').format(productsTotal),
    reportYear: Number(stringValue('reportYear')),
    profit: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(profit),
    losses: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(losses),
    recommendation: stringValue('recommendation'),
    reporter: stringValue('reporter'),
  }
}

const reportPreviewElement = document.querySelector<HTMLDivElement>('#report-preview')
const reportStatus = document.querySelector<HTMLParagraphElement>('#report-status')
const downloadReportButton = document.querySelector<HTMLButtonElement>('#download-report')
const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]')

if (!reportPreviewElement || !reportStatus || !downloadReportButton || !submitButton) {
  throw new Error('A report preview or form control was not found.')
}

const reportPreview = reportPreviewElement
const reportStatusElement = reportStatus
const downloadButton = downloadReportButton
const formSubmitButton = submitButton
let generatedPdf: Uint8Array | null = null
let generatedPdfFilename = 'customer-report.pdf'
let generatedPdfUrl: string | null = null

async function fetchReportTemplate(): Promise<Uint8Array> {
  const documentUrl = new URL('./assets/customerReport.docx', import.meta.url)
  const response = await fetch(documentUrl)
  if (!response.ok) {
    throw new Error(`Could not load the report template (${response.status}).`)
  }

  return new Uint8Array(await response.arrayBuffer())
}

const reportTemplatePromise = fetchReportTemplate()

const htmlConfig = {
  htmlConfig: {
    containerWidth: '100%',
    standalone: { document: false, styles: 'scoped' as const, scripts: false },
  },
}

async function loadReportPreview(): Promise<void> {
  try {
    const templateBytes = await reportTemplatePromise
    const { value } = await OfficeConverter.convert(templateBytes, 'html', {
      generatorConfig: htmlConfig,
    })

    if (typeof value !== 'string') {
      throw new Error('The report template did not produce HTML output.')
    }

    reportPreview.innerHTML = value
    reportPreview.setAttribute('role', 'region')
    reportPreview.setAttribute('aria-label', 'Rendered customer report')
  } catch (error) {
    console.error('Failed to load the report preview.', error)
    reportStatusElement.textContent = 'The report template could not be loaded. Please check the document and try again.'
    reportStatusElement.hidden = false
    reportStatusElement.classList.add('status-error')
  }
}

async function generateReport(): Promise<void> {
  formSubmitButton.disabled = true
  formSubmitButton.textContent = 'Generating report…'
  reportPreview.setAttribute('aria-busy', 'true')
  reportStatusElement.textContent = 'Filling the template and generating the PDF…'
  reportStatusElement.hidden = false
  reportStatusElement.classList.remove('status-error')

  try {
    const report = readCustomerReport(form)
    const templateBytes = await reportTemplatePromise
    const renderedDocument = await OfficeTemplate.render(templateBytes, {
      data: report,
      onMissing: 'error',
    })
    const [htmlResult, pdfResult] = await Promise.all([
      OfficeConverter.convert(renderedDocument, 'html', {
        generatorConfig: htmlConfig,
      }),
      OfficeConverter.convert(renderedDocument, 'pdf', {
        generatorConfig: {
          pdfConfig: { engine: 'native' },
        },
      }),
    ])

    if (typeof htmlResult.value !== 'string') {
      throw new Error('The generated report did not produce HTML output.')
    }
    if (!(pdfResult.value instanceof Uint8Array)) {
      throw new Error('The generated report did not produce PDF data.')
    }

    reportPreview.innerHTML = htmlResult.value
    generatedPdf = pdfResult.value
    generatedPdfFilename = `${report.customerName.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'customer'}-report.pdf`
    if (generatedPdfUrl) {
      URL.revokeObjectURL(generatedPdfUrl)
    }
    const pdfBuffer = new ArrayBuffer(generatedPdf.byteLength)
    new Uint8Array(pdfBuffer).set(generatedPdf)
    generatedPdfUrl = URL.createObjectURL(new Blob([pdfBuffer], { type: 'application/pdf' }))
    downloadButton.hidden = false
    reportStatusElement.textContent = 'Report preview updated. Your PDF is ready to download.'
  } catch (error) {
    console.error('Failed to generate the customer report.', error)
    reportStatusElement.textContent = 'The report could not be generated. Please check your entries and try again.'
    reportStatusElement.classList.add('status-error')
  } finally {
    formSubmitButton.disabled = false
    formSubmitButton.textContent = 'Submit report →'
    reportPreview.removeAttribute('aria-busy')
  }
}

downloadButton.addEventListener('click', () => {
  if (!generatedPdfUrl) {
    return
  }

  const downloadLink = document.createElement('a')
  downloadLink.href = generatedPdfUrl
  downloadLink.download = generatedPdfFilename
  downloadLink.hidden = true
  document.body.append(downloadLink)
  downloadLink.click()
  downloadLink.remove()
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  void generateReport()
})

void loadReportPreview()
