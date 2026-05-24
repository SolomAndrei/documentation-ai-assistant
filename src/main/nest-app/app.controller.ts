import { Controller, Get } from '@nestjs/common'

@Controller('api')
export class AppController {
  @Get('hello')
  getHello(): { message: string } {
    return { message: 'Hello from local NestJS server' }
  }
}
