import { Injectable, Logger } from '@nestjs/common'
import { readFile } from 'node:fs/promises'

export interface ParsedDocument {
  filePath: string
  text: string
}

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name)

  async parseDocument(filePath: string): Promise<ParsedDocument> {
    this.logger.log(`Parsing document: ${filePath}`)
    const text = await readFile(filePath, 'utf-8')

    return {
      filePath,
      text
    }
  }
}
