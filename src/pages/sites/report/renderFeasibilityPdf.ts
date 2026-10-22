import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import type { FeasibilityReport } from '../../../api/types'
import { FeasibilityDocument, type PdfMeta } from './FeasibilityDocument'

export async function renderFeasibilityPdf(report: FeasibilityReport, meta: PdfMeta): Promise<Blob> {
  // pdf() expects a <Document> element; FeasibilityDocument renders one.
  return pdf(createElement(FeasibilityDocument, { report, meta }) as Parameters<typeof pdf>[0]).toBlob()
}
