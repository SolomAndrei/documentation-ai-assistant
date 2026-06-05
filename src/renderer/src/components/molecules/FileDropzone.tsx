import { useRef, useState } from 'react'

interface FileDropzoneProps {
  isUploading: boolean
  label?: string
  multiple?: boolean
  onFilesSelected: (files: File[]) => void
}

export function FileDropzone({
  isUploading,
  label = 'Drop documents here',
  multiple = false,
  onFilesSelected
}: FileDropzoneProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    setIsDragging(false)

    const files = Array.from(event.dataTransfer.files)

    if (files.length > 0) {
      onFilesSelected(multiple ? files : files.slice(0, 1))
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
        multiple={multiple}
        type="file"
        onChange={handleFileChange}
      />
      <strong className="text-slate-100">{isUploading ? 'Uploading...' : label}</strong>
      <span className="text-sm text-slate-400">or choose it from your file system</span>
    </div>
  )
}
