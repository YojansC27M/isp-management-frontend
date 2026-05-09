import { Injectable } from "@nestjs/common"

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: "ISP Management API",
      version: "1.0.0",
      status: "ok",
    }
  }
}

