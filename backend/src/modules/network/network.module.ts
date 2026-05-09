import { Module } from "@nestjs/common"
import { MikrotikModule } from "./mikrotik/mikrotik.module"

@Module({
  imports: [MikrotikModule],
  exports: [MikrotikModule],
})
export class NetworkModule {}
