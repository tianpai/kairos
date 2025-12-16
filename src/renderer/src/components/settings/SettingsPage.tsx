import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Key, Palette, Monitor, Sun, Moon } from 'lucide-react'
import { PageHeader } from '@ui/PageHeader'
import { InvertedButton } from '@ui/InvertedButton'
import { useApiKey, useSetApiKey, useDeleteApiKey } from '@hooks/useSettings'
import { useTheme, useSetTheme } from '@hooks/useTheme'

type SettingsSection = 'api-keys' | 'appearance'

const NAV_ITEMS: { id: SettingsSection; label: string; icon: typeof Key }[] = [
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

function ApiKeysSection() {
  const { data: currentKey } = useApiKey()
  const setApiKey = useSetApiKey()
  const deleteApiKey = useDeleteApiKey()
  const [apiKey, setApiKeyInput] = useState('')

  const handleSave = async () => {
    if (apiKey.trim()) {
      await setApiKey.mutateAsync(apiKey.trim())
      setApiKeyInput('')
    }
  }

  const handleDelete = async () => {
    await deleteApiKey.mutateAsync()
  }

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
      </div>
    </div>
  )
}

type ThemeSource = 'system' | 'light' | 'dark'

const THEME_OPTIONS: { value: ThemeSource; label: string; icon: typeof Monitor }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

function AppearanceSection() {
  const { data: currentTheme } = useTheme()
  const setTheme = useSetTheme()

  const handleThemeChange = (theme: ThemeSource) => {
    setTheme.mutate(theme)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize the look and feel of the app.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
          <div className="flex gap-2">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon
              const isSelected = currentTheme === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={`flex items-center gap-2 rounded-md border-2 px-4 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Icon size={16} />
                  {option.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            In dark mode, the resume preview adapts for readability. Downloaded PDFs remain
            unchanged.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<SettingsSection>('api-keys')

  return (
    <div className="flex h-screen flex-col bg-[#fafafa] dark:bg-[#1a1a1a]">
      <PageHeader
        left={
          <InvertedButton
            onClick={() => navigate({ to: '/' })}
            ariaLabel="Back to dashboard"
            title="Back"
          >
            <ArrowLeft size={16} />
          </InvertedButton>
        }
        center={<div className="text-sm font-medium">Settings</div>}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <nav className="w-48 border-r border-gray-200 bg-[#fafafa] p-4 dark:border-gray-700 dark:bg-[#1a1a1a]">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-gray-200 font-medium text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Right Content */}
        <main className="flex-1 overflow-auto p-8">
          {activeSection === 'api-keys' && <ApiKeysSection />}
          {activeSection === 'appearance' && <AppearanceSection />}
        </main>
      </div>
    </div>
  )
}
