import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowBigLeft } from 'lucide-react'
import SplitText from '@ui/AnimatedText'
import Particles from '@ui/Particles'
import { InvertedButton } from '@ui/InvertedButton'

interface ResumeParsingLoaderProps {
  isParsingResume: boolean
  isParsingChecklist: boolean
}

const GENERAL_MESSAGES = [
  'parsing keywords',
  'analyzing experience',
  'extracting skills',
  'reading documents',
  'understanding context',
  'processing text',
  'matching requirements',
  'evaluating qualifications',
  'scanning details',
  'interpreting data',
]

const RESUME_MESSAGES = [
  'extracting work history',
  'analyzing experience',
  'parsing education',
  'identifying skills',
  'reading accomplishments',
  'structuring resume data',
  'processing qualifications',
  'mapping career timeline',
]

const CHECKLIST_MESSAGES = [
  'analyzing job requirements',
  'extracting key criteria',
  'parsing responsibilities',
  'identifying must-haves',
  'understanding expectations',
  'processing requirements',
  'evaluating job description',
  'mapping qualifications',
]

export default function ResumeParsingLoader({
  isParsingResume,
  isParsingChecklist,
}: ResumeParsingLoaderProps) {
  const navigate = useNavigate()
  const isLoading = isParsingResume || isParsingChecklist
  // const isLoading = true // for debug
  const [messageIndex, setMessageIndex] = useState(0)

  // Reset message index when loading starts fresh
  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0)
    }
  }, [isLoading])

  // Determine which message list to use
  const getCurrentMessages = () => {
    if (isParsingResume && isParsingChecklist) {
      return GENERAL_MESSAGES
    } else if (isParsingResume && !isParsingChecklist) {
      return RESUME_MESSAGES
    } else if (!isParsingResume && isParsingChecklist) {
      return CHECKLIST_MESSAGES
    }
    return GENERAL_MESSAGES
  }

  // Reset message index when switching between message lists
  useEffect(() => {
    setMessageIndex(0)
  }, [isParsingResume, isParsingChecklist])

  // Cycle through messages while any task is still loading
  useEffect(() => {
    if (!isLoading) {
      return
    }

    const currentMessages = getCurrentMessages()
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % currentMessages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [isLoading, isParsingResume, isParsingChecklist])

  if (!isLoading) return null

  const currentMessages = getCurrentMessages()
  const loadingText = currentMessages[messageIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
      <div className="relative h-[400px] w-[600px] overflow-hidden bg-black">
        <div className="absolute inset-0">
          <Particles alphaParticles={true} />
        </div>
        <div className="absolute top-4 left-4 z-20">
          <InvertedButton
            onClick={() => navigate({ to: '/', search: { jobId: undefined } })}
            ariaLabel="Back to home"
            title="Back to home"
          >
            <ArrowBigLeft size={16} />
          </InvertedButton>
        </div>
        <div className="absolute inset-0 z-10 flex items-center justify-center px-8">
          <SplitText
            key={loadingText}
            text={loadingText}
            className="text-2xl font-medium text-white"
            delay={50}
            duration={1}
            ease="elastic.out(1,0.3)"
            splitType="words"
            from={{ opacity: 0, y: 20 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0}
            rootMargin="0px"
            textAlign="center"
          />
        </div>
      </div>
    </div>
  )
}
