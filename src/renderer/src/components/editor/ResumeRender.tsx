import { useResumeStore } from '@typst-compiler/resumeState'

interface ResumeRendererProps {
  expanded?: boolean
}

export default function ResumeRender({
  expanded = false,
}: ResumeRendererProps) {
  const svgOutput = useResumeStore((state) => state.svgOutput)

  return (
    <div className="h-full overflow-y-auto p-6 select-none">
      {svgOutput && (
        <div
          className={`mx-auto overflow-hidden border border-default select-none ${expanded ? 'w-full' : 'max-w-3xl'}`}
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
