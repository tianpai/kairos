import { Cpu, Info, Lightbulb, Palette, Settings } from 'lucide-react'
import { CollapsibleSidebar } from '@sidebar/CollapsibleSidebar'
import { GenericSidebarItem } from '@sidebar/GenericSidebarItem'
import type { LucideIcon } from 'lucide-react'

export type SettingsSection = 'providers' | 'appearance' | 'tips' | 'general' | 'about'

interface NavItem {
  id: SettingsSection
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: Array<NavItem> = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'providers', label: 'Providers', icon: Cpu },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'tips', label: 'Tips', icon: Lightbulb },
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
    <CollapsibleSidebar collapsed={collapsed} width="w-48">
      <div className="pt-3">
        {NAV_ITEMS.map((item) => (
          <GenericSidebarItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isSelected={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </div>
    </CollapsibleSidebar>
  )
}
