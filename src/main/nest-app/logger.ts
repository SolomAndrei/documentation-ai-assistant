import { LoggerService } from '@nestjs/common'
import log from 'electron-log/main'

export class BackendLogger implements LoggerService {
  constructor() {
    log.initialize()
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
    log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
  }
  log(message: unknown, ...optionalParams: unknown[]): void {
    log.info(message, ...optionalParams)
  }
  error(message: unknown, ...optionalParams: unknown[]): void {
    log.error(message, ...optionalParams)
  }
  warn(message: unknown, ...optionalParams: unknown[]): void {
    log.warn(message, ...optionalParams)
  }
  debug?(message: unknown, ...optionalParams: unknown[]): void {
    log.debug(message, ...optionalParams)
  }
  verbose?(message: unknown, ...optionalParams: unknown[]): void {
    log.verbose(message, ...optionalParams)
  }
}
