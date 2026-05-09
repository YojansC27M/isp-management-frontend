import { Controller, Get } from "@nestjs/common"

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: "ISP Management API",
      version: "1.0.0",
      status: "ok",
    }
  }
}
