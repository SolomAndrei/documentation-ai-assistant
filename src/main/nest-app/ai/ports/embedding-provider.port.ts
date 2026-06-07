export interface EmbeddingProviderPort {
  embedText(text: string): Promise<number[]>
  embedBatch(texts: string[]): Promise<number[][]>
}

export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER')
