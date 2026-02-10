import { Cpu, Info, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SidebarItem } from '@/components/sidebar/SidebarItem'
import { Sidebar } from '@/components/sidebar/Sidebar'

export type SettingsSection =
  | 'providers'
  | 'general'
  | 'about'

interface NavItem {
  id: SettingsSection
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: Array<NavItem> = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'providers', label: 'Providers', icon: Cpu },
  { id: 'about', label: 'About', icon: Info },
]

interface SettingsSidebarProps {
  collapsed: boolean
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
}

export function SettingsSidebar({
  collapsed,
  activeSection,
  onSectionChange,
}: SettingsSidebarProps) {
  return (
    <Sidebar collapsed={collapsed} width="w-48">
      <div className="pt-3">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isSelected={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </div>
    </Sidebar>
  )
}
