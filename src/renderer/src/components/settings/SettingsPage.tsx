import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, PanelLeft } from 'lucide-react'
import { PageHeader } from '@ui/PageHeader'
import { InvertedButton } from '@ui/InvertedButton'
import { AppLayout } from '@layout/AppLayout'
import { useLayoutStore } from '@layout/layout.store'
import {  SettingsSidebar } from './SettingsSidebar'
import { ProvidersSection } from './ProvidersSection'
import { AppearanceSection } from './AppearanceSection'
import { TipsSection } from './TipsSection'
import { AboutSection } from './AboutSection'
import type {SettingsSection} from './SettingsSidebar';

export default function SettingsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('providers')

  const { settingsSidebarCollapsed, toggleSettingsSidebar } = useLayoutStore()

  return (
    <AppLayout
      header={
        <PageHeader
          left={
            <>
              <InvertedButton
                onClick={toggleSettingsSidebar}
                ariaLabel={
                  settingsSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'
                }
                title={settingsSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                <PanelLeft size={16} />
              </InvertedButton>
              <InvertedButton
                onClick={() => navigate({ to: '/', search: { jobId: undefined } })}
                ariaLabel="Back to dashboard"
                title="Back"
              >
                <ArrowLeft size={16} />
              </InvertedButton>
            </>
          }
          center={<div className="text-sm font-medium">Settings</div>}
        />
      }
      sidebar={
        <SettingsSidebar
          collapsed={settingsSidebarCollapsed}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      }
    >
      <main className="flex-1 overflow-auto p-8">
        {activeSection === 'providers' && <ProvidersSection />}
        {activeSection === 'appearance' && <AppearanceSection />}
        {activeSection === 'tips' && <TipsSection />}
        {activeSection === 'about' && <AboutSection />}
      </main>
    </AppLayout>
  )
}
