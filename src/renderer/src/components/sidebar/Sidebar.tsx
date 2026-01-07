import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import JobInfoModal from '@sidebar/JobInfoModal'
import { CollapsibleSidebar } from './CollapsibleSidebar'
import { SidebarItem } from './SidebarItem'

interface Application {
  id: string
  companyName: string
  position: string
  dueDate: string
  matchPercentage: number
  jobUrl: string | null
  originalResume: string | null
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
    <button
      onClick={() => navigate({ to: '/settings' })}
      className="flex w-full cursor-pointer items-center gap-2 px-3 py-3 text-sm text-secondary transition-colors hover:bg-hover"
    >
      <Settings size={16} />
      <span>Settings</span>
    </button>
  )

  return (
    <>
      <CollapsibleSidebar collapsed={collapsed} footer={settingsFooter}>
        <div className="pt-3">
          {applications.map((app) => (
            <SidebarItem
              key={app.id}
              id={app.id}
              companyName={app.companyName}
              position={app.position}
              dueDate={app.dueDate}
              matchPercentage={app.matchPercentage}
              isBuiltFromScratch={!app.originalResume}
              isSelected={app.id === selectedId}
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
