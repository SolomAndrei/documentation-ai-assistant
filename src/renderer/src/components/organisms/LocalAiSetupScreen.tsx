import type { LocalAiSetupEvent, LocalAiSetupItem } from '../../api/localAi'
import { Button } from '../atoms/Button'

interface LocalAiSetupScreenProps {
  items: LocalAiSetupItem[]
  setupEvent: LocalAiSetupEvent | null
  onCancel: () => void
  onInstall: () => void
  isChecking: boolean
  isInstalling: boolean
}

const statusLabels: Record<LocalAiSetupItem['status'], string> = {
  ready: 'Ready',
  missing: 'Missing',
  pending: 'Pending',
  installing: 'Installing',
  error: 'Error'
}

const statusClasses: Record<LocalAiSetupItem['status'], string> = {
  ready: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30',
  missing: 'bg-amber-500/15 text-amber-200 ring-amber-400/30',
  pending: 'bg-slate-500/15 text-slate-300 ring-slate-400/20',
  installing: 'bg-cyan-500/15 text-cyan-200 ring-cyan-400/30',
  error: 'bg-red-500/15 text-red-200 ring-red-400/30'
}

export function LocalAiSetupScreen({
  items,
  setupEvent,
  onCancel,
  onInstall,
  isChecking,
  isInstalling
}: LocalAiSetupScreenProps): React.JSX.Element {
  const readyItemsCount = items.filter((item) => item.status === 'ready').length
  const dependencyProgressPercent = items.length
    ? Math.round((readyItemsCount / items.length) * 100)
    : 0
  const progressPercent =
    setupEvent?.status === 'running' ? setupEvent.progress : dependencyProgressPercent

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-300">
          First launch setup
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Local AI dependencies</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The app needs these components before it can index documents locally.
        </p>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
            <span>Setup progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {setupEvent?.message ??
              (isChecking ? 'Checking dependencies automatically...' : 'Waiting for dependencies.')}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4"
            >
              <div>
                <div className="font-medium">{item.label}</div>
                {item.message ? (
                  <div className="mt-1 text-sm text-red-300">{item.message}</div>
                ) : null}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusClasses[item.status]}`}
              >
                {statusLabels[item.status]}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={isInstalling}>
            Cancel
          </Button>
          <Button onClick={onInstall} disabled={isInstalling}>
            {isInstalling ? 'Installing...' : 'Install'}
          </Button>
        </div>
      </section>
    </div>
  )
}
