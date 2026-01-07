import { useState } from 'react'
import { Modal } from '@ui/Modal'
import { InvertedButton } from '@ui/InvertedButton'
import { useApiKey, useDeleteApiKey, useSetApiKey } from '@hooks/useSettings'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { data: currentKey } = useApiKey()
  const setApiKey = useSetApiKey()
  const deleteApiKey = useDeleteApiKey()
  const [apiKey, setApiKeyInput] = useState('')

  const handleSave = async () => {
    if (apiKey.trim()) {
      await setApiKey.mutateAsync(apiKey.trim())
      setApiKeyInput('')
      onClose()
    }
  }

  const handleDelete = async () => {
    await deleteApiKey.mutateAsync()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="sm"
      actions={
        <InvertedButton onClick={handleSave} disabled={!apiKey.trim()}>
          Save
        </InvertedButton>
      }
      leftActions={
        currentKey ? (
          <InvertedButton
            onClick={handleDelete}
            bgColor="bg-red-600"
            hoverBgColor="hover:bg-red-100"
            hoverTextColor="hover:text-red-600"
          >
            Delete Key
          </InvertedButton>
        ) : null
      }
    >
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Settings</h2>
        <div>
          <label className="block text-sm font-medium text-secondary">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={currentKey ? '••••••••' : 'sk-...'}
            className="mt-1 w-full border-2 border-default px-3 py-2 focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-xs text-hint">
            {currentKey
              ? 'Key is set. Enter new key to replace.'
              : 'Enter your OpenAI API key.'}
          </p>
        </div>
      </div>
    </Modal>
  )
}
