import { Module } from '@nestjs/common'
import { OllamaRuntimeService } from './ollama-runtime.service'
import { LocalAiController } from './local-ai.controller'
import { EMBEDDING_PROVIDER } from './ports/embedding-provider.port'
import { OllamaEmbeddingProvider } from './ollama-embedding.provider'
import { LocalAiSetupService } from './local-ai-setup.service'

@Module({
  providers: [
    OllamaRuntimeService,
    LocalAiSetupService,
    {
      provide: EMBEDDING_PROVIDER,
      useClass: OllamaEmbeddingProvider
    }
  ],
  exports: [OllamaRuntimeService, LocalAiSetupService, EMBEDDING_PROVIDER],
  controllers: [LocalAiController]
})
export class AiModule {}
