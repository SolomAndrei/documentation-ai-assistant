import { Injectable } from '@nestjs/common'
import { Subject } from 'rxjs'

@Injectable()
export class QueueEventsService {
  private readonly changedSubject = new Subject<void>()
  readonly changed$ = this.changedSubject.asObservable()

  notifyChanged(): void {
    this.changedSubject.next()
  }
}
