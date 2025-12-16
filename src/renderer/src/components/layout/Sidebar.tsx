import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import EditJobModal from '@dashboard/EditJobModal'
import { SidebarItem } from './SidebarItem'
import UploadButton from '@/components/upload/UploadButton'

interface Application {
  id: string
  companyName: string
  position: string
  dueDate: string
  matchPercentage: number
}

interface SidebarProps {
  applications: Array<Application>
  selectedId: string | undefined
  onSelect: (id: string) => void
  collapsed: boolean
  onUploadSuccess: (jobId: string) => void
  onEdit: (
    id: string,
    data: { companyName: string; position: string; dueDate: string },
  ) => void
  onDelete: (id: string) => void
}

export function Sidebar({
  applications,
  selectedId,
  onSelect,
  collapsed,
  onUploadSuccess,
  onEdit,
  onDelete,
}: SidebarProps) {
  const navigate = useNavigate()
  const [editingApp, setEditingApp] = useState<Application | null>(null)

  const handleSaveEdit = (data: {
    companyName: string
    position: string
    dueDate: string
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

  return (
    <>
      <aside
        className={`flex h-full flex-col border-r border-gray-200 bg-[#fafafa] transition-all duration-200 ease-in-out dark:border-gray-700 dark:bg-[#2a2a2a] ${
          collapsed ? 'w-0 overflow-hidden border-r-0' : 'w-60'
        }`}
      >
        {/* Inner container to prevent content reflow during animation */}
        <div className="flex h-full w-60 flex-col">
          {/* Upload Button */}
          <div className="p-3">
            <UploadButton onSuccess={onUploadSuccess} />
          </div>

          {/* Applications List */}
          <div className="flex-1 overflow-y-auto">
            {applications.map((app) => (
              <SidebarItem
                key={app.id}
                id={app.id}
                companyName={app.companyName}
                position={app.position}
                dueDate={app.dueDate}
                matchPercentage={app.matchPercentage}
                isSelected={app.id === selectedId}
                onClick={() => onSelect(app.id)}
                onEdit={() => setEditingApp(app)}
              />
            ))}
          </div>

          {/* Settings at bottom */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigate({ to: '/settings' })}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Edit Modal */}
      {editingApp && (
        <EditJobModal
          open={true}
          onClose={() => setEditingApp(null)}
          onSave={handleSaveEdit}
          onDelete={handleDeleteFromModal}
          initialData={{
            companyName: editingApp.companyName,
            position: editingApp.position,
            dueDate: editingApp.dueDate,
          }}
        />
      )}
    </>
  )
}
