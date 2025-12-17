import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { deleteJobApplication, updateJobApplication } from '@/api/jobs'

interface UpdateData {
  companyName: string
  position: string
  dueDate: string
}

export function useJobApplicationMutations(selectedJobId?: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateData }) =>
      updateJobApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      queryClient.invalidateQueries({
        queryKey: ['jobApplication', selectedJobId],
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteJobApplication,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      if (deletedId === selectedJobId) {
        navigate({ to: '/', search: { jobId: undefined } })
      }
    },
  })

  const handleUpdate = (id: string, data: UpdateData) => {
    updateMutation.mutate({ id, data })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  return {
    updateMutation,
    deleteMutation,
    handleUpdate,
    handleDelete,
  }
}
