import { useState, useEffect } from 'react'
import { Check, Eye, EyeOff, Copy } from 'lucide-react'
import { InvertedButton } from '@ui/InvertedButton'
import { GenericSidebarItem } from '@sidebar/GenericSidebarItem'
import {
  useApiKey,
  useDeleteApiKey,
  useSetApiKey,
  useDeepSeekApiKey,
  useDeleteDeepSeekApiKey,
  useSetDeepSeekApiKey,
  useFetchModels,
  useSelectedModel,
  useSetSelectedModel,
  useDefaultModel,
  useActiveProvider,
  useSetActiveProvider,
  useClaudeIsAuthenticated,
  useClaudeStartAuth,
  useClaudeCompleteAuth,
  useClaudeLogout,
} from '@hooks/useSettings'

type ProviderType = 'openai' | 'deepseek' | 'claude'

interface ProviderInfo {
  id: ProviderType
  name: string
  description: string
  placeholder: string
}

const PROVIDERS: ProviderInfo[] = [
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
    name: 'Anthropic subscription',
    description: 'Claude Sonnet 4, Opus 4, and Haiku via your Claude subscription',
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
  const { data: models, isLoading: isLoadingModels, refetch: refetchModels } = useFetchModels(provider.id)
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
  const canSetActive = !!currentKey

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{provider.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {provider.description}
          </p>
        </div>
        <button
          onClick={onSetActive}
          disabled={!canSetActive}
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
            isActive
              ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
              : canSetActive
                ? 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                : 'cursor-not-allowed border-gray-200 opacity-50 dark:border-gray-700'
          }`}
          title={canSetActive ? (isActive ? 'Active provider' : 'Set as active') : 'Add API key first'}
        >
          {isActive && <Check size={14} strokeWidth={3} />}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            API Key
          </label>
          <div className="relative mt-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey || (showKey ? currentKey ?? '' : '')}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={currentKey ? '********' : provider.placeholder}
              className="w-full rounded-md border-2 border-gray-300 bg-white py-2 pl-3 pr-16 focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
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
            {currentKey ? 'Key is set. Enter new key to replace.' : `Enter your ${provider.name} API key.`}
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
              className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white disabled:opacity-50"
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

  // Auth hooks
  const startAuth = useClaudeStartAuth()
  const completeAuth = useClaudeCompleteAuth()

  // Model selection
  const { data: models, isLoading: isLoadingModels, refetch: refetchModels } = useFetchModels('claude')
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
    await completeAuth.mutateAsync({ code: authCode.trim(), codeVerifier: codeVerifier ?? undefined })
  }

  const handleCancel = () => {
    setIsAwaitingCode(false)
    setAuthCode('')
    setCodeVerifier(null)
  }

  const handleModelChange = async (model: string) => {
    await setSelectedModel.mutateAsync({ provider: 'claude', model })
  }

  const displayModel = selectedModel ?? defaultModel ?? ''
  const canSetActive = isAuthenticated
  const provider = PROVIDERS.find((p) => p.id === 'claude')!

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{provider.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {provider.description}
          </p>
        </div>
        <button
          onClick={onSetActive}
          disabled={!canSetActive}
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
            isActive
              ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
              : canSetActive
                ? 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                : 'cursor-not-allowed border-gray-200 opacity-50 dark:border-gray-700'
          }`}
          title={canSetActive ? (isActive ? 'Active provider' : 'Set as active') : 'Connect first'}
        >
          {isActive && <Check size={14} strokeWidth={3} />}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Authentication
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
            </div>
          ) : isAwaitingCode ? (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                After authorizing in the browser, paste the code from the URL below:
              </p>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Paste authorization code here..."
                className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Look for the code in the URL after &quot;?code=&quot; (before any # symbol)
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
                {startAuth.isPending ? 'Opening browser...' : 'Connect with Claude'}
              </InvertedButton>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Sign in with your Claude subscription to use Claude models.
              </p>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Model
            </label>
            <select
              value={displayModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={isLoadingModels}
              className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white disabled:opacity-50"
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
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('openai')

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
        return { isConfigured: !!openaiKey, isActive: activeProvider === 'openai' }
      case 'deepseek':
        return { isConfigured: !!deepseekKey, isActive: activeProvider === 'deepseek' }
      case 'claude':
        return { isConfigured: !!isClaudeAuthenticated, isActive: activeProvider === 'claude' }
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
