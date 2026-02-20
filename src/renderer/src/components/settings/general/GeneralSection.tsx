import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSetTheme, useTheme } from '@hooks/useTheme'
import { BackupSection } from './BackupSection'
import { DangerZoneSection } from './DangerZoneSection'
import { ImportBackupOverlay } from './ImportBackupOverlay'
import { ThemeSection } from './ThemeSection'
import type { ThemeSource } from './ThemeSection'

export function GeneralSection() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentTheme } = useTheme()
  const setTheme = useSetTheme()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isExportingBackup, setIsExportingBackup] = useState(false)
  const [isImportingBackup, setIsImportingBackup] = useState(false)

  const handleImportBackup = async () => {
    const confirmed = window.confirm(
      'Import backup will replace current applications and resumes. Continue?',
    )

    if (!confirmed) return

    setIsImportingBackup(true)

    try {
      const result = await window.kairos.backup.importResumeData()

      if (result.canceled) {
        return
      }

      if (!result.success) {
        toast.error(result.error || 'Failed to import backup')
        return
      }

      await queryClient.invalidateQueries()
      localStorage.removeItem('last-viewed-application')

      toast.success('Backup imported')
    } catch (error) {
      console.error('Failed to import backup:', error)
      toast.error('Failed to import backup')
    } finally {
      setIsImportingBackup(false)
    }
  }

  const handleExportBackup = async () => {
    setIsExportingBackup(true)

    try {
      const result = await window.kairos.backup.exportResumeData()

      if (result.canceled) {
        return
      }

      if (!result.success) {
        toast.error(result.error || 'Failed to export backup')
        return
      }

      toast.success('Backup exported')
    } catch (error) {
      console.error('Failed to export backup:', error)
      toast.error('Failed to export backup')
    } finally {
      setIsExportingBackup(false)
    }
  }

  const handleDeleteAllData = async () => {
    setIsDeleting(true)
    try {
      await window.kairos.jobs.deleteAll()

      localStorage.removeItem('resume-storage')
      localStorage.removeItem('last-viewed-application')

      await queryClient.invalidateQueries({ queryKey: ['jobs'] })

      toast.success('All data deleted')
      navigate({ to: '/' })
    } catch (error) {
      console.error('Failed to delete all data:', error)
      toast.error('Failed to delete data')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleResetProviders = async () => {
    setIsResetting(true)
    try {
      await window.kairos.settings.resetAllProviders()
      await queryClient.invalidateQueries()

      toast.success('Provider settings reset')
    } catch (error) {
      console.error('Failed to reset provider settings:', error)
      toast.error('Failed to reset provider settings')
    } finally {
      setIsResetting(false)
    }
  }

  const handleThemeChange = (theme: ThemeSource) => {
    setTheme.mutate(theme)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-hint mt-1 text-sm">
          Manage app preferences and data.
        </p>
      </div>

      <div className="space-y-6">
        <ThemeSection
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
        />
        <BackupSection
          isExportingBackup={isExportingBackup}
          isImportingBackup={isImportingBackup}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
        />
      </div>

      <DangerZoneSection
        isDeleting={isDeleting}
        isResetting={isResetting}
        isExportingBackup={isExportingBackup}
        isImportingBackup={isImportingBackup}
        onDeleteAllData={handleDeleteAllData}
        onResetProviders={handleResetProviders}
      />

      <ImportBackupOverlay
        isImportingBackup={isImportingBackup}
      />
    </div>
  )
}
