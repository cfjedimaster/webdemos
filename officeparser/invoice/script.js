const { readFile, mkdir, writeFile } = require('node:fs/promises')
const path = require('node:path')
const { OfficeConverter, OfficeTemplate } = require('officeparser')

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string.`)
  }

  return value.trim()
}

function toCents(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`)
  }

  const cents = Math.round((value + Number.EPSILON) * 100)
  if (!Number.isSafeInteger(cents)) {
    throw new Error(`${label} is too large to represent as currency.`)
  }

  return cents
}

function buildInvoiceData(json, issuedOn = new Date()) {
  if (!isRecord(json) || !Array.isArray(json.invoices) || json.invoices.length === 0) {
    throw new Error('The JSON file must contain a non-empty "invoices" array.')
  }

  const invoiceDate = [
    issuedOn.getFullYear(),
    String(issuedOn.getMonth() + 1).padStart(2, '0'),
    String(issuedOn.getDate()).padStart(2, '0'),
  ].join('-')

  return json.invoices.map((invoice, invoiceIndex) => {
    const invoiceLabel = `Invoice ${invoiceIndex + 1}`
    if (!isRecord(invoice)) {
      throw new Error(`${invoiceLabel} must be an object.`)
    }

    if (!Number.isSafeInteger(invoice.invoiceNumber) || invoice.invoiceNumber <= 0) {
      throw new Error(`${invoiceLabel} invoiceNumber must be a positive whole number.`)
    }

    const recipientName = requireText(invoice.name, `${invoiceLabel} name`)
    const recipientEmail = requireText(invoice.email, `${invoiceLabel} email`)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      throw new Error(`${invoiceLabel} email must be a valid email address.`)
    }
    if (!Array.isArray(invoice.lineItems) || invoice.lineItems.length === 0) {
      throw new Error(`${invoiceLabel} must contain at least one line item.`)
    }

    let subtotalCents = 0
    const lineItems = invoice.lineItems.map((item, itemIndex) => {
      const itemLabel = `${invoiceLabel} line item ${itemIndex + 1}`
      if (!isRecord(item)) {
        throw new Error(`${itemLabel} must be an object.`)
      }

      const description = requireText(item.description, `${itemLabel} description`)
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
        throw new Error(`${itemLabel} quantity must be a positive whole number.`)
      }

      const unitCostCents = toCents(item.unitCost, `${itemLabel} unitCost`)
      const lineTotalCents = unitCostCents * item.quantity
      if (!Number.isSafeInteger(lineTotalCents) || !Number.isSafeInteger(subtotalCents + lineTotalCents)) {
        throw new Error(`${itemLabel} total is too large to represent as currency.`)
      }
      subtotalCents += lineTotalCents

      return {
        description,
        quantity: item.quantity,
        unitCost: unitCostCents / 100,
        total: lineTotalCents / 100,
        lineTotal: lineTotalCents / 100,
      }
    })

    const invoiceNumber = String(invoice.invoiceNumber)
    const salesTaxCents = Math.round(subtotalCents / 20)
    const totalCents = subtotalCents + salesTaxCents
    if (!Number.isSafeInteger(totalCents)) {
      throw new Error(`${invoiceLabel} total due is too large to represent as currency.`)
    }

    return {
      invoiceNumber,
      invoiceDate,
      recipientName,
      recipientEmail,
      lineItems,
      subtotal: subtotalCents / 100,
      salesTax: salesTaxCents / 100,
      total: totalCents / 100,
    }
  })
}

function makeFilename(invoice) {
  const customerSlug = invoice.recipientName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'customer'

  return `${invoice.invoiceNumber.toLowerCase()}-${customerSlug}.pdf`
}

async function generateInvoices(inputPath, outputPath, templatePath) {
  const input = JSON.parse(await readFile(inputPath, 'utf8'))
  const invoices = buildInvoiceData(input)
  const template = await readFile(templatePath)

  await mkdir(outputPath, { recursive: true })

  const renderedDocuments = await OfficeTemplate.render(template, {
    data: invoices,
    onMissing: 'error',
  })
  if (!Array.isArray(renderedDocuments) || renderedDocuments.length !== invoices.length) {
    throw new Error('officeparser did not return one rendered document per invoice.')
  }

  for (const [index, invoice] of invoices.entries()) {
    const renderedDocx = renderedDocuments[index]
    if (!(renderedDocx instanceof Uint8Array)) {
      throw new Error(`officeparser did not return a rendered document for ${invoice.invoiceNumber}.`)
    }

    const { value: pdfBytes } = await OfficeConverter.convert(renderedDocx, 'pdf', {
      generatorConfig: {
        pdfConfig: { engine: 'native' },
      },
    })

    if (!(pdfBytes instanceof Uint8Array)) {
      throw new Error(`officeparser did not return PDF data for ${invoice.invoiceNumber}.`)
    }

    const outputFile = path.join(outputPath, makeFilename(invoice))
    await writeFile(outputFile, pdfBytes)
    console.log(`Created ${outputFile}`)
  }
}

async function main(args) {
  if (args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: node script.js [invoices.json] [output-directory]')
    return
  }
  if (args.length > 2) {
    throw new Error('Usage: node script.js [invoices.json] [output-directory]')
  }

  const inputPath = args[0]
    ? path.resolve(args[0])
    : path.join(__dirname, 'invoices.json')
  const outputPath = args[1]
    ? path.resolve(args[1])
    : path.join(__dirname, 'output')
  const templatePath = path.join(__dirname, 'invoiceTemplate.docx')

  await generateInvoices(inputPath, outputPath, templatePath)
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((error) => {
    console.error('Invoice generation failed:', error)
    process.exitCode = 1
  })
}

module.exports = { buildInvoiceData, generateInvoices, makeFilename }
