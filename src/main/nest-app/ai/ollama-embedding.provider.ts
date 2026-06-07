import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import type { EmbeddingProviderPort } from './ports/embedding-provider.port'
import { OllamaRuntimeService } from './ollama-runtime.service'

interface OllamaEmbedResponse {
  embeddings?: number[][]
}

@Injectable()
export class OllamaEmbeddingProvider implements EmbeddingProviderPort {
  private readonly model = 'nomic-embed-text'

  constructor(private readonly ollamaRuntimeService: OllamaRuntimeService) {}

  async embedText(text: string): Promise<number[]> {
    const [embedding] = await this.embedBatch([text])
    return embedding
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return []
    }

    const response = await fetch(`${this.ollamaRuntimeService.getBaseUrl()}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        input: texts
      })
    })

    if (!response.ok) {
      throw new ServiceUnavailableException('Failed to generate embeddings with Ollama.')
    }

    const data = (await response.json()) as OllamaEmbedResponse

    if (!data.embeddings || data.embeddings.length !== texts.length) {
      throw new ServiceUnavailableException('Ollama returned invalid embeddings response.')
    }

    return data.embeddings
  }
}
