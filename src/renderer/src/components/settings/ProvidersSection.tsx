import { useEffect, useState } from 'react'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import { InvertedButton } from '@ui/InvertedButton'
import { GenericSidebarItem } from '@sidebar/GenericSidebarItem'
import {
  useActiveProvider,
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
  useDeleteApiKey,
  useDeleteDeepSeekApiKey,
  useFetchModels,
  useSelectedModel,
  useSetActiveProvider,
  useSetApiKey,
  useSetClaudeAuthMode,
  useSetClaudeCliPath,
  useSetDeepSeekApiKey,
  useSetSelectedModel,
} from '@hooks/useSettings'

type ProviderType = 'openai' | 'deepseek' | 'claude'

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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          API Key
        </label>
        <div className="relative mt-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey || (showKey ? (currentKey ?? '') : '')}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={currentKey ? '********' : provider.placeholder}
            className="w-full rounded-md border-2 border-gray-300 bg-white py-2 pr-16 pl-3 focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
            readOnly={!apiKey && showKey && !!currentKey}
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {(apiKey || currentKey) && (
              <button
                type="button"
                onClick={handleCopy}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                <Copy size={14} />
              </button>
            )}
            {(apiKey || currentKey) && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                title={showKey ? 'Hide' : 'Show'}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {currentKey
            ? 'Key is set. Enter new key to replace.'
            : `Enter your ${provider.name} API key.`}
        </p>
      </div>

      <div className="flex gap-2">
        <InvertedButton
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Save
        </InvertedButton>
        {currentKey && (
          <InvertedButton
            onClick={onDelete}
            className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
          >
            Delete
          </InvertedButton>
        )}
        {currentKey && !isActive && (
          <InvertedButton
            onClick={onSetActive}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Set as active
          </InvertedButton>
        )}
      </div>

      {currentKey && (
        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Model
          </label>
          <select
            value={displayModel}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={isLoadingModels}
            className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
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
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
  const { data: cliStatus, refetch: refetchCliStatus, isLoading: isCheckingCli } = useClaudeCliStatus()
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Authentication Method
        </label>
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => handleToggleAuthMode(false)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              authMode === 'oauth'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            OAuth Subscription
          </button>
          <button
            onClick={() => handleToggleAuthMode(true)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              authMode === 'cli'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Claude Code CLI
          </button>
        </div>

        {/* Warning/Info based on mode */}
        {authMode === 'oauth' && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Using personal Claude subscription for third-party apps may risk
            account restrictions.
          </p>
        )}
        {authMode === 'cli' && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Requires Claude Code CLI installed and authenticated on your system.
            </p>
            <p className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              Experimental feature
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Conditional Content based on authMode */}
      {authMode === 'oauth' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            OAuth Authentication
          </label>
          {isAuthenticated ? (
            <div className="mt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <Check size={14} />
                Connected
              </span>
              <InvertedButton
                onClick={onDisconnect}
                className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
              >
                Disconnect
              </InvertedButton>
              {!isActive && (
                <InvertedButton
                  onClick={onSetActive}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Set as active
                </InvertedButton>
              )}
            </div>
          ) : isAwaitingCode ? (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                After authorizing in the browser, paste the code from the URL
                below:
              </p>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Paste authorization code here..."
                className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Look for the code in the URL after &quot;?code=&quot; (before
                any # symbol)
              </p>
              <div className="flex gap-2">
                <InvertedButton
                  onClick={handleSubmitCode}
                  disabled={!authCode.trim() || completeAuth.isPending}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {completeAuth.isPending ? 'Connecting...' : 'Submit Code'}
                </InvertedButton>
                <InvertedButton
                  onClick={handleCancel}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </InvertedButton>
              </div>
              {completeAuth.isError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Failed to connect. Please try again.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <InvertedButton
                onClick={handleConnect}
                disabled={startAuth.isPending}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {startAuth.isPending
                  ? 'Opening browser...'
                  : 'Connect with Claude'}
              </InvertedButton>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="text-gray-900 focus:ring-gray-900 dark:text-white dark:focus:ring-white"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Auto-detect</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={useCustomPath}
                  onChange={() => setUseCustomPath(true)}
                  className="text-gray-900 focus:ring-gray-900 dark:text-white dark:focus:ring-white"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Custom path</span>
              </label>
            </div>
            {useCustomPath && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={customPathInput}
                  onChange={(e) => setCustomPathInput(e.target.value)}
                  placeholder="/path/to/claude"
                  className="flex-1 rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
                />
                <InvertedButton
                  onClick={handleSaveCustomPath}
                  disabled={!customPathInput.trim()}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Save
                </InvertedButton>
              </div>
            )}
          </div>

          {/* CLI Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            {isCheckingCli ? (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Checking CLI status...
              </p>
            ) : !cliStatus?.installed ? (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Claude Code CLI not found{useCustomPath ? ' at specified path' : ''}.
                </p>
                <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Installation:
                  </p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-blue-700 dark:text-blue-300">
                    <li>
                      Install via{' '}
                      <code className="rounded bg-blue-100 px-1 font-mono dark:bg-blue-900">
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
                      <code className="rounded bg-blue-100 px-1 font-mono dark:bg-blue-900">
                        claude
                      </code>{' '}
                      to authenticate
                    </li>
                  </ol>
                </div>
                <InvertedButton
                  onClick={() => refetchCliStatus()}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Retry Detection
                </InvertedButton>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <Check size={14} />
                    Ready (v{cliStatus.version})
                  </span>
                  {!isActive && (
                    <InvertedButton
                      onClick={onSetActive}
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Set as active
                    </InvertedButton>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Path:{' '}
                  <code className="rounded bg-gray-100 px-1 font-mono dark:bg-gray-800">
                    {cliStatus.path}
                  </code>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Make sure you have run{' '}
                  <code className="rounded bg-gray-100 px-1 font-mono dark:bg-gray-800">
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
        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Model
          </label>
          <select
            value={displayModel}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={isLoadingModels}
            className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
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
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Select the model to use for AI tasks.
          </p>
        </div>
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
      <span className="text-xs font-medium text-gray-900 dark:text-white">
        Selected
      </span>
    )
  }
  if (isConfigured) {
    return (
      <span className="h-2 w-2 rounded-full bg-green-500" title="Configured" />
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
      <div className="w-48 shrink-0 border-r border-gray-200 pr-4 dark:border-gray-700">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
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
        ) : selectedProvider === 'openai' ? (
          <ProviderConfig
            provider={PROVIDERS.find((p) => p.id === 'openai')!}
            currentKey={openaiKey}
            isActive={activeProvider === 'openai'}
            onSetActive={() => setActiveProvider.mutateAsync('openai')}
            onSave={(key) => setOpenaiKey.mutateAsync(key)}
            onDelete={() => deleteOpenaiKey.mutateAsync()}
          />
        ) : (
          <ProviderConfig
            provider={PROVIDERS.find((p) => p.id === 'deepseek')!}
            currentKey={deepseekKey}
            isActive={activeProvider === 'deepseek'}
            onSetActive={() => setActiveProvider.mutateAsync('deepseek')}
            onSave={(key) => setDeepseekKey.mutateAsync(key)}
            onDelete={() => deleteDeepseekKey.mutateAsync()}
          />
        )}
      </div>
    </div>
  )
}
