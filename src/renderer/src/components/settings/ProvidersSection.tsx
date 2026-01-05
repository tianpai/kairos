import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { InvertedButton } from '@ui/InvertedButton'
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
} from '@hooks/useSettings'

type ProviderType = 'openai' | 'deepseek'

interface ProviderCardProps {
  provider: ProviderType
  name: string
  description: string
  placeholder: string
  currentKey: string | null | undefined
  isActive: boolean
  onSetActive: () => void
  onSave: (key: string) => Promise<void>
  onDelete: () => Promise<void>
}

function ProviderCard({
  provider,
  name,
  description,
  placeholder,
  currentKey,
  isActive,
  onSetActive,
  onSave,
  onDelete,
}: ProviderCardProps) {
  const [apiKey, setApiKeyInput] = useState('')

  // Model selection
  const { data: models, isLoading: isLoadingModels, refetch: refetchModels } = useFetchModels(provider)
  const { data: selectedModel } = useSelectedModel(provider)
  const { data: defaultModel } = useDefaultModel(provider)
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
    await setSelectedModel.mutateAsync({ provider, model })
  }

  const displayModel = selectedModel ?? defaultModel ?? ''
  const canSetActive = !!currentKey

  return (
    <div
      className={`border-2 p-4 transition-colors ${
        isActive
          ? 'border-black dark:border-white'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">{name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
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
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={currentKey ? '********' : placeholder}
            className="mt-1 w-full border-2 border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {currentKey ? 'Key is set. Enter new key to replace.' : `Enter your ${name} API key.`}
          </p>
        </div>

        <div className="flex gap-2">
          <InvertedButton onClick={handleSave} disabled={!apiKey.trim()}>
            Save
          </InvertedButton>
          {currentKey && (
            <InvertedButton
              onClick={onDelete}
              bgColor="bg-red-600"
              hoverBgColor="hover:bg-red-100"
              hoverTextColor="hover:text-red-600"
            >
              Delete
            </InvertedButton>
          )}
        </div>

        {currentKey && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Model
            </label>
            <select
              value={displayModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={isLoadingModels}
              className="mt-1 w-full border-2 border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white disabled:opacity-50"
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

export function ProvidersSection() {
  // OpenAI hooks
  const { data: openaiKey } = useApiKey()
  const setOpenaiKey = useSetApiKey()
  const deleteOpenaiKey = useDeleteApiKey()

  // DeepSeek hooks
  const { data: deepseekKey } = useDeepSeekApiKey()
  const setDeepseekKey = useSetDeepSeekApiKey()
  const deleteDeepseekKey = useDeleteDeepSeekApiKey()

  // Active provider
  const { data: activeProvider } = useActiveProvider()
  const setActiveProvider = useSetActiveProvider()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">AI Providers</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure your AI provider API keys and select models. Click the circle to set the active
          provider.
        </p>
      </div>

      <div className="grid gap-4">
        <ProviderCard
          provider="openai"
          name="OpenAI"
          description="GPT-4o, GPT-4o-mini, and other OpenAI models"
          placeholder="sk-..."
          currentKey={openaiKey}
          isActive={activeProvider === 'openai'}
          onSetActive={() => setActiveProvider.mutateAsync('openai')}
          onSave={(key) => setOpenaiKey.mutateAsync(key)}
          onDelete={() => deleteOpenaiKey.mutateAsync()}
        />

        <ProviderCard
          provider="deepseek"
          name="DeepSeek"
          description="DeepSeek Chat and DeepSeek Reasoner models"
          placeholder="sk-..."
          currentKey={deepseekKey}
          isActive={activeProvider === 'deepseek'}
          onSetActive={() => setActiveProvider.mutateAsync('deepseek')}
          onSave={(key) => setDeepseekKey.mutateAsync(key)}
          onDelete={() => deleteDeepseekKey.mutateAsync()}
        />
      </div>
    </div>
  )
}
