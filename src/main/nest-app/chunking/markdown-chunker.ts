export interface ChunkMarkdownOptions {
  maxChunkSize: number
}

export function chankMarkdown(markdown: string, options: ChunkMarkdownOptions): string[] {
  const normalizedMarkdown = markdown.trim()
  if (!normalizedMarkdown) return []
  const sections = normalizedMarkdown.split(/\n(?=#{1,3}\s)/)
  const chunks: string[] = []
  for (const section of sections) {
    const trimmedSection = section.trim()
    if (!trimmedSection) continue
    if (trimmedSection.length <= options.maxChunkSize) {
      chunks.push(trimmedSection)
      continue
    }
    chunks.push(...splitLongSection(trimmedSection, options.maxChunkSize))
  }
  return chunks
}

function splitLongSection(section: string, maxChunkSize: number): string[] {
  const paragraphs = section.split(/\n\s*\n/)
  const chunks: string[] = []
  let currentChunk = ''
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim()
    if (!trimmedParagraph) {
      continue
    }
    const nextChunk = currentChunk ? `${currentChunk}\n\n${trimmedParagraph}` : trimmedParagraph
    if (nextChunk.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk)
      currentChunk = trimmedParagraph
      continue
    }
    currentChunk = nextChunk
  }
  if (currentChunk) {
    chunks.push(currentChunk)
  }
  return chunks
}
