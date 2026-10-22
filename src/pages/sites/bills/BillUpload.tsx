import { useRef, useState, type DragEvent } from 'react'
import { getErrorMessage } from '../../../api/errors'
import type { TNBBill } from '../../../api/types'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { useUploadBill } from '../../../hooks/useBills'
import { cn } from '../../../lib/cn'
import { countParsedFields, PARSED_FIELD_COUNT } from './billFields'

type UploadResult = { file: string; ok: true; bill: TNBBill } | { file: string; ok: false; message: string }

function isPdf(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

export function BillUpload({ siteId }: { siteId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadBill(siteId)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [results, setResults] = useState<UploadResult[]>([])

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (!files.length) return
    const next: UploadResult[] = []
    // One at a time keeps the order predictable and the server load low.
    for (const file of files) {
      if (!isPdf(file)) {
        next.push({ file: file.name, ok: false, message: 'Not a PDF. Upload the bill PDF from myTNB.' })
        continue
      }
      setUploading(file.name)
      try {
        const bill = await upload.mutateAsync(file)
        next.push({ file: file.name, ok: true, bill })
      } catch (error) {
        next.push({ file: file.name, ok: false, message: getErrorMessage(error, 'Upload failed.') })
      }
    }
    setUploading(null)
    setResults(next)
    if (inputRef.current) inputRef.current.value = ''
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    void handleFiles(event.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragging ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-white',
        )}
      >
        <p className="text-sm text-slate-600">
          Drop TNB bill PDFs here, or choose files. Upload 12 months for the most accurate report.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          id="bill-file-input"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <Button loading={uploading !== null} onClick={() => inputRef.current?.click()}>
          {uploading ? `Uploading ${uploading}…` : 'Choose PDF files'}
        </Button>
      </div>

      {results.map((result, i) =>
        result.ok ? (
          <Alert key={`${result.file}-${i}`} tone={countParsedFields(result.bill) === PARSED_FIELD_COUNT ? 'success' : 'warning'}>
            <strong>{result.file}</strong>: uploaded. Read {countParsedFields(result.bill)} of {PARSED_FIELD_COUNT} fields
            {countParsedFields(result.bill) < PARSED_FIELD_COUNT && '; the rest couldn’t be read from this layout'}.
          </Alert>
        ) : (
          <Alert key={`${result.file}-${i}`} tone="error">
            <strong>{result.file}</strong>: {result.message}
          </Alert>
        ),
      )}
    </div>
  )
}
