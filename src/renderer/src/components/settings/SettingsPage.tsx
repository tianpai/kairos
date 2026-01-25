import { useNavigate, useSearch } from '@tanstack/react-router'
import { PageHeader } from '@ui/PageHeader'
import { AppLayout } from '@layout/AppLayout'
import { AllApplicationBtn } from '../ui/BtnBack'
import { SettingsSidebar } from './SettingsSidebar'
import { ProvidersSection } from './ProvidersSection'
import { AppearanceSection } from './AppearanceSection'
import { TipsSection } from './TipsSection'
import { GeneralSection } from './GeneralSection'
import { AboutSection } from './AboutSection'
import type { SettingsSection } from './SettingsSidebar'

const validSections: Array<SettingsSection> = [
  'providers',
  'appearance',
  'tips',
  'general',
  'about',
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { section } = useSearch({ from: '/settings' })

  const activeSection: SettingsSection =
    section && validSections.includes(section as SettingsSection)
      ? (section as SettingsSection)
      : 'providers'

  const handleSectionChange = (newSection: SettingsSection) => {
    navigate({
      to: '/settings',
      search: { section: newSection, update: undefined, version: undefined },
      replace: true,
    })
  }
  return (
    <AppLayout
      header={
        <PageHeader left={<AllApplicationBtn />} center={<div>Settings</div>} />
      }
      sidebar={
        <SettingsSidebar
          collapsed={false}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      }
    >
      <main className="flex-1 overflow-auto p-8">
        {activeSection === 'providers' && <ProvidersSection />}
        {activeSection === 'appearance' && <AppearanceSection />}
        {activeSection === 'tips' && <TipsSection />}
        {activeSection === 'general' && <GeneralSection />}
        {activeSection === 'about' && <AboutSection />}
      </main>
    </AppLayout>
  )
}
