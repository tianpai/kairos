import { DocxPreview } from '@ui/DocxPreview'
import { PdfPreview } from '@ui/PdfPreview'
import { InvertedButton } from '@ui/InvertedButton'

interface FilePreviewProps {
  file: File | null
  onChangeFile: () => void
  onRemoveFile: () => void
}

export function FilePreview({
  file,
  onChangeFile,
  onRemoveFile,
}: FilePreviewProps) {
  if (!file) return null

  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  const isPdf = fileExtension === 'pdf'
  const isDocx = fileExtension === 'docx'
  const hasPreview = isPdf || isDocx

  return (
    <div className="mt-2 flex flex-1 flex-col space-y-2">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
        <div className="truncate">
          <span className="font-bold">{file.name}</span>
        </div>
        <div className="flex flex-row">
          <InvertedButton onClick={onChangeFile}>Change</InvertedButton>
          <InvertedButton onClick={onRemoveFile}>Remove</InvertedButton>
        </div>
      </div>

      <div className="min-h-[24rem] flex-1 overflow-hidden">
        {hasPreview ? (
          <>
            {isPdf && <PdfPreview file={file} />}
            {isDocx && <DocxPreview file={file} />}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Preview not available for this file type
          </div>
        )}
      </div>
    </div>
  )
}
