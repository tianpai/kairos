import { useEffect, useState } from 'react'
import { Copy, Eye, EyeOff } from 'lucide-react'
import { Anthropic, DeepSeek, Gemini, Grok, OpenAI } from '@lobehub/icons'
import { Button } from '@ui/Button'
import {
  useActiveProvider,
  useDeleteProviderApiKey,
  useFetchModels,
  useHasProviderApiKey,
  useProviderApiKey,
  useSelectedModel,
  useSetActiveProvider,
  useSetProviderApiKey,
  useSetSelectedModel,
} from '@hooks/useSettings'
import type { ProviderType } from '../../../../shared/providers'

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
    description: 'Claude Haiku 4.5, Claude Sonnet 4.6, Claude Opus 4.6 via API',
    placeholder: 'sk-ant-...',
  },
]

const PROVIDER_ICONS: Record<
  ProviderType,
  React.ComponentType<{ size?: number }>
> = {
  openai: OpenAI,
  deepseek: DeepSeek,
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
    isError: isErrorModels,
    refetch: refetchModels,
  } = useFetchModels(provider.id)
  const { data: selectedModel } = useSelectedModel(provider.id)
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
          {isErrorModels ? (
            <p className="text-error mt-1 text-sm">
              Failed to load models. Check your API key or try again later.
            </p>
          ) : (
            <>
              <select
                value={selectedModel ?? ''}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={isLoadingModels}
                className="border-default bg-base text-primary mt-1 w-full rounded-md border-2 px-3 py-2 focus:border-black focus:outline-none disabled:opacity-50 dark:focus:border-white"
              >
                {isLoadingModels ? (
                  <option>Loading models...</option>
                ) : (
                  <>
                    {!selectedModel && (
                      <option value="" disabled>
                        Select a model...
                      </option>
                    )}
                    {models?.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <p className="text-hint mt-1 text-xs">
                Pick a text/chat model. Do not use image, video, or code
                generation models.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function ProvidersSection() {
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderType>('openai')

  const { data: currentKey } = useProviderApiKey(selectedProvider)
  const setProviderApiKey = useSetProviderApiKey(selectedProvider)
  const deleteProviderApiKey = useDeleteProviderApiKey(selectedProvider)

  const { data: openaiConfigured } = useHasProviderApiKey('openai')
  const { data: deepseekConfigured } = useHasProviderApiKey('deepseek')
  const { data: xaiConfigured } = useHasProviderApiKey('xai')
  const { data: geminiConfigured } = useHasProviderApiKey('gemini')
  const { data: anthropicConfigured } = useHasProviderApiKey('anthropic')

  // Active provider
  const { data: activeProvider } = useActiveProvider()
  const setActiveProvider = useSetActiveProvider()

  const providerStatus: Record<
    ProviderType,
    { isConfigured: boolean; isActive: boolean }
  > = {
    openai: {
      isConfigured: !!openaiConfigured,
      isActive: activeProvider === 'openai',
    },
    deepseek: {
      isConfigured: !!deepseekConfigured,
      isActive: activeProvider === 'deepseek',
    },
    xai: {
      isConfigured: !!xaiConfigured,
      isActive: activeProvider === 'xai',
    },
    gemini: {
      isConfigured: !!geminiConfigured,
      isActive: activeProvider === 'gemini',
    },
    anthropic: {
      isConfigured: !!anthropicConfigured,
      isActive: activeProvider === 'anthropic',
    },
  }

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
        <ProviderConfig
          provider={PROVIDERS.find((p) => p.id === selectedProvider)!}
          currentKey={currentKey}
          isActive={activeProvider === selectedProvider}
          onSetActive={() => setActiveProvider.mutateAsync(selectedProvider)}
          onSave={(key) => setProviderApiKey.mutateAsync(key)}
          onDelete={() => deleteProviderApiKey.mutateAsync()}
        />
      </div>
    </div>
  )
}
