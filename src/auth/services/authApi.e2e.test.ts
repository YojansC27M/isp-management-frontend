// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"

const TEST_TOKEN = "real-backend-token"
const TEST_USER = {
  id: "usr-e2e-1",
  name: "E2E Admin",
  email: "admin@isp.com",
  role: "admin",
  permissions: ["clients.read", "clients.write"],
}

describe("Frontend auth flow without mock fallback", () => {
  let server: ReturnType<typeof createServer>
  let baseUrl = ""
  const hitCounter = {
    login: 0,
    me: 0,
    navigation: 0,
  }
  const storage = new Map<string, string>()

  beforeAll(async () => {
    ;(globalThis as { window?: unknown }).window = globalThis
    ;(globalThis as { localStorage?: Storage }).localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
      clear: () => {
        storage.clear()
      },
      key: (index: number) => Array.from(storage.keys())[index] ?? null,
      get length() {
        return storage.size
      },
    }

    server = createServer(async (request, response) => {
      const url = request.url ?? ""
      const method = request.method ?? "GET"

      if (method === "POST" && url === "/api/v1/auth/login") {
        hitCounter.login += 1
        const chunks: Buffer[] = []
        for await (const chunk of request) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        }
        const body = JSON.parse(Buffer.concat(chunks).toString("utf-8")) as { email?: string; password?: string }

        if (body.email === "admin@isp.com" && body.password === "secret") {
          response.writeHead(200, { "content-type": "application/json" })
          response.end(
            JSON.stringify({
              accessToken: TEST_TOKEN,
              tokenType: "Bearer",
              user: TEST_USER,
            }),
          )
          return
        }

        response.writeHead(401, { "content-type": "application/json" })
        response.end(JSON.stringify({ message: "Invalid credentials" }))
        return
      }

      if (method === "GET" && url === "/api/v1/auth/me") {
        hitCounter.me += 1
        const authHeader = request.headers.authorization
        if (authHeader !== `Bearer ${TEST_TOKEN}`) {
          response.writeHead(401, { "content-type": "application/json" })
          response.end(JSON.stringify({ message: "Unauthorized" }))
          return
        }

        response.writeHead(200, { "content-type": "application/json" })
        response.end(JSON.stringify(TEST_USER))
        return
      }

      if (method === "GET" && url === "/api/v1/auth/navigation") {
        hitCounter.navigation += 1
        const authHeader = request.headers.authorization
        if (authHeader !== `Bearer ${TEST_TOKEN}`) {
          response.writeHead(401, { "content-type": "application/json" })
          response.end(JSON.stringify({ message: "Unauthorized" }))
          return
        }

        response.writeHead(200, { "content-type": "application/json" })
        response.end(
          JSON.stringify({
            modules: [{ id: "real-auth-nav", items: ["clients-list"] }],
          }),
        )
        return
      }

      response.writeHead(404, { "content-type": "application/json" })
      response.end(JSON.stringify({ message: "Not found" }))
    })

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve())
    })

    const { port } = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${port}/api/v1`
  })

  beforeEach(() => {
    hitCounter.login = 0
    hitCounter.me = 0
    hitCounter.navigation = 0
    storage.clear()
    vi.resetModules()
  })

  afterAll(async () => {
    storage.clear()
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  })

  it("uses real HTTP auth endpoints", async () => {
    const { default: api } = await import("@/api/axios")
    const { login, getMe } = await import("./authApi")
    const { getNavigationConfig } = await import("./navigationApi")
    const { setAuthToken } = await import("../session")

    api.defaults.baseURL = baseUrl

    const loginResponse = await login({
      email: "admin@isp.com",
      password: "secret",
    })
    setAuthToken(loginResponse.accessToken)

    const me = await getMe()
    const navigation = await getNavigationConfig()

    expect(loginResponse.accessToken).toBe(TEST_TOKEN)
    expect(me.email).toBe("admin@isp.com")
    expect(navigation.modules[0]?.id).toBe("real-auth-nav")

    expect(hitCounter.login).toBe(1)
    expect(hitCounter.me).toBe(1)
    expect(hitCounter.navigation).toBe(1)
  })
})
