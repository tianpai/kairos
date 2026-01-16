import { createContext, useContext, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface AccordionContextType {
  openItem: string | null
  toggle: (value: string) => void
}

const AccordionContext = createContext<AccordionContextType | null>(null)

interface AccordionProps {
  children: ReactNode
  defaultValue?: string
  className?: string
}

export function Accordion({
  children,
  defaultValue,
  className,
}: AccordionProps) {
  const [openItem, setOpenItem] = useState<string | null>(defaultValue ?? null)

  const toggle = (value: string) => {
    setOpenItem(openItem === value ? null : value)
  }

  return (
    <AccordionContext.Provider value={{ openItem, toggle }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  children: ReactNode
  value: string
  className?: string
}

export function AccordionItem({
  children,
  value,
  className,
}: AccordionItemProps) {
  return (
    <div className={className} data-value={value}>
      {children}
    </div>
  )
}

interface AccordionTriggerProps {
  children: ReactNode
  value: string
  className?: string
}

export function AccordionTrigger({
  children,
  value,
  className,
}: AccordionTriggerProps) {
  const context = useContext(AccordionContext)
  if (!context)
    throw new Error('AccordionTrigger must be used within Accordion')

  const isOpen = context.openItem === value

  return (
    <button
      type="button"
      onClick={() => context.toggle(value)}
      className={`flex w-full items-center justify-between ${className ?? ''}`}
    >
      {children}
      <ChevronDown
        size={18}
        className={`text-hint transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  )
}

interface AccordionContentProps {
  children: ReactNode
  value: string
  className?: string
}

export function AccordionContent({
  children,
  value,
  className,
}: AccordionContentProps) {
  const context = useContext(AccordionContext)
  if (!context)
    throw new Error('AccordionContent must be used within Accordion')

  const isOpen = context.openItem === value

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div className={className}>{children}</div>
      </div>
    </div>
  )
}
