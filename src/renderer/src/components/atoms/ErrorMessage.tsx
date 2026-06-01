interface ErrorMessageProps {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
      {message}
    </div>
  )
}
