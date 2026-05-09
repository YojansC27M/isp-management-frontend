import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import type { Request, Response } from "express"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { ExportReportsQueryDto, ReportingQueryDto } from "./dto/reporting-query.dto"
import { ReportingService } from "./reporting.service"

@ApiTags("reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("reports")
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get("metrics")
  @RequirePermissions("reports.read")
  metrics(@Query() query: ReportingQueryDto) {
    return this.reportingService.getMetrics(query)
  }

  @Get("summary")
  @RequirePermissions("reports.read")
  summary(@Query() query: ReportingQueryDto) {
    return this.reportingService.getMetrics(query)
  }

  @Get("revenue")
  @RequirePermissions("reports.read")
  revenue(@Query() query: ReportingQueryDto) {
    return this.reportingService.getRevenue(query)
  }

  @Get("status")
  @RequirePermissions("reports.read")
  status(@Query() query: ReportingQueryDto) {
    return this.reportingService.getStatus(query)
  }

  @Get("overdue")
  @RequirePermissions("reports.read")
  overdue(@Query() query: ReportingQueryDto) {
    return this.reportingService.getOverdue(query)
  }

  @Get("operations")
  @RequirePermissions("reports.read")
  operations(@Query() query: ReportingQueryDto) {
    return this.reportingService.getOperations(query)
  }

  @Get("overdue-clients")
  @RequirePermissions("reports.read")
  overdueClients(@Query() query: ReportingQueryDto) {
    return this.reportingService.getOverdue(query)
  }

  @Get("export")
  @RequirePermissions("reports.read")
  async export(
    @Query() query: ExportReportsQueryDto,
    @CurrentUser() user: { id: string },
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const requestIdHeader = request.headers["x-request-id"]
    const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader

    const exported = await this.reportingService.exportReport(query, user.id, { requestId: requestId ?? null })
    response.setHeader("Content-Type", exported.contentType)
    response.setHeader("Content-Disposition", `attachment; filename="${exported.fileName}"`)
    response.send(exported.buffer)
  }
}
