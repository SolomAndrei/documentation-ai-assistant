interface AppLoadingScreenProps {
  message: string
}

export function AppLoadingScreen({ message }: AppLoadingScreenProps): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
      {message}
    </div>
  )
}
