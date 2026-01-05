import { useState, useEffect } from 'react'
import { InvertedButton } from '@ui/InvertedButton'
import {
  useApiKey,
  useDeleteApiKey,
  useSetApiKey,
  useFetchModels,
  useSelectedModel,
  useSetSelectedModel,
  useDefaultModel,
} from '@hooks/useSettings'

export function ApiKeysSection() {
  const { data: currentKey } = useApiKey()
  const setApiKey = useSetApiKey()
  const deleteApiKey = useDeleteApiKey()
  const [apiKey, setApiKeyInput] = useState('')

  // Model selection
  const { data: models, isLoading: isLoadingModels, refetch: refetchModels } = useFetchModels('openai')
  const { data: selectedModel } = useSelectedModel('openai')
  const { data: defaultModel } = useDefaultModel('openai')
  const setSelectedModel = useSetSelectedModel()

  // Refetch models when API key changes
  useEffect(() => {
    if (currentKey) {
      refetchModels()
    }
  }, [currentKey, refetchModels])

  const handleSave = async () => {
    if (apiKey.trim()) {
      await setApiKey.mutateAsync(apiKey.trim())
      setApiKeyInput('')
    }
  }

  const handleDelete = async () => {
    await deleteApiKey.mutateAsync()
  }

  const handleModelChange = async (model: string) => {
    await setSelectedModel.mutateAsync({ provider: 'openai', model })
  }

  const displayModel = selectedModel ?? defaultModel ?? 'gpt-4o-mini'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">API Keys</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your API keys for AI providers.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={currentKey ? '••••••••' : 'sk-...'}
            className="mt-1 w-full max-w-md border-2 border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {currentKey
              ? 'Key is set. Enter new key to replace.'
              : 'Enter your OpenAI API key.'}
          </p>
        </div>

        <div className="flex gap-2">
          <InvertedButton onClick={handleSave} disabled={!apiKey.trim()}>
            Save
          </InvertedButton>
          {currentKey && (
            <InvertedButton
              onClick={handleDelete}
              bgColor="bg-red-600"
              hoverBgColor="hover:bg-red-100"
              hoverTextColor="hover:text-red-600"
            >
              Delete Key
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
              className="mt-1 w-full max-w-md border-2 border-gray-300 bg-white px-3 py-2 focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white disabled:opacity-50"
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
              Select the model to use for all AI tasks.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
