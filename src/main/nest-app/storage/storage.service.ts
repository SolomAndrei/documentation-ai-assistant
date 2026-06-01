import { Injectable } from '@nestjs/common'
import type { StorageService } from './storage.interface'
import { getOriginalDocumentsDir } from '../common/paths'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { randomUUID } from 'crypto'
import { basename, join, resolve } from 'path'

@Injectable()
export class LocalStorageService implements StorageService {
  async saveFile(file: Express.Multer.File): Promise<string> {
    const documentsDir = getOriginalDocumentsDir()
    await mkdir(documentsDir, { recursive: true })
    const originalBaseName = basename(file.originalname)
    const sanitizedFileName = originalBaseName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const safeFileName = `${randomUUID()}-${sanitizedFileName}`
    const filePath = join(documentsDir, safeFileName)
    const resolvedFilePath = this.resolveOriginalDocumentPath(filePath)
    await writeFile(resolvedFilePath, file.buffer)
    return resolvedFilePath
  }

  async deleteFile(filePath: string): Promise<void> {
    const resolvedFilePath = this.resolveOriginalDocumentPath(filePath)
    await unlink(resolvedFilePath)
  }

  private resolveOriginalDocumentPath(filePath: string): string {
    const documentsDir = getOriginalDocumentsDir()
    const resolvedDocumentsDir = resolve(documentsDir)
    const resolvedFilePath = resolve(filePath)
    if (!resolvedFilePath.startsWith(resolvedDocumentsDir)) {
      throw new Error('Invalid file path')
    }
    return resolvedFilePath
  }
}
