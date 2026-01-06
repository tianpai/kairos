import log from 'electron-log/renderer'
import type { TaskName } from '../workflow/task-contracts'

type PendingTask = {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  onPartial?: (partial: unknown) => void
  taskType: TaskName
  startTime: number
}

export interface ExecuteOptions {
  streaming?: boolean
  onPartial?: (partial: unknown) => void
}

type ProviderType = 'openai' | 'deepseek' | 'claude' | 'ollama'

interface ServerInfo {
  port: number
  baseURL: string
  wsURL: string
}

interface WSResponse {
  id: string
  type: 'partial' | 'completed' | 'failed'
  partial?: unknown
  result?: unknown
  error?: string
}

async function getActiveProviderConfig(): Promise<{
  provider: ProviderType
  model: string
  apiKey: string
}> {
  const provider = (await window.electron.provider.getActive()) as ProviderType

  // Get API key or OAuth token based on provider
  let apiKey: string | null
  if (provider === 'ollama') {
    // Ollama doesn't need an API key, but we pass a dummy for consistency
    apiKey = 'ollama'
  } else if (provider === 'claude') {
    // Get OAuth access token for Claude
    apiKey = await window.electron.claudeSubscription.getAccessToken()
  } else if (provider === 'deepseek') {
    apiKey = await window.electron.settings.getDeepSeekApiKey()
  } else {
    apiKey = await window.electron.settings.getApiKey()
  }

  if (!apiKey) {
    throw new Error(`API key not configured for ${provider}`)
  }

  // Get selected model or default
  const selected = await window.electron.models.getSelected(provider)
  const model = selected ?? (await window.electron.models.getDefault(provider))

  return { provider, model, apiKey }
}

class AIClient {
  private ws: WebSocket | null = null
  private serverInfo: ServerInfo | null = null
  private pendingTasks = new Map<string, PendingTask>()
  private connectionPromise: Promise<void> | null = null

  private async getServerInfo(): Promise<ServerInfo> {
    if (!this.serverInfo) {
      this.serverInfo = await window.electron.aiServer.getInfo()
    }
    return this.serverInfo
  }

  private async ensureConnection(): Promise<void> {
    // If already connected, return
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    // If connection in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    // Start new connection
    this.connectionPromise = this.connect()
    try {
      await this.connectionPromise
    } finally {
      this.connectionPromise = null
    }
  }

  private async connect(): Promise<void> {
    const info = await this.getServerInfo()

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(info.wsURL)

      this.ws.onopen = () => {
        log.info('[AIClient] WebSocket connected')
        resolve()
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data))
      }

      this.ws.onerror = (error) => {
        log.error('[AIClient] WebSocket error:', error)
        reject(new Error('WebSocket connection failed'))
      }

      this.ws.onclose = () => {
        log.info('[AIClient] WebSocket closed')
        this.ws = null
        // Reject any pending tasks
        for (const [id, task] of this.pendingTasks) {
          task.reject(new Error('WebSocket connection closed'))
          this.pendingTasks.delete(id)
        }
      }
    })
  }

  private handleMessage(data: WSResponse): void {
    const task = this.pendingTasks.get(data.id)
    if (!task) return

    switch (data.type) {
      case 'partial':
        task.onPartial?.(data.partial)
        break
      case 'completed': {
        const duration = ((Date.now() - task.startTime) / 1000).toFixed(1)
        log.info(`AI task completed: ${task.taskType} (${duration}s)`)
        task.resolve(data.result)
        this.pendingTasks.delete(data.id)
        break
      }
      case 'failed':
        log.error(`AI task failed: ${task.taskType} - ${data.error}`)
        task.reject(new Error(data.error ?? 'Unknown error'))
        this.pendingTasks.delete(data.id)
        break
    }
  }

  async execute<T>(
    taskType: TaskName,
    payload: Record<string, unknown>,
    options?: ExecuteOptions
  ): Promise<T> {
    const id = crypto.randomUUID()
    const { provider, model, apiKey } = await getActiveProviderConfig()

    const streamingLabel = options?.streaming ? ' (streaming)' : ''
    log.info(`AI task started: ${taskType}${streamingLabel} with ${provider}/${model}`)

    // Use WebSocket for streaming, HTTP for non-streaming
    if (options?.streaming) {
      return this.executeViaWebSocket(id, taskType, payload, provider, model, apiKey, options)
    } else {
      return this.executeViaHttp(id, taskType, payload, provider, model, apiKey)
    }
  }

  private async executeViaWebSocket<T>(
    id: string,
    taskType: TaskName,
    payload: Record<string, unknown>,
    provider: ProviderType,
    model: string,
    apiKey: string,
    options: ExecuteOptions
  ): Promise<T> {
    await this.ensureConnection()

    return new Promise((resolve, reject) => {
      this.pendingTasks.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        onPartial: options.onPartial,
        taskType,
        startTime: Date.now(),
      })

      const message = {
        id,
        taskType,
        payload,
        provider,
        model,
        apiKey,
      }

      this.ws!.send(JSON.stringify(message))
    })
  }

  private async executeViaHttp<T>(
    id: string,
    taskType: TaskName,
    payload: Record<string, unknown>,
    provider: ProviderType,
    model: string,
    apiKey: string
  ): Promise<T> {
    const info = await this.getServerInfo()
    const startTime = Date.now()

    try {
      const response = await fetch(`${info.baseURL}/api/ai/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          taskType,
          payload,
          provider,
          model,
          apiKey,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      log.info(`AI task completed: ${taskType} (${duration}s)`)

      return data.result as T
    } catch (error) {
      log.error(`AI task failed: ${taskType} - ${error}`)
      throw error
    }
  }

  terminate(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.pendingTasks.clear()
    this.serverInfo = null
  }
}

export const aiClient = new AIClient()
