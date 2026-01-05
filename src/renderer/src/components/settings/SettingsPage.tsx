import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Cpu, Info, Lightbulb, Palette } from 'lucide-react'
import { PageHeader } from '@ui/PageHeader'
import { InvertedButton } from '@ui/InvertedButton'
import { ProvidersSection } from './ProvidersSection'
import { AppearanceSection } from './AppearanceSection'
import { TipsSection } from './TipsSection'
import { AboutSection } from './AboutSection'

type SettingsSection = 'providers' | 'appearance' | 'tips' | 'about'

const NAV_ITEMS: Array<{
  id: SettingsSection
  label: string
  icon: typeof Cpu
}> = [
  { id: 'providers', label: 'Providers', icon: Cpu },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'tips', label: 'Tips', icon: Lightbulb },
  { id: 'about', label: 'About', icon: Info },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('providers')

  return (
    <div className="flex h-screen flex-col bg-[#fafafa] dark:bg-[#1a1a1a]">
      <PageHeader
        left={
          <InvertedButton
            onClick={() => navigate({ to: '/', search: { jobId: undefined } })}
            ariaLabel="Back to dashboard"
            title="Back"
          >
            <ArrowLeft size={16} />
          </InvertedButton>
        }
        center={<div className="text-sm font-medium">Settings</div>}
      />

      <div className="flex flex-1 overflow-hidden">
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

        <main className="flex-1 overflow-auto p-8">
          {activeSection === 'providers' && <ProvidersSection />}
          {activeSection === 'appearance' && <AppearanceSection />}
          {activeSection === 'tips' && <TipsSection />}
          {activeSection === 'about' && <AboutSection />}
        </main>
      </div>
    </div>
  )
}
