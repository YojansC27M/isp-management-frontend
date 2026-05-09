import { APP_FILTER, APP_GUARD } from "@nestjs/core"
import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter"
import { validateEnv } from "./config/env.validation"
import { AuthModule } from "./modules/auth/auth.module"
import { BillingAutomationModule } from "./modules/billing-automation/billing-automation.module"
import { ClientsModule } from "./modules/clients/clients.module"
import { ClientsMapModule } from "./modules/clients-map/clients-map.module"
import { DashboardModule } from "./modules/dashboard/dashboard.module"
import { InvoicesModule } from "./modules/invoices/invoices.module"
import { InstallationsModule } from "./modules/installations/installations.module"
import { HealthModule } from "./modules/health/health.module"
import { InternalUsersModule } from "./modules/internal-users/internal-users.module"
import { MonitoringModule } from "./modules/monitoring/monitoring.module"
import { NetworkModule } from "./modules/network/network.module"
import { PaymentsModule } from "./modules/payments/payments.module"
import { PlansModule } from "./modules/plans/plans.module"
import { PortalModule } from "./modules/portal/portal.module"
import { ReportingModule } from "./modules/reporting/reporting.module"
import { RoutersModule } from "./modules/routers/routers.module"
import { SecurityModule } from "./modules/security/security.module"
import { SettingsModule } from "./modules/settings/settings.module"
import { SupportModule } from "./modules/support/support.module"
import { TicketsModule } from "./modules/tickets/tickets.module"
import { VisitsModule } from "./modules/visits/visits.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    HealthModule,
    DashboardModule,
    BillingAutomationModule,
    AuthModule,
    SecurityModule,
    InternalUsersModule,
    ClientsModule,
    ClientsMapModule,
    PlansModule,
    InvoicesModule,
    InstallationsModule,
    PaymentsModule,
    TicketsModule,
    VisitsModule,
    RoutersModule,
    SupportModule,
    NetworkModule,
    MonitoringModule,
    ReportingModule,
    SettingsModule,
    PortalModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
