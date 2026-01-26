import { useQuery } from '@tanstack/react-query'
import { Select } from '@ui/Select'
import { getAllJobApplications } from '@/api/jobs'

interface ExistingApplicationSelectProps {
  value: string | null
  onChange: (jobId: string | null) => void
}

export function ExistingApplicationSelect({
  value,
  onChange,
}: ExistingApplicationSelectProps) {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: getAllJobApplications,
  })

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    onChange(selectedId || null)
  }

  return (
    <div className="flex flex-col">
      <Select value={value ?? ''} onChange={handleChange} disabled={isLoading}>
        <option value="">Select an application...</option>
        {applications.map((app) => (
          <option key={app.id} value={app.id}>
            {app.companyName} - {app.position}
          </option>
        ))}
      </Select>
      {applications.length === 0 && !isLoading && (
        <p className="text-hint text-xs">
          No applications found. Create one first.
        </p>
      )}
    </div>
  )
}
