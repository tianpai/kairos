import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@ui/PageHeader'
import { Button } from '@ui/Button'
import { AppLayout } from '@layout/AppLayout'
import { SettingsSidebar } from './SettingsSidebar'
import { ProvidersSection } from './ProvidersSection'
import { AppearanceSection } from './AppearanceSection'
import { TipsSection } from './TipsSection'
import { GeneralSection } from './GeneralSection'
import { AboutSection } from './AboutSection'
import type { SettingsSection } from './SettingsSidebar'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('providers')

  return (
    <AppLayout
      header={
        <PageHeader
          left={
            <>
              <Button
                onClick={() =>
                  navigate({ to: '/', search: { jobId: undefined } })
                }
                ariaLabel="Back to dashboard"
                title="Back"
              >
                <ArrowLeft size={16} />
              </Button>
            </>
          }
          center={<div className="text-sm font-medium">Settings</div>}
        />
      }
      sidebar={
        <SettingsSidebar
          collapsed={false}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
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
