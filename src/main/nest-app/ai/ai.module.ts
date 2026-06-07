import { Module } from '@nestjs/common'
import { OllamaRuntimeService } from './ollama-runtime.service'
import { LocalAiController } from './local-ai.controller'
import { EMBEDDING_PROVIDER } from './ports/embedding-provider.port'
import { OllamaEmbeddingProvider } from './ollama-embedding.provider'
import { LocalAiSetupService } from './local-ai-setup.service'
import { CommandRunnerService } from './command-runner.service'

@Module({
  providers: [
    CommandRunnerService,
    OllamaRuntimeService,
    LocalAiSetupService,
    {
      provide: EMBEDDING_PROVIDER,
      useClass: OllamaEmbeddingProvider
    }
  ],
  exports: [CommandRunnerService, OllamaRuntimeService, LocalAiSetupService, EMBEDDING_PROVIDER],
  controllers: [LocalAiController]
})
export class AiModule {}
