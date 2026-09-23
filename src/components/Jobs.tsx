import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronDown, ChevronUp, LoaderCircle } from 'lucide-react'
import { ApplyForm } from '@/components/ApplyForm'
import {
  fetchJobs,
  formatJobMeta,
  type PersonioJob,
} from '@/lib/personio'

type SectionTheme = 'coral' | 'yellow' | 'green' | 'blue'

const sectionAccentClass: Record<SectionTheme, string> = {
  coral: 'text-brand-coral',
  yellow: 'text-brand-yellow',
  green: 'text-brand-green',
  blue: 'text-brand-blue',
}

const easeOut = [0.22, 1, 0.36, 1] as const

const Reveal = ({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) => {
  const reduce = useReducedMotion()
  if (reduce) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}

const SectionTag = ({ children }: { children: ReactNode }) => (
  <div className="mono-label flex items-center gap-3 text-[#1A1A1A]/55">
    <span className="h-px w-7 bg-current" />
    {children}
  </div>
)

type JobsProps = {
  sectionTheme?: SectionTheme
}

export const Jobs = ({ sectionTheme = 'coral' }: JobsProps) => {
  const [expanded, setExpanded] = useState(false)
  const [jobs, setJobs] = useState<PersonioJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<PersonioJob | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)
  const accentClass = sectionAccentClass[sectionTheme]

  useEffect(() => {
    if (!expanded) return
    if (jobs.length > 0) return

    let cancelled = false

    const loadJobs = async () => {
      setLoading(true)
      setError(null)
      try {
        const nextJobs = await fetchJobs('en')
        if (cancelled) return
        setJobs(nextJobs)
      } catch (loadError) {
        if (cancelled) return
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load open roles',
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadJobs()

    return () => {
      cancelled = true
    }
  }, [expanded, jobs.length])

  const handleOpenApply = (job: PersonioJob) => {
    setSelectedJob(job)
    setApplyOpen(true)
  }

  const handleToggleExpanded = () => {
    setExpanded((current) => !current)
  }

  return (
    <section id="jobs" className="border-t border-[#1A1A1A]/20 bg-[#F4ECE7] py-24 md:py-32">
      <Reveal className="site-wrap grid gap-10 md:grid-cols-[.8fr_1.2fr]">
        <SectionTag>06 / Jobs</SectionTag>
        <div>
          <h2 className="display-font text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-[.9] tracking-[-.075em]">
            Make the<br /><span className={accentClass}>next thing.</span>
          </h2>
          <p className="mt-8 max-w-lg text-lg leading-[1.6] text-[#1A1A1A]/65">
            We&apos;re always interested in meeting people who care about how things work. Especially product-minded engineers, design engineers, and technical leads.
          </p>
          <button
            type="button"
            onClick={handleToggleExpanded}
            className="mt-8 flex items-center gap-3 border-b border-[#1A1A1A] pb-2 mono-label"
            data-testid="button-open-roles"
            aria-expanded={expanded}
          >
            {expanded ? 'Hide roles' : 'See open roles'}
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-8 border-t border-[#1A1A1A]/20">
                  {loading ? (
                    <div
                      className="flex items-center gap-3 py-8 mono-label text-[#1A1A1A]/55"
                      data-testid="jobs-loading"
                    >
                      <LoaderCircle size={16} className="animate-spin" />
                      Loading roles…
                    </div>
                  ) : null}

                  {!loading && error ? (
                    <p
                      className="py-8 text-sm text-[#F0543D]"
                      role="alert"
                      data-testid="jobs-error"
                    >
                      {error}
                    </p>
                  ) : null}

                  {!loading && !error && jobs.length === 0 ? (
                    <p
                      className="py-8 text-sm text-[#1A1A1A]/55"
                      data-testid="jobs-empty"
                    >
                      No open roles right now. Check back soon.
                    </p>
                  ) : null}

                  {!loading && !error
                    ? jobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between gap-4 border-b border-[#1A1A1A]/20 py-5"
                        >
                          <div className="min-w-0">
                            <div className="display-font text-xl font-semibold">
                              {job.name}
                            </div>
                            <div className="mt-1 mono-label text-[#1A1A1A]/45">
                              {formatJobMeta(job)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenApply(job)}
                            aria-label={`Apply for ${job.name}`}
                            className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#F0543D] bg-[#F0543D] text-[#F4ECE7] transition-colors hover:border-[#1A1A1A] hover:bg-[#1A1A1A]"
                            data-testid={`button-apply-${job.id}`}
                          >
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      ))
                    : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Reveal>

      <ApplyForm
        job={selectedJob}
        open={applyOpen}
        onOpenChange={setApplyOpen}
      />
    </section>
  )
}
