import { useEffect, useState } from 'react'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import {
  Anthropic,
  DeepSeek,
  Gemini,
  Grok,
  Ollama,
  OpenAI,
} from '@lobehub/icons'
import { Button } from '@ui/Button'
import {
  useActiveProvider,
  useAnthropicApiKey,
  useApiKey,
  useDeepSeekApiKey,
  useDefaultModel,
  useDeleteAnthropicApiKey,
  useDeleteApiKey,
  useDeleteDeepSeekApiKey,
  useDeleteGeminiApiKey,
  useDeleteXAIApiKey,
  useFetchModels,
  useGeminiApiKey,
  useOllamaCancelPull,
  useOllamaCuratedModels,
  useOllamaInstalledModels,
  useOllamaPullModel,
  useOllamaStatus,
  useSelectedModel,
  useSetActiveProvider,
  useSetAnthropicApiKey,
  useSetApiKey,
  useSetDeepSeekApiKey,
  useSetGeminiApiKey,
  useSetSelectedModel,
  useSetXAIApiKey,
  useXAIApiKey,
} from '@hooks/useSettings'
import type { ProviderType } from '../../../../shared/providers'

interface ProviderInfo {
  id: ProviderType
  name: string
  description: string
  placeholder: string
}

const PROVIDERS: Array<ProviderInfo> = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini, and other OpenAI models',
    placeholder: 'sk-...',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek Chat and DeepSeek Reasoner models',
    placeholder: 'sk-...',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run local AI models on your machine',
    placeholder: '',
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    description: 'Grok-4, Grok-3 and other xAI models',
    placeholder: 'xai-...',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini 2.5 Flash, Gemini 2.5 Pro and other Google models',
    placeholder: 'AIza...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude Haiku 4.5, Claude Sonnet 4.5, Claude Opus 4.5 via API',
    placeholder: 'sk-ant-...',
  },
]

const PROVIDER_ICONS: Record<
  ProviderType,
  React.ComponentType<{ size?: number }>
> = {
  openai: OpenAI,
  deepseek: DeepSeek,
  ollama: Ollama,
  xai: Grok,
  gemini: Gemini,
  anthropic: Anthropic,
}

interface ProviderConfigProps {
  provider: ProviderInfo
  currentKey: string | null | undefined
  isActive: boolean
  onSetActive: () => void
  onSave: (key: string) => Promise<void>
  onDelete: () => Promise<void>
}

