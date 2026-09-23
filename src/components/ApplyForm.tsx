import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, LoaderCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  submitApplication,
  type PersonioJob,
} from '@/lib/personio'

type ApplyFormProps = {
  job: PersonioJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ApplyForm = ({ job, open, onOpenChange }: ApplyFormProps) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [cv, setCv] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setMessage('')
    setCv(null)
    setSubmitting(false)
    setSent(false)
    setError(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleReset()
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!job || !cv) return

    setSubmitting(true)
    setError(null)

    const result = await submitApplication({
      jobPositionId: job.id,
      firstName,
      lastName,
      email,
      message,
      cv,
    })

    setSubmitting(false)

    if (!result.ok) {
      setError(result.detail || result.error)
      return
    }

    setSent(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg border-[#1A1A1A]/15 bg-[#F4ECE7] p-0 text-[#1A1A1A] sm:rounded-none">
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 md:p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center bg-[#F0543D] text-[#F4ECE7]">
                <Check size={24} />
              </div>
              <DialogHeader className="mt-7 space-y-3 text-left">
                <DialogTitle className="display-font text-4xl font-semibold leading-none tracking-[-.06em]">
                  Application received.
                </DialogTitle>
                <DialogDescription className="max-w-sm text-sm leading-relaxed text-[#1A1A1A]/60">
                  Thanks for applying to {job?.name}. We&apos;ll review your CV and get back to you.
                </DialogDescription>
              </DialogHeader>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="mt-8 border border-[#1A1A1A] px-5 py-3 mono-label transition-colors hover:bg-[#1A1A1A] hover:text-[#F4ECE7]"
                data-testid="button-close-apply-success"
              >
                Close
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="p-6 md:p-8"
            >
              <div className="pr-6">
                <DialogHeader className="space-y-2 text-left">
                  <DialogTitle className="display-font text-3xl font-semibold tracking-[-.05em]">
                    Apply
                  </DialogTitle>
                  <DialogDescription className="text-sm text-[#1A1A1A]/55">
                    {job?.name ?? 'Open role'}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="mt-8 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="mono-label text-[#1A1A1A]/55">First name</span>
                    <input
                      required
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="border border-[#1A1A1A]/20 bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-[#F0543D]"
                      autoComplete="given-name"
                      data-testid="input-apply-first-name"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="mono-label text-[#1A1A1A]/55">Last name</span>
                    <input
                      required
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="border border-[#1A1A1A]/20 bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-[#F0543D]"
                      autoComplete="family-name"
                      data-testid="input-apply-last-name"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="mono-label text-[#1A1A1A]/55">Email</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="border border-[#1A1A1A]/20 bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-[#F0543D]"
                    autoComplete="email"
                    data-testid="input-apply-email"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="mono-label text-[#1A1A1A]/55">Message</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={4}
                    className="resize-none border border-[#1A1A1A]/20 bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-[#F0543D]"
                    data-testid="input-apply-message"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="mono-label text-[#1A1A1A]/55">CV</span>
                  <input
                    required
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,application/pdf"
                    onChange={(event) => setCv(event.target.files?.[0] ?? null)}
                    className="border border-[#1A1A1A]/20 bg-transparent px-3 py-3 text-sm file:mr-4 file:border-0 file:bg-[#F0543D] file:px-3 file:py-1.5 file:text-[#F4ECE7] file:mono-label"
                    data-testid="input-apply-cv"
                  />
                  {cv ? (
                    <span className="text-xs text-[#1A1A1A]/45">{cv.name}</span>
                  ) : null}
                </label>
              </div>

              {error ? (
                <p
                  className="mt-4 text-sm text-[#F0543D]"
                  role="alert"
                  data-testid="text-apply-error"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-8 flex w-full items-center justify-center gap-2 bg-[#F0543D] px-5 py-3.5 mono-label text-[#F4ECE7] transition-colors hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="button-submit-application"
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send application'
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
