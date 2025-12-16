import { memo, useState } from 'react'
import { useResumeStore } from '@typst-compiler/resumeState'
import { compileToPDF } from '@typst-compiler/compile'
import { FileDown } from 'lucide-react'
import { InvertedButton } from '@ui/InvertedButton'
import type { TemplateData } from '@templates/template.types'
import { TemplateBuilder } from '@/templates/builder'

interface DownloadResumeButtonProps {
  companyName?: string
  position?: string
}

function sanitizeForFilename(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

function generateResumeFilename(
  data: TemplateData,
  companyName?: string,
  position?: string,
): string {
  const personalInfo = data.personalInfo as { name?: string } | undefined
  const name = personalInfo?.name?.trim() || 'resume'

  const sanitizedName = sanitizeForFilename(name)

  if (companyName && position) {
    const sanitizedCompany = sanitizeForFilename(companyName)
    const sanitizedPosition = sanitizeForFilename(position)
    return `${sanitizedName}_${sanitizedCompany}_${sanitizedPosition}.pdf`
  }

  return `${sanitizedName}_resume.pdf`
}

const DownloadResumeButton = memo(function DownloadResumeButton({
  companyName,
  position,
}: DownloadResumeButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const templateId = useResumeStore((state) => state.templateId)
  const data = useResumeStore((state) => state.data)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Generate Typst code from current data
      const builder = new TemplateBuilder(templateId)
      const typstCode = builder.build(data)

      // Compile to PDF
      const pdfBinary = await compileToPDF(typstCode)

      // Create blob and download
      const pdfArray = pdfBinary.slice()
      const pdfBlob = new Blob([pdfArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(pdfBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = generateResumeFilename(data, companyName, position)
      link.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download PDF', error)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <InvertedButton
      onClick={handleDownload}
      loading={isDownloading}
      ariaLabel="Download resume as PDF"
      title="Download"
    >
      <FileDown size={16} />
    </InvertedButton>
  )
})

export default DownloadResumeButton
