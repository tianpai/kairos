import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import JobInfoModal from '@sidebar/JobInfoModal'
import { CollapsibleSidebar } from './CollapsibleSidebar'
import { SidebarItem } from './SidebarItem'
import { SettingsHoverPopup } from './SettingsHoverPopup'

interface Application {
  id: string
  companyName: string
  position: string
  dueDate: string
  matchPercentage: number
  jobUrl: string | null
  createdAt: string
  updatedAt: string
}

interface SidebarProps {
  applications: Array<Application>
  selectedId: string | undefined
  onSelect: (id: string) => void
  collapsed: boolean
  onEdit: (
    id: string,
    data: {
      companyName: string
      position: string
      dueDate: string
      jobUrl: string | null
    },
  ) => void
  onDelete: (id: string) => void
}

export function Sidebar({
  applications,
  selectedId,
  onSelect,
  collapsed,
  onEdit,
  onDelete,
}: SidebarProps) {
  const navigate = useNavigate()
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [isSettingsHovered, setIsSettingsHovered] = useState(false)

  const handleSaveEdit = (data: {
    companyName: string
    position: string
    dueDate: string
    jobUrl: string | null
  }) => {
    if (editingApp) {
      onEdit(editingApp.id, data)
      setEditingApp(null)
    }
  }

  const handleDeleteFromModal = () => {
    if (editingApp) {
      onDelete(editingApp.id)
      setEditingApp(null)
    }
  }

  const settingsFooter = (
    <div
      className="relative"
      onMouseEnter={() => setIsSettingsHovered(true)}
      onMouseLeave={() => setIsSettingsHovered(false)}
    >
      {isSettingsHovered && (
        <SettingsHoverPopup applicationCount={applications.length} />
      )}
      <button
        onClick={() => navigate({ to: '/settings' })}
        className="text-secondary hover:bg-hover flex w-full cursor-pointer items-center gap-2 px-3 py-3 text-sm transition-colors"
      >
        <Settings size={16} />
        <span>Settings</span>
      </button>
    </div>
  )

  return (
    <>
      <CollapsibleSidebar collapsed={collapsed} footer={settingsFooter}>
        <div>
          {applications.map((app) => (
            <SidebarItem
              key={app.id}
              companyName={app.companyName}
              position={app.position}
              dueDate={app.dueDate}
              matchPercentage={app.matchPercentage}
              isSelected={app.id === selectedId}
              createdAt={app.createdAt}
              updatedAt={app.updatedAt}
              onClick={() => onSelect(app.id)}
              onEdit={() => setEditingApp(app)}
            />
          ))}
        </div>
      </CollapsibleSidebar>

      {/* Job Info Modal */}
      {editingApp && (
        <JobInfoModal
          open={true}
          onClose={() => setEditingApp(null)}
          onSave={handleSaveEdit}
          onDelete={handleDeleteFromModal}
          initialData={{
            companyName: editingApp.companyName,
            position: editingApp.position,
            dueDate: editingApp.dueDate,
            jobUrl: editingApp.jobUrl,
          }}
        />
      )}
    </>
  )
}
