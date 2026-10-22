import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { getErrorMessage } from '../../../api/errors'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { TextArea } from '../../../components/ui/TextArea'
import { useCreateVisit } from '../../../hooks/useVisits'

function StartVisitForm({ siteId, onDone }: { siteId: string; onDone: () => void }) {
  const navigate = useNavigate()
  const mutation = useCreateVisit(siteId)
  const [useDefault, setUseDefault] = useState(true)
  const [notes, setNotes] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate(
      { use_default_checklist: useDefault, notes: notes.trim() || null },
      {
        onSuccess: (visit) => {
          onDone()
          navigate(visit.id)
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mutation.isError && <Alert tone="error">{getErrorMessage(mutation.error)}</Alert>}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Checklist</legend>
        <label className="flex items-start gap-3 rounded-lg p-3 ring-1 ring-slate-200 has-[:checked]:ring-2 has-[:checked]:ring-amber-500">
          <input type="radio" name="checklist" checked={useDefault} onChange={() => setUseDefault(true)} className="mt-0.5 accent-amber-500" />
          <span>
            <span className="block text-sm font-medium">Standard checklist</span>
            <span className="block text-xs text-slate-500">20 common site-survey items. You can add or remove items.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-lg p-3 ring-1 ring-slate-200 has-[:checked]:ring-2 has-[:checked]:ring-amber-500">
          <input type="radio" name="checklist" checked={!useDefault} onChange={() => setUseDefault(false)} className="mt-0.5 accent-amber-500" />
          <span>
            <span className="block text-sm font-medium">Empty checklist</span>
            <span className="block text-xs text-slate-500">Start blank and add your own items.</span>
          </span>
        </label>
      </fieldset>
      <TextArea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={10000} />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          Start visit
        </Button>
      </div>
    </form>
  )
}

export function StartVisitDialog({ siteId, open, onClose }: { siteId: string; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Start a site visit">
      <StartVisitForm siteId={siteId} onDone={onClose} />
    </Modal>
  )
}
