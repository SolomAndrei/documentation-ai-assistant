import 'multer'

export interface StorageService {
  saveFile(file: Express.Multer.File): Promise<string>
  deleteFile(filePath: string): Promise<void>
}
