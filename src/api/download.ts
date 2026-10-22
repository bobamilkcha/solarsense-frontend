import { isAxiosError, type AxiosResponse } from 'axios'
import { api } from './client'

function filenameFrom(response: AxiosResponse<Blob>, fallback: string): string {
  const header = response.headers['content-disposition']
  if (typeof header === 'string') {
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)
    if (utf8?.[1]) return decodeURIComponent(utf8[1])
    const plain = /filename="?([^";]+)"?/i.exec(header)
    if (plain?.[1]) return plain[1]
  }
  return fallback
}

/** Error bodies of blob requests arrive as a Blob; turn them back into JSON so getErrorMessage works. */
async function unwrapBlobError(error: unknown): Promise<never> {
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await error.response.data.text())
    } catch {
      // Not JSON: keep the status-based fallback message.
    }
  }
  throw error
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Download a file from an authenticated endpoint. A plain <a href> can't send
 * the Bearer token, so fetch it as a blob and save it.
 */
export async function downloadFile(url: string, params: Record<string, unknown>, fallbackName: string): Promise<void> {
  try {
    const response = await api.get<Blob>(url, { params, responseType: 'blob' })
    saveBlob(response.data, filenameFrom(response, fallbackName))
  } catch (error) {
    await unwrapBlobError(error)
  }
}

/** Fetch an authenticated file as a blob without saving it (e.g. to preview a PDF). */
export async function fetchBlob(url: string): Promise<Blob> {
  try {
    const response = await api.get<Blob>(url, { responseType: 'blob' })
    return response.data
  } catch (error) {
    return unwrapBlobError(error)
  }
}
