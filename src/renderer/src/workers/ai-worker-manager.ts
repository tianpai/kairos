import log from 'electron-log/renderer'
import type { AITaskType, AIWorkerMessage, AIWorkerResponse } from './ai.worker'

type PendingTask = {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  onPartial?: (partial: unknown) => void
  taskType: AITaskType
  startTime: number
}

export interface ExecuteOptions {
  streaming?: boolean
  onPartial?: (partial: unknown) => void
}

class AIWorkerManager {
  private worker: Worker | null = null
  private pendingTasks = new Map<string, PendingTask>()

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./ai.worker.ts', import.meta.url), {
        type: 'module',
      })
      this.worker.onmessage = this.handleMessage.bind(this)
      this.worker.onerror = this.handleError.bind(this)
    }
    return this.worker
  }

  async execute<T>(
    taskType: AITaskType,
    payload: Record<string, unknown>,
    options?: ExecuteOptions,
  ): Promise<T> {
    const id = crypto.randomUUID()
    const apiKey = await window.electron.settings.getApiKey()

    if (!apiKey) {
      throw new Error('API key not configured')
    }

    const worker = this.getWorker()

    return new Promise((resolve, reject) => {
      this.pendingTasks.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        onPartial: options?.onPartial,
        taskType,
        startTime: Date.now(),
      })

      const streamingLabel = options?.streaming ? ' (streaming)' : ''
      log.info(`AI task started: ${taskType}${streamingLabel}`)

      const message: AIWorkerMessage = {
        id,
        taskType,
        payload,
        apiKey,
        streaming: options?.streaming,
      }
      worker.postMessage(message)
    })
  }

  private handleMessage({ data }: MessageEvent<AIWorkerResponse>) {
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

  private handleError(event: ErrorEvent) {
    log.error(`AI Worker crashed: ${event.message}`)
    // Reject all pending tasks
    for (const [id, task] of this.pendingTasks) {
      task.reject(new Error(`Worker error: ${event.message}`))
      this.pendingTasks.delete(id)
    }
    // Reset worker
    this.worker = null
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingTasks.clear()
  }
}

export const aiWorker = new AIWorkerManager()