function ProviderConfig({
  provider,
  currentKey,
  isActive,
  onSetActive,
  onSave,
  onDelete,
}: ProviderConfigProps) {
  const [apiKey, setApiKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const keyToCopy = apiKey || currentKey
    if (keyToCopy) {
      await navigator.clipboard.writeText(keyToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  // Model selection
  const {
    data: models,
    isLoading: isLoadingModels,
    refetch: refetchModels,
  } = useFetchModels(provider.id)
  const { data: selectedModel } = useSelectedModel(provider.id)
  const { data: defaultModel } = useDefaultModel(provider.id)
  const setSelectedModel = useSetSelectedModel()

  // Refetch models when API key changes
  useEffect(() => {
    if (currentKey) {
      refetchModels()
    }
  }, [currentKey, refetchModels])

  const handleSave = async () => {
    if (apiKey.trim()) {
      await onSave(apiKey.trim())
      setApiKeyInput('')
    }
  }

  const handleModelChange = async (model: string) => {
    await setSelectedModel.mutateAsync({ provider: provider.id, model })
  }

  const displayModel = selectedModel ?? defaultModel ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-secondary block text-sm font-medium">
          API Key
        </label>
        <div className="relative mt-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey || (showKey ? (currentKey ?? '') : '')}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={currentKey ? '********' : provider.placeholder}
            className="border-default bg-base text-primary w-full rounded-md border-2 py-2 pr-16 pl-3 focus:border-black focus:outline-none dark:focus:border-white"
            readOnly={!apiKey && showKey && !!currentKey}
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {(apiKey || currentKey) && (
              <button
                type="button"
                onClick={handleCopy}
                className="text-hint hover:bg-hover hover:text-secondary rounded p-1"
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                <Copy size={14} />
              </button>
            )}
            {(apiKey || currentKey) && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-hint hover:bg-hover hover:text-secondary rounded p-1"
                title={showKey ? 'Hide' : 'Show'}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
        </div>
        <p className="text-hint mt-1 text-xs">
          {currentKey
            ? 'Key is set. Enter new key to replace.'
            : `Enter your ${provider.name} API key.`}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          variant="outline"
        >
          Save
        </Button>
        {currentKey && (
          <Button onClick={onDelete} variant="danger">
            Delete
          </Button>
        )}
        {currentKey && !isActive && (
          <Button onClick={onSetActive} variant="outline">
            Set as active
          </Button>
        )}
      </div>

      {currentKey && (
        <div className="border-default border-t pt-4">
          <label className="text-secondary block text-sm font-medium">
            Model
          </label>
          <select
            value={displayModel}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={isLoadingModels}
            className="border-default bg-base text-primary mt-1 w-full rounded-md border-2 px-3 py-2 focus:border-black focus:outline-none disabled:opacity-50 dark:focus:border-white"
          >
            {isLoadingModels ? (
              <option>Loading models...</option>
            ) : (
              models?.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))
            )}
          </select>
          <p className="text-hint mt-1 text-xs">
            Select the model to use for AI tasks.
          </p>
        </div>
      )}
    </div>
  )
}

interface OllamaConfigProps {
  isActive: boolean
  onSetActive: () => void
}

function OllamaConfig({ isActive, onSetActive }: OllamaConfigProps) {
  const { data: status, refetch: refetchStatus } = useOllamaStatus()
  const { data: curatedModels } = useOllamaCuratedModels()
  const { data: installedModels, refetch: refetchInstalled } =
    useOllamaInstalledModels()
  const pullModel = useOllamaPullModel()
  const cancelPull = useOllamaCancelPull()

  // Pull progress state
  const [pullProgress, setPullProgress] = useState<{
    modelName: string
    progress: { status: string; total?: number; completed?: number }
  } | null>(null)
  const [pullingModel, setPullingModel] = useState<string | null>(null)

  // Model selection
  const { data: selectedModel } = useSelectedModel('ollama')
  const { data: defaultModel } = useDefaultModel('ollama')
  const setSelectedModel = useSetSelectedModel()

  // Listen for pull progress events
  useEffect(() => {
    const unsubscribe = window.kairos.ollama.onPullProgress((data) => {
      if (data.modelName === pullingModel) {
        setPullProgress(data)
        // Check if download is complete
        if (data.progress.status === 'success') {
          setPullingModel(null)
          setPullProgress(null)
          refetchInstalled()
        }
      }
    })
    return unsubscribe
  }, [pullingModel, refetchInstalled])

  const handlePullModel = async (modelName: string) => {
    setPullingModel(modelName)
    setPullProgress(null)
    try {
      const result = await pullModel.mutateAsync(modelName)
      if (!result.success) {
        console.error('Failed to pull model:', result.error)
      }
    } finally {
      setPullingModel(null)
      setPullProgress(null)
      refetchInstalled()
    }
  }

  const handleCancelPull = async () => {
    await cancelPull.mutateAsync()
    setPullingModel(null)
    setPullProgress(null)
  }

  const handleModelChange = async (model: string) => {
    await setSelectedModel.mutateAsync({ provider: 'ollama', model })
  }

  const isModelInstalled = (modelId: string) => {
    return installedModels?.some((m) => m.id === modelId) ?? false
  }

  const displayModel = selectedModel ?? defaultModel ?? ''

  // Calculate progress percentage
  const progressPercent =
    pullProgress?.progress.total && pullProgress.progress.completed
      ? Math.round(
          (pullProgress.progress.completed / pullProgress.progress.total) * 100,
        )
      : 0

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div className="space-y-4">
      {/* Status Section */}
      <div>
        <label className="text-secondary block text-sm font-medium">
          Status
        </label>
        {status?.running ? (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-success inline-flex items-center gap-1 text-sm">
              <Check size={14} />
              Running {status.version && `(v${status.version})`}
            </span>
            {!isActive && installedModels && installedModels.length > 0 && (
              <Button onClick={onSetActive} variant="outline">
                Set as active
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            <p className="text-secondary text-sm">Ollama is not running.</p>
            <div className="bg-info-subtle rounded-md p-4">
              <p className="text-info text-sm font-medium">Installation:</p>
              <ol className="text-info mt-2 list-decimal space-y-1 pl-5 text-sm">
                <li>
                  Download from{' '}
                  <a
                    href="https://ollama.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    ollama.com
                  </a>
                </li>
                <li>
                  Or install via{' '}
                  <code className="bg-info-subtle/80 rounded px-1 font-mono">
                    brew install ollama
                  </code>
                </li>
                <li>
                  Start with{' '}
                  <code className="bg-info-subtle/80 rounded px-1 font-mono">
                    ollama serve
                  </code>
                </li>
              </ol>
            </div>
            <Button onClick={() => refetchStatus()} variant="outline">
              Retry Detection
            </Button>
          </div>
        )}
      </div>

      {/* Models Section (only show if running) */}
      {status?.running && (
        <>
          {/* Performance Note */}
          <div className="bg-warning-subtle rounded-md p-3">
            <p className="text-warning text-xs">
              Local models are significantly slower than cloud APIs. Performance
              depends on your hardware.
            </p>
          </div>

          <div className="border-default border-t pt-4">
            <label className="text-secondary block text-sm font-medium">
              Available Models
            </label>
            <p className="text-hint mt-1 text-xs">
              Models optimized for structured output. Download to use.
            </p>
            <div className="mt-3 space-y-2">
              {curatedModels?.map((model) => {
                const installed = isModelInstalled(model.id)
                const isPulling = pullingModel === model.id

                return (
                  <div
                    key={model.id}
                    className="border-default flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <span className="text-primary text-sm font-medium">
                        {model.name}
                      </span>
                      {installed && (
                        <span className="bg-success-subtle text-success ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                          Installed
                        </span>
                      )}
                    </div>
                    {!installed && !isPulling && (
                      <Button
                        onClick={() => handlePullModel(model.id)}
                        disabled={!!pullingModel}
                        variant="outline"
                      >
                        Download
                      </Button>
                    )}
                    {isPulling && (
                      <div className="flex items-center gap-2">
                        <div className="w-32">
                          <div className="bg-hover h-2 w-full rounded-full">
                            <div
                              className="bg-info h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-hint mt-1 text-xs">
                            {pullProgress?.progress.status ===
                            'pulling manifest'
                              ? 'Starting...'
                              : pullProgress?.progress.total
                                ? `${formatBytes(pullProgress.progress.completed ?? 0)} / ${formatBytes(pullProgress.progress.total)}`
                                : (pullProgress?.progress.status ??
                                  'Downloading...')}
                          </p>
                        </div>
                        <button
                          onClick={handleCancelPull}
                          className="text-error hover:text-error/80 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Model Selection (only if has installed models) */}
          {installedModels && installedModels.length > 0 && (
            <div className="border-default border-t pt-4">
              <label className="text-secondary block text-sm font-medium">
                Active Model
              </label>
              <select
                value={displayModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="border-default bg-base text-primary mt-1 w-full rounded-md border-2 px-3 py-2 focus:border-black focus:outline-none dark:focus:border-white"
              >
                {installedModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="text-hint mt-1 text-xs">
                Select the model to use for AI tasks.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function ProvidersSection() {
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderType>('openai')

  // OpenAI hooks
  const { data: openaiKey } = useApiKey()
  const setOpenaiKey = useSetApiKey()
  const deleteOpenaiKey = useDeleteApiKey()

  // DeepSeek hooks
  const { data: deepseekKey } = useDeepSeekApiKey()
  const setDeepseekKey = useSetDeepSeekApiKey()
  const deleteDeepseekKey = useDeleteDeepSeekApiKey()

  // Ollama hooks
  const { data: ollamaStatus } = useOllamaStatus()
  const { data: ollamaInstalledModels } = useOllamaInstalledModels()

  // xAI hooks
  const { data: xaiKey } = useXAIApiKey()
  const setXaiKey = useSetXAIApiKey()
  const deleteXaiKey = useDeleteXAIApiKey()

  // Gemini hooks
  const { data: geminiKey } = useGeminiApiKey()
  const setGeminiKey = useSetGeminiApiKey()
  const deleteGeminiKey = useDeleteGeminiApiKey()

  // Anthropic hooks
  const { data: anthropicKey } = useAnthropicApiKey()
  const setAnthropicKey = useSetAnthropicApiKey()
  const deleteAnthropicKey = useDeleteAnthropicApiKey()

  // Active provider
  const { data: activeProvider } = useActiveProvider()
  const setActiveProvider = useSetActiveProvider()

  const providerStatus: Record<
    ProviderType,
    { isConfigured: boolean; isActive: boolean }
  > = {
    openai: {
      isConfigured: !!openaiKey,
      isActive: activeProvider === 'openai',
    },
    deepseek: {
      isConfigured: !!deepseekKey,
      isActive: activeProvider === 'deepseek',
    },
    ollama: {
      isConfigured:
        !!ollamaStatus?.running && (ollamaInstalledModels?.length ?? 0) > 0,
      isActive: activeProvider === 'ollama',
    },
    xai: { isConfigured: !!xaiKey, isActive: activeProvider === 'xai' },
    gemini: {
      isConfigured: !!geminiKey,
      isActive: activeProvider === 'gemini',
    },
    anthropic: {
      isConfigured: !!anthropicKey,
      isActive: activeProvider === 'anthropic',
    },
  }

  // API key config for providers that use API keys (excludes ollama)
  const apiKeyConfig = {
    openai: {
      key: openaiKey,
      setKey: setOpenaiKey,
      deleteKey: deleteOpenaiKey,
    },
    deepseek: {
      key: deepseekKey,
      setKey: setDeepseekKey,
      deleteKey: deleteDeepseekKey,
    },
    xai: { key: xaiKey, setKey: setXaiKey, deleteKey: deleteXaiKey },
    gemini: {
      key: geminiKey,
      setKey: setGeminiKey,
      deleteKey: deleteGeminiKey,
    },
    anthropic: {
      key: anthropicKey,
      setKey: setAnthropicKey,
      deleteKey: deleteAnthropicKey,
    },
  } as Record<
    ProviderType,
    {
      key: string | null | undefined
      setKey: typeof setOpenaiKey
      deleteKey: typeof deleteOpenaiKey
    }
  >

  return (
    <div className="flex h-full gap-6">
      {/* Provider List */}
      <div className="border-default w-52 shrink-0 border-r pr-4">
        <h2 className="text-hint mb-3 text-sm font-semibold">Providers</h2>
        <div className="space-y-1">
          {PROVIDERS.map((provider) => {
            const status = providerStatus[provider.id]
            const Icon = PROVIDER_ICONS[provider.id]
            const isSelected = selectedProvider === provider.id
            return (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={`border-default flex w-full items-center gap-3 rounded-md border-2 px-3 py-2 text-left transition-colors ${
                  isSelected ? 'bg-surface' : 'bg-base hover:bg-hover'
                }`}
              >
                <Icon size={20} />
                <span
                  className={`flex-1 text-sm ${
                    isSelected ? 'text-primary font-medium' : 'text-secondary'
                  }`}
                >
                  {provider.name}
                </span>
                {(status.isActive || status.isConfigured) && (
                  <span
                    className={`h-2 w-2 rounded-full ${status.isActive ? 'bg-info' : 'bg-success'}`}
                    title={status.isActive ? 'Active' : 'Configured'}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Provider Configuration */}
      <div className="flex-1">
        {selectedProvider === 'ollama' ? (
          <OllamaConfig
            isActive={activeProvider === 'ollama'}
            onSetActive={() => setActiveProvider.mutateAsync('ollama')}
          />
        ) : (
          <ProviderConfig
            provider={PROVIDERS.find((p) => p.id === selectedProvider)!}
            currentKey={apiKeyConfig[selectedProvider].key}
            isActive={activeProvider === selectedProvider}
            onSetActive={() => setActiveProvider.mutateAsync(selectedProvider)}
            onSave={(key) =>
              apiKeyConfig[selectedProvider].setKey.mutateAsync(key)
            }
            onDelete={() =>
              apiKeyConfig[selectedProvider].deleteKey.mutateAsync()
            }
          />
        )}
      </div>
    </div>
  )
}
