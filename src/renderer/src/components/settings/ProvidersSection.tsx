import { useEffect, useState } from 'react'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import { Button } from '@ui/Button'
import { GenericSidebarItem } from '@sidebar/GenericSidebarItem'
import {
  useActiveProvider,
  useAnthropicApiKey,
  useApiKey,
  useClaudeAuthMode,
  useClaudeCliStatus,
  useClaudeCompleteAuth,
  useClaudeConfiguredCliPath,
  useClaudeIsAuthenticated,
  useClaudeLogout,
  useClaudeStartAuth,
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
  useSetClaudeAuthMode,
  useSetClaudeCliPath,
  useSetDeepSeekApiKey,
  useSetGeminiApiKey,
  useSetSelectedModel,
  useSetXAIApiKey,
  useXAIApiKey,
} from '@hooks/useSettings'

type ProviderType =
  | 'openai'
  | 'deepseek'
  | 'claude'
  | 'ollama'
  | 'xai'
  | 'gemini'
  | 'anthropic'

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
    id: 'claude',
    name: 'Claude Code',
    description:
      'Claude Sonnet 4, Opus 4, and Haiku via your Claude subscription',
    placeholder: '',
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
        <label className="block text-sm font-medium text-secondary">
          API Key
        </label>
        <div className="relative mt-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey || (showKey ? (currentKey ?? '') : '')}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={currentKey ? '********' : provider.placeholder}
            className="w-full rounded-md border-2 border-default bg-base py-2 pr-16 pl-3 text-primary focus:border-black focus:outline-none dark:focus:border-white"
            readOnly={!apiKey && showKey && !!currentKey}
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {(apiKey || currentKey) && (
              <button
                type="button"
                onClick={handleCopy}
                className="rounded p-1 text-hint hover:bg-hover hover:text-secondary"
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                <Copy size={14} />
              </button>
            )}
            {(apiKey || currentKey) && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="rounded p-1 text-hint hover:bg-hover hover:text-secondary"
                title={showKey ? 'Hide' : 'Show'}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-hint">
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
          <Button
            onClick={onDelete}
            variant="danger"
          >
            Delete
          </Button>
        )}
        {currentKey && !isActive && (
          <Button
            onClick={onSetActive}
            variant="outline"
          >
            Set as active
          </Button>
        )}
      </div>

      {currentKey && (
        <div className="border-t border-default pt-4">
          <label className="block text-sm font-medium text-secondary">
            Model
          </label>
          <select
            value={displayModel}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={isLoadingModels}
            className="mt-1 w-full rounded-md border-2 border-default bg-base px-3 py-2 text-primary focus:border-black focus:outline-none disabled:opacity-50 dark:focus:border-white"
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
          <p className="mt-1 text-xs text-hint">
            Select the model to use for AI tasks.
          </p>
        </div>
      )}
    </div>
  )
}

interface ClaudeConfigProps {
  isAuthenticated: boolean
  isActive: boolean
  onSetActive: () => void
  onDisconnect: () => void
}

