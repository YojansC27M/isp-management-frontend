import "dotenv/config"
import "reflect-metadata"
import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import cookieParser from "cookie-parser"
import type { NextFunction, Request, Response } from "express"
import helmet from "helmet"
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { AppModule } from "./app.module"
import { validateEnv } from "./config/env.validation"

async function bootstrap() {
  const env = validateEnv(process.env)
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: false,
    logger: ["error", "warn", "log"],
  })

  mkdirSync(join(process.cwd(), "uploads"), { recursive: true })
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
  })

  const httpAdapter = app.getHttpAdapter()
  const httpServer = httpAdapter.getInstance() as { set?: (key: string, value: unknown) => void }
  httpServer.set?.("etag", false)
  app.setGlobalPrefix("api/v1")
  app.enableShutdownHooks()
  app.use(helmet())
  app.use(cookieParser())
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (request.path.startsWith("/api/")) {
      response.setHeader("Cache-Control", "no-store")
      response.setHeader("Pragma", "no-cache")
      response.setHeader("Expires", "0")
    }
    next()
  })
  app.use((request: Request, response: Response, next: NextFunction) => {
    const incomingRequestId = request.header("x-request-id")
    const requestId = incomingRequestId && incomingRequestId.trim().length > 0 ? incomingRequestId : randomUUID()
    response.setHeader("x-request-id", requestId)
    request.headers["x-request-id"] = requestId
    next()
  })
  app.enableCors({
    origin: env.CORS_ALLOWED_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean),
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  const config = new DocumentBuilder()
    .setTitle("ISP Management API")
    .setDescription("API principal para el sistema ISP Management")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("docs", app, document)

  const port = Number(env.PORT ?? 3000)
  await app.listen(port)
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap backend", error)
  process.exit(1)
})
