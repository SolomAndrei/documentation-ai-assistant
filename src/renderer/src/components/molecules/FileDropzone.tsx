import { useRef, useState } from 'react'

interface FileDropzoneProps {
  isUploading: boolean
  onFileSelected: (file: File) => void
}

export function FileDropzone({
  isUploading,
  onFileSelected
}: FileDropzoneProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (file) {
      onFileSelected(file)
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files[0]

    if (file) {
      onFileSelected(file)
    }
  }

  return (
    <div
      className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed p-5 text-center transition ${
        isDragging
          ? 'border-indigo-300 bg-indigo-400/15'
          : 'border-indigo-300/50 bg-indigo-400/10 hover:border-indigo-300 hover:bg-indigo-400/15'
      }`}
      onClick={() => fileInputRef.current?.click()}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDrop={handleDrop}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          fileInputRef.current?.click()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <input
        ref={fileInputRef}
        accept=".pdf,.html,.htm,.txt,.md,.markdown"
        hidden
        type="file"
        onChange={handleFileChange}
      />
      <strong className="text-slate-100">
        {isUploading ? 'Uploading...' : 'Drop a document here'}
      </strong>
      <span className="text-sm text-slate-400">or choose it from your file system</span>
    </div>
  )
}
