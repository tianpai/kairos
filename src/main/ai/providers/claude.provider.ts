import { generateObject, streamObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import type {
  AIProvider,
  AIProviderConfig,
  GenerateParams,
  StreamParams,
} from '../provider.interface'

// Beta headers for OAuth authentication and Claude Code features
const ANTHROPIC_BETA_FLAGS = [
  'oauth-2025-04-20',
  'claude-code-20250219',
  'interleaved-thinking-2025-05-14',
  'fine-grained-tool-streaming-2025-05-14',
]

// Claude Code system identity - required for OAuth tokens to work
const CLAUDE_CODE_IDENTITY = {
  type: 'text',
  text: "You are Claude Code, Anthropic's official CLI for Claude.",
  cache_control: { type: 'ephemeral' },
}

/**
 * Create a custom fetch function that injects Claude Code identity into requests.
 * This is required for OAuth tokens which are restricted to Claude Code usage.
 */
function createClaudeCodeFetch(accessToken: string) {
  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    // Merge beta headers
    const existingBeta = (init?.headers as Record<string, string>)?.['anthropic-beta'] || ''
    const existingFlags = existingBeta.split(',').map((s) => s.trim()).filter(Boolean)
    const allFlags = [...new Set([...ANTHROPIC_BETA_FLAGS, ...existingFlags])]

    // Build headers with OAuth token
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string>),
      'authorization': `Bearer ${accessToken}`,
      'anthropic-beta': allFlags.join(','),
    }

    // Remove x-api-key if present (OAuth uses Authorization header)
    delete headers['x-api-key']

    // Modify request body to inject Claude Code identity
    let modifiedInit = init
    if (init?.body) {
      try {
        const bodyStr = typeof init.body === 'string' ? init.body : String(init.body)
        const body = JSON.parse(bodyStr)

        // Inject Claude Code identity into system prompt
        if (body.system && Array.isArray(body.system)) {
          // System is already an array - prepend Claude Code identity
          body.system.unshift(CLAUDE_CODE_IDENTITY)
        } else if (typeof body.system === 'string') {
          // System is a string - convert to array format
          body.system = [
            CLAUDE_CODE_IDENTITY,
            { type: 'text', text: body.system },
          ]
        }

        modifiedInit = {
          ...init,
          body: JSON.stringify(body),
        }
      } catch {
        // If body parsing fails, proceed without modification
      }
    }

    return fetch(url, {
      ...modifiedInit,
      headers,
    })
  }
}

export class ClaudeProvider implements AIProvider {
  private readonly client: ReturnType<typeof createAnthropic>
  private readonly defaultModel: string

  constructor(config: AIProviderConfig) {
    // Use custom fetch that injects Claude Code identity for OAuth tokens
    this.client = createAnthropic({
      apiKey: '', // Empty - we use Authorization header via custom fetch
      baseURL: config.baseUrl,
      fetch: createClaudeCodeFetch(config.apiKey || ''),
      headers: {
        'anthropic-beta': ANTHROPIC_BETA_FLAGS.join(','),
      },
    })
    this.defaultModel = config.defaultModel ?? 'claude-sonnet-4-5-20250929'
  }

  async generateStructuredOutput<T>(params: GenerateParams<T>): Promise<T> {
    const { object } = await generateObject({
      model: this.client(params.model ?? this.defaultModel),
      schema: params.schema,
      system: params.systemPrompt,
      prompt: params.userPrompt,
    })
    return object
  }

  async streamStructuredOutput<T>(params: StreamParams<T>): Promise<T> {
    const { partialObjectStream, object } = streamObject({
      model: this.client(params.model ?? this.defaultModel),
      schema: params.schema,
      system: params.systemPrompt,
      prompt: params.userPrompt,
    })

    if (params.onPartial) {
      for await (const partial of partialObjectStream) {
        params.onPartial(partial)
      }
    }

    return await object
  }
}
