interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-5 text-center text-sm text-slate-400">
      {message}
    </div>
  )
}
