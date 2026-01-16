import { useState } from 'react'
import { Modal } from '@ui/Modal'
import { Button } from '@ui/Button'
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
        <Button onClick={handleSave} disabled={!apiKey.trim()}>
          Save
        </Button>
      }
      leftActions={
        currentKey ? (
          <Button
            onClick={handleDelete}
            bgColor="bg-red-600"
            hoverBgColor="hover:bg-red-100"
            hoverTextColor="hover:text-red-600"
          >
            Delete Key
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Settings</h2>
        <div>
          <label className="text-secondary block text-sm font-medium">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={currentKey ? '••••••••' : 'sk-...'}
            className="border-default focus:border-primary mt-1 w-full border-2 px-3 py-2 focus:outline-none"
          />
          <p className="text-hint mt-1 text-xs">
            {currentKey
              ? 'Key is set. Enter new key to replace.'
              : 'Enter your OpenAI API key.'}
          </p>
        </div>
      </div>
    </Modal>
  )
}
