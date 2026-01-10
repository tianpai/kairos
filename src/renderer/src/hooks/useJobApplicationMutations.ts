import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteJobApplication, updateJobApplication } from '@/api/jobs'

interface UpdateData {
  companyName: string
  position: string
  dueDate: string
}

export function useJobApplicationMutations(selectedJobId?: string) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: function ({ id, data }: { id: string; data: UpdateData }) {
      return updateJobApplication(id, data)
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      queryClient.invalidateQueries({
        queryKey: ['jobApplication', selectedJobId],
      })
    },
    onError: function () {
      toast.error('Failed to update application')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteJobApplication,
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
    },
    onError: function () {
      toast.error('Failed to delete application')
    },
  })

  function handleUpdate(id: string, data: UpdateData) {
    updateMutation.mutate({ id, data })
  }

  function handleDelete(id: string, onSuccess?: () => void) {
    deleteMutation.mutate(id, { onSuccess })
  }

  return {
    updateMutation,
    deleteMutation,
    handleUpdate,
    handleDelete,
  }
}
