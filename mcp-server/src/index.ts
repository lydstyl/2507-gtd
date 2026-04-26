#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { randomUUID } from 'crypto'
import { ApiClient } from './client/ApiClient.js'
import { registerTaskTools } from './tools/tasks.js'
import { registerTagTools } from './tools/tags.js'

const TRANSPORT = process.env['TRANSPORT'] ?? 'stdio'
const MCP_HTTP_PORT = parseInt(process.env['MCP_HTTP_PORT'] ?? '3001', 10)
const GTD_API_URL = process.env['GTD_API_URL'] ?? 'http://localhost:3000'

function createMcpServer(getClient: () => ApiClient): McpServer {
  const server = new McpServer({
    name: 'gtd-task-manager',
    version: '2.0.0',
  })
  registerTaskTools(server, getClient)
  registerTagTools(server, getClient)
  return server
}

async function startStdio(): Promise<void> {
  const token = process.env['GTD_API_TOKEN']
  if (!token) {
    console.error(
      'Error: GTD_API_TOKEN environment variable is required.\n' +
      'Set it to your JWT or API key from the GTD app.\n' +
      'Example: GTD_API_TOKEN=gtd_abc123... node build/index.js'
    )
    process.exit(1)
  }

  const client = new ApiClient(token, GTD_API_URL)
  const server = createMcpServer(() => client)
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('GTD MCP Server running (stdio)')
}

async function startHttp(): Promise<void> {
  const app = express()
  app.use(cors())
  app.use(express.json())

  // Track Streamable HTTP sessions: sessionId → transport
  const sessions = new Map<string, StreamableHTTPServerTransport>()

  function extractToken(req: Request): string | null {
    const auth = req.headers.authorization
    if (auth && auth.startsWith('Bearer ')) return auth.substring(7)
    return null
  }

  // ── Streamable HTTP (MCP spec 2025-11-25) ──────────────────────────────────
  app.post('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined

    if (sessionId && sessions.has(sessionId)) {
      const transport = sessions.get(sessionId)!
      await transport.handleRequest(req, res, req.body)
      return
    }

    const token = extractToken(req)
    if (!token) {
      res.status(401).json({ error: 'Authorization: Bearer <token> required' })
      return
    }

    const newSessionId = randomUUID()
    const client = new ApiClient(token, GTD_API_URL)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newSessionId,
    })
    sessions.set(newSessionId, transport)

    transport.onclose = () => sessions.delete(newSessionId)

    const server = createMcpServer(() => client)
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  })

  app.delete('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    if (sessionId && sessions.has(sessionId)) {
      const transport = sessions.get(sessionId)!
      await transport.handleRequest(req, res, req.body)
      sessions.delete(sessionId)
    } else {
      res.status(404).json({ error: 'Session not found' })
    }
  })

  // ── SSE (legacy MCP spec 2024-11-05, for Hermes and older clients) ─────────
  app.get('/sse', async (req: Request, res: Response) => {
    const token = extractToken(req)
    if (!token) {
      res.status(401).json({ error: 'Authorization: Bearer <token> required' })
      return
    }

    const client = new ApiClient(token, GTD_API_URL)
    const transport = new SSEServerTransport('/messages', res)
    const server = createMcpServer(() => client)
    await server.connect(transport)
  })

  app.post('/messages', async (req: Request, res: Response) => {
    // SSEServerTransport handles session routing internally via query param
    // This endpoint is hit by the SSE client to send messages
    res.status(400).json({ error: 'Use the SSE connection from GET /sse' })
  })

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', transport: 'http', port: MCP_HTTP_PORT })
  })

  app.listen(MCP_HTTP_PORT, () => {
    console.error(`GTD MCP Server running (HTTP) on port ${MCP_HTTP_PORT}`)
    console.error(`  Streamable HTTP: POST http://localhost:${MCP_HTTP_PORT}/mcp`)
    console.error(`  SSE (legacy):    GET  http://localhost:${MCP_HTTP_PORT}/sse`)
  })
}

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

if (TRANSPORT === 'http') {
  startHttp().catch((err) => {
    console.error('Failed to start HTTP server:', err)
    process.exit(1)
  })
} else {
  startStdio().catch((err) => {
    console.error('Failed to start stdio server:', err)
    process.exit(1)
  })
}
