import { useResumeStore } from '@typst-compiler/resumeState'

interface ResumeRendererProps {
  expanded?: boolean
}

export default function ResumeRender({
  expanded = false,
}: ResumeRendererProps) {
  const svgOutput = useResumeStore((state) => state.svgOutput)

  return (
    <div className="h-full overflow-y-auto py-6 px-2 select-none">
      {svgOutput && (
        <div
          className={`border-default mx-auto overflow-hidden border select-none ${expanded ? 'w-full' : 'max-w-3xl'}`}
        >
          <div
            className="resume-page w-full select-none"
            dangerouslySetInnerHTML={{ __html: svgOutput }}
          />
        </div>
      )}
    </div>
  )
}