function ClaudeConfig({
  isAuthenticated,
  isActive,
  onSetActive,
  onDisconnect,
}: ClaudeConfigProps) {
  const [authCode, setAuthCode] = useState('')
  const [isAwaitingCode, setIsAwaitingCode] = useState(false)
  const [codeVerifier, setCodeVerifier] = useState<string | null>(null)
  const [useCustomPath, setUseCustomPath] = useState(false)
  const [customPathInput, setCustomPathInput] = useState('')

  // Auth mode hooks
  const { data: authMode } = useClaudeAuthMode()
  const setAuthMode = useSetClaudeAuthMode()
  const {
    data: cliStatus,
    refetch: refetchCliStatus,
    isLoading: isCheckingCli,
  } = useClaudeCliStatus()
  const { data: configuredPath } = useClaudeConfiguredCliPath()
  const setCliPath = useSetClaudeCliPath()

  // Initialize custom path state from configured path
  useEffect(() => {
    if (configuredPath) {
      setUseCustomPath(true)
      setCustomPathInput(configuredPath)
    }
  }, [configuredPath])

  // Auth hooks
  const startAuth = useClaudeStartAuth()
  const completeAuth = useClaudeCompleteAuth()

  // Model selection
  const {
    data: models,
    isLoading: isLoadingModels,
    refetch: refetchModels,
  } = useFetchModels('claude')
  const { data: selectedModel } = useSelectedModel('claude')
  const { data: defaultModel } = useDefaultModel('claude')
  const setSelectedModel = useSetSelectedModel()

  // Refetch models when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refetchModels()
      setIsAwaitingCode(false)
      setAuthCode('')
      setCodeVerifier(null)
    }
  }, [isAuthenticated, refetchModels])

  const handleConnect = async () => {
    const result = await startAuth.mutateAsync()
    setCodeVerifier(result.codeVerifier)
    setIsAwaitingCode(true)
  }

  const handleSubmitCode = async () => {
    if (!authCode.trim()) return
    await completeAuth.mutateAsync({
      code: authCode.trim(),
      codeVerifier: codeVerifier ?? undefined,
    })
  }

  const handleCancel = () => {
    setIsAwaitingCode(false)
    setAuthCode('')
    setCodeVerifier(null)
  }

  const handleModelChange = async (model: string) => {
    await setSelectedModel.mutateAsync({ provider: 'claude', model })
  }

  const handleToggleAuthMode = (checked: boolean) => {
    const newMode = checked ? 'cli' : 'oauth'
    setAuthMode.mutate(newMode)
  }

  const handleSaveCustomPath = async () => {
    if (customPathInput.trim()) {
      await setCliPath.mutateAsync(customPathInput.trim())
      refetchCliStatus()
    }
  }

  const handleClearCustomPath = async () => {
    await setCliPath.mutateAsync(null)
    setCustomPathInput('')
    setUseCustomPath(false)
    refetchCliStatus()
  }

  const displayModel = selectedModel ?? defaultModel ?? ''

  return (
    <div className="space-y-4">
      {/* Authentication Method Toggle */}
      <div>
        <label className="block text-sm font-medium text-secondary">
          Authentication Method
        </label>
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => handleToggleAuthMode(false)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              authMode === 'oauth'
                ? 'bg-primary text-base'
                : 'bg-surface text-secondary hover:bg-hover'
            }`}
          >
            OAuth Subscription
          </button>
          <button
            onClick={() => handleToggleAuthMode(true)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              authMode === 'cli'
                ? 'bg-primary text-base'
                : 'bg-surface text-secondary hover:bg-hover'
            }`}
          >
            Claude Code CLI
          </button>
        </div>

        {/* Warning/Info based on mode */}
        {authMode === 'oauth' && (
          <p className="mt-2 text-xs text-warning">
            Using personal Claude subscription for third-party apps may risk
            account restrictions.
          </p>
        )}
        {authMode === 'cli' && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-hint">
              Requires Claude Code CLI installed and authenticated on your
              system.
            </p>
            <p className="inline-flex items-center gap-1 rounded bg-warning-subtle px-2 py-0.5 text-xs font-medium text-warning">
              Experimental feature
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-default" />

      {/* Conditional Content based on authMode */}
      {authMode === 'oauth' ? (
        <div>
          <label className="block text-sm font-medium text-secondary">
            OAuth Authentication
          </label>
          {isAuthenticated ? (
            <div className="mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-sm text-success">
                <Check size={14} />
                Connected
              </span>
              <Button
                onClick={onDisconnect}
                variant="danger"
              >
                Disconnect
              </Button>
              {!isActive && (
                <Button
                  onClick={onSetActive}
                  variant="outline"
                >
                  Set as active
                </Button>
              )}
            </div>
          ) : isAwaitingCode ? (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-secondary">
                After authorizing in the browser, paste the code from the URL
                below:
              </p>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Paste authorization code here..."
                className="w-full rounded-md border-2 border-default bg-base px-3 py-2 text-primary focus:border-black focus:outline-none dark:focus:border-white"
              />
              <p className="text-xs text-hint">
                Look for the code in the URL after &quot;?code=&quot; (before
                any # symbol)
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitCode}
                  disabled={!authCode.trim() || completeAuth.isPending}
                  variant="outline"
                >
                  {completeAuth.isPending ? 'Connecting...' : 'Submit Code'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
              {completeAuth.isError && (
                <p className="text-sm text-error">
                  Failed to connect. Please try again.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <Button
                onClick={handleConnect}
                disabled={startAuth.isPending}
                variant="outline"
              >
                {startAuth.isPending
                  ? 'Opening browser...'
                  : 'Connect with Claude'}
              </Button>
              <p className="mt-2 text-xs text-hint">
                Sign in with your Claude subscription to use Claude models.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* CLI Mode */
        <div className="space-y-4">
          {/* Path Configuration */}
          <div>
            <label className="block text-sm font-medium text-secondary">
              CLI Path
            </label>
            <div className="mt-2 flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!useCustomPath}
                  onChange={() => {
                    setUseCustomPath(false)
                    if (configuredPath) handleClearCustomPath()
                  }}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-secondary">
                  Auto-detect
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={useCustomPath}
                  onChange={() => setUseCustomPath(true)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-secondary">
                  Custom path
                </span>
              </label>
            </div>
            {useCustomPath && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={customPathInput}
                  onChange={(e) => setCustomPathInput(e.target.value)}
                  placeholder="/path/to/claude"
                  className="flex-1 rounded-md border-2 border-default bg-base px-3 py-2 text-sm text-primary focus:border-black focus:outline-none dark:focus:border-white"
                />
                <Button
                  onClick={handleSaveCustomPath}
                  disabled={!customPathInput.trim()}
                  variant="outline"
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          {/* CLI Status */}
          <div>
            <label className="block text-sm font-medium text-secondary">
              Status
            </label>
            {isCheckingCli ? (
              <p className="mt-2 text-sm text-hint">
                Checking CLI status...
              </p>
            ) : !cliStatus?.installed ? (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-secondary">
                  Claude Code CLI not found
                  {useCustomPath ? ' at specified path' : ''}.
                </p>
                <div className="rounded-md bg-info-subtle p-4">
                  <p className="text-sm font-medium text-info">
                    Installation:
                  </p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-info">
                    <li>
                      Install via{' '}
                      <code className="rounded bg-info-subtle/80 px-1 font-mono">
                        npm install -g @anthropic-ai/claude-code
                      </code>
                    </li>
                    <li>
                      Or download from{' '}
                      <a
                        href="https://claude.ai/code"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        claude.ai/code
                      </a>
                    </li>
                    <li>
                      Run{' '}
                      <code className="rounded bg-info-subtle/80 px-1 font-mono">
                        claude
                      </code>{' '}
                      to authenticate
                    </li>
                  </ol>
                </div>
                <Button
                  onClick={() => refetchCliStatus()}
                  variant="outline"
                >
                  Retry Detection
                </Button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-sm text-success">
                    <Check size={14} />
                    Ready (v{cliStatus.version})
                  </span>
                  {!isActive && (
                    <Button
                      onClick={onSetActive}
                      variant="outline"
                    >
                      Set as active
                    </Button>
                  )}
                </div>
                <p className="text-xs text-hint">
                  Path:{' '}
                  <code className="rounded bg-surface px-1 font-mono">
                    {cliStatus.path}
                  </code>
                </p>
                <p className="text-xs text-hint">
                  Make sure you have run{' '}
                  <code className="rounded bg-surface px-1 font-mono">
                    claude
                  </code>{' '}
                  in terminal at least once to log in.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Model Selection (shared between both modes) */}
      {((authMode === 'oauth' && isAuthenticated) ||
        (authMode === 'cli' && cliStatus?.authenticated)) && (
        <div className="border-t border-default pt-4">
          <label className="block text-sm font-medium text-secondary">
            Model
          </label>
          <select
            value={displayModel}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={isLoadingModels}
            className="mt-1 w-full rounded-md border-2 border-default bg-base px-3 py-2 text-primary focus:border-black focus:outline-none disabled:opacity-50 dark:focus:border-white"
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
          <p className="mt-1 text-xs text-hint">
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
    const unsubscribe = window.electron.ollama.onPullProgress((data) => {
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
        <label className="block text-sm font-medium text-secondary">
          Status
        </label>
        {status?.running ? (
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check size={14} />
              Running {status.version && `(v${status.version})`}
            </span>
            {!isActive && installedModels && installedModels.length > 0 && (
              <Button
                onClick={onSetActive}
                variant="outline"
              >
                Set as active
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            <p className="text-sm text-secondary">
              Ollama is not running.
            </p>
            <div className="rounded-md bg-info-subtle p-4">
              <p className="text-sm font-medium text-info">
                Installation:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-info">
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
                  <code className="rounded bg-info-subtle/80 px-1 font-mono">
                    brew install ollama
                  </code>
                </li>
                <li>
                  Start with{' '}
                  <code className="rounded bg-info-subtle/80 px-1 font-mono">
                    ollama serve
                  </code>
                </li>
              </ol>
            </div>
            <Button
              onClick={() => refetchStatus()}
              variant="outline"
            >
              Retry Detection
            </Button>
          </div>
        )}
      </div>

      {/* Models Section (only show if running) */}
      {status?.running && (
        <>
          {/* Performance Note */}
          <div className="rounded-md bg-warning-subtle p-3">
            <p className="text-xs text-warning">
              Local models are significantly slower than cloud APIs. Performance
              depends on your hardware.
            </p>
          </div>

          <div className="border-t border-default pt-4">
            <label className="block text-sm font-medium text-secondary">
              Available Models
            </label>
            <p className="mt-1 text-xs text-hint">
              Models optimized for structured output. Download to use.
            </p>
            <div className="mt-3 space-y-2">
              {curatedModels?.map((model) => {
                const installed = isModelInstalled(model.id)
                const isPulling = pullingModel === model.id

                return (
                  <div
                    key={model.id}
                    className="flex items-center justify-between rounded-md border border-default px-3 py-2"
                  >
                    <div>
                      <span className="text-sm font-medium text-primary">
                        {model.name}
                      </span>
                      {installed && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-success-subtle px-2 py-0.5 text-xs font-medium text-success">
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
                          <div className="h-2 w-full rounded-full bg-hover">
                            <div
                              className="h-2 rounded-full bg-info transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-hint">
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
                          className="text-xs text-error hover:text-error/80"
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
            <div className="border-t border-default pt-4">
              <label className="block text-sm font-medium text-secondary">
                Active Model
              </label>
              <select
                value={displayModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="mt-1 w-full rounded-md border-2 border-default bg-base px-3 py-2 text-primary focus:border-black focus:outline-none dark:focus:border-white"
              >
                {installedModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-hint">
                Select the model to use for AI tasks.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ProviderStatusBadge({
  isConfigured,
  isActive,
}: {
  isConfigured: boolean
  isActive: boolean
}) {
  if (isActive) {
    return (
      <span className="text-xs font-medium text-primary">
        Selected
      </span>
    )
  }
  if (isConfigured) {
    return (
      <span className="h-2 w-2 rounded-full bg-success" title="Configured" />
    )
  }
  return null
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

  // Claude hooks
  const { data: isClaudeAuthenticated } = useClaudeIsAuthenticated()
  const claudeLogout = useClaudeLogout()

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

  const handleClaudeDisconnect = async () => {
    await claudeLogout.mutateAsync()
  }

  const getProviderStatus = (providerId: ProviderType) => {
    switch (providerId) {
      case 'openai':
        return {
          isConfigured: !!openaiKey,
          isActive: activeProvider === 'openai',
        }
      case 'deepseek':
        return {
          isConfigured: !!deepseekKey,
          isActive: activeProvider === 'deepseek',
        }
      case 'claude':
        return {
          isConfigured: !!isClaudeAuthenticated,
          isActive: activeProvider === 'claude',
        }
      case 'ollama':
        return {
          isConfigured:
            ollamaStatus?.running && (ollamaInstalledModels?.length ?? 0) > 0,
          isActive: activeProvider === 'ollama',
        }
      case 'xai':
        return {
          isConfigured: !!xaiKey,
          isActive: activeProvider === 'xai',
        }
      case 'gemini':
        return {
          isConfigured: !!geminiKey,
          isActive: activeProvider === 'gemini',
        }
      case 'anthropic':
        return {
          isConfigured: !!anthropicKey,
          isActive: activeProvider === 'anthropic',
        }
    }
  }

  const getProviderSublabel = (providerId: ProviderType) => {
    const status = getProviderStatus(providerId)
    if (status.isActive) return 'Active'
    if (status.isConfigured) return 'Configured'
    return 'Not configured'
  }

  return (
    <div className="flex h-full gap-6">
      {/* Provider List */}
      <div className="w-48 shrink-0 border-r border-default pr-4">
        <h2 className="mb-3 text-sm font-semibold text-hint">
          Providers
        </h2>
        <div className="space-y-1">
          {PROVIDERS.map((provider) => {
            const status = getProviderStatus(provider.id)
            return (
              <GenericSidebarItem
                key={provider.id}
                label={provider.name}
                sublabel={getProviderSublabel(provider.id)}
                isSelected={selectedProvider === provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                rightContent={
                  <ProviderStatusBadge
                    isConfigured={status.isConfigured}
                    isActive={status.isActive}
                  />
                }
              />
            )
          })}
        </div>
      </div>

      {/* Provider Configuration */}
      <div className="flex-1">
        {selectedProvider === 'claude' ? (
          <ClaudeConfig
            isAuthenticated={isClaudeAuthenticated ?? false}
            isActive={activeProvider === 'claude'}
            onSetActive={() => setActiveProvider.mutateAsync('claude')}
            onDisconnect={handleClaudeDisconnect}
          />
        ) : selectedProvider === 'ollama' ? (
          <OllamaConfig
            isActive={activeProvider === 'ollama'}
            onSetActive={() => setActiveProvider.mutateAsync('ollama')}
          />
        ) : selectedProvider === 'openai' ? (
          <ProviderConfig
            provider={PROVIDERS.find((p) => p.id === 'openai')!}
            currentKey={openaiKey}
            isActive={activeProvider === 'openai'}
            onSetActive={() => setActiveProvider.mutateAsync('openai')}
            onSave={(key) => setOpenaiKey.mutateAsync(key)}
            onDelete={() => deleteOpenaiKey.mutateAsync()}
          />
        ) : selectedProvider === 'deepseek' ? (
          <ProviderConfig
            provider={PROVIDERS.find((p) => p.id === 'deepseek')!}
            currentKey={deepseekKey}
            isActive={activeProvider === 'deepseek'}
            onSetActive={() => setActiveProvider.mutateAsync('deepseek')}
            onSave={(key) => setDeepseekKey.mutateAsync(key)}
            onDelete={() => deleteDeepseekKey.mutateAsync()}
          />
        ) : selectedProvider === 'xai' ? (
          <ProviderConfig
            provider={PROVIDERS.find((p) => p.id === 'xai')!}
            currentKey={xaiKey}
            isActive={activeProvider === 'xai'}
            onSetActive={() => setActiveProvider.mutateAsync('xai')}
            onSave={(key) => setXaiKey.mutateAsync(key)}
            onDelete={() => deleteXaiKey.mutateAsync()}
          />
        ) : selectedProvider === 'gemini' ? (
          <ProviderConfig
            provider={PROVIDERS.find((p) => p.id === 'gemini')!}
            currentKey={geminiKey}
            isActive={activeProvider === 'gemini'}
            onSetActive={() => setActiveProvider.mutateAsync('gemini')}
            onSave={(key) => setGeminiKey.mutateAsync(key)}
            onDelete={() => deleteGeminiKey.mutateAsync()}
          />
        ) : (
          <ProviderConfig
            provider={PROVIDERS.find((p) => p.id === 'anthropic')!}
            currentKey={anthropicKey}
            isActive={activeProvider === 'anthropic'}
            onSetActive={() => setActiveProvider.mutateAsync('anthropic')}
            onSave={(key) => setAnthropicKey.mutateAsync(key)}
            onDelete={() => deleteAnthropicKey.mutateAsync()}
          />
        )}
      </div>
    </div>
  )
}
