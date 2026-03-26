import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PatchJobApplicationPayload } from '@/api/jobs'
import { deleteJobApplication, patchJobApplication } from '@/api/jobs'

type UpdateData = Pick<
  PatchJobApplicationPayload,
  'companyName' | 'position' | 'dueDate' | 'jobUrl'
>

function invalidateJobDetails(
  queryClient: ReturnType<typeof useQueryClient>,
  jobId: string | undefined,
) {
  if (!jobId) return

  queryClient.invalidateQueries({
    queryKey: ['jobSummary', jobId],
  })
  queryClient.invalidateQueries({
    queryKey: ['jobResume', jobId],
  })
}

export function useJobApplicationMutations(selectedJobId?: string) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: function ({ id, data }: { id: string; data: UpdateData }) {
      return patchJobApplication(id, data)
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      invalidateJobDetails(queryClient, selectedJobId)
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
