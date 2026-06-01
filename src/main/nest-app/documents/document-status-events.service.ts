import { Injectable } from '@nestjs/common'
import { Subject } from 'rxjs'
import type { DocumentRecord } from './document-records.repository'

@Injectable()
export class DocumentStatusEventsService {
  private readonly statusChangedSubject = new Subject<DocumentRecord>()
  readonly statusChanged$ = this.statusChangedSubject.asObservable()

  notifyStatusChanged(document: DocumentRecord): void {
    this.statusChangedSubject.next(document)
  }
}
