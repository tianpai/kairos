import { useResumeStore } from '@typst-compiler/resumeState'
import { DiscreteSlider } from '@ui/DiscreteSlider'
import { TemplateId } from '@templates/templateId'
import { DocumentSetupSchema } from '@templates/shared/document-config'
import { Modal } from '@ui/Modal'
import { InvertedButton } from '@ui/InvertedButton'
import { ColorPickerField } from './ColorPickerField'
import { SectionManagerContent } from './SectionManager'
import type { DocumentSetup } from '@templates/shared/document-config'

interface DocumentConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

// Extract enum values from Zod schema (unwrapping .default())
const FONT_OPTIONS = DocumentSetupSchema.shape.font.unwrap().options
const FONT_SIZE_OPTIONS = DocumentSetupSchema.shape.fontSize.unwrap().options
const MARGIN_OPTIONS = DocumentSetupSchema.shape.margin.unwrap().options
const PAPER_SIZE_OPTIONS = DocumentSetupSchema.shape.paperSize.unwrap().options

// Parse margin values for slider
const MARGIN_VALUES = MARGIN_OPTIONS.map((m) => parseFloat(m))
// Parse font size values for slider
const FONT_SIZE_VALUES = FONT_SIZE_OPTIONS.map((fs) => parseFloat(fs))

export function DocumentConfigModal({
  isOpen,
  onClose,
}: DocumentConfigModalProps) {
  const { templateId, updateGlobalConfig } = useResumeStore()

  if (!isOpen) return null

  // Parse current config
  const config = TemplateId.parse(templateId)
  const globalConfig = config.globalConfig

  const handleChange = (key: keyof DocumentSetup, value: string) => {
    updateGlobalConfig(key, value)
  }

  const currentMarginValue = parseFloat(globalConfig.margin)
  const handleMarginChange = (value: number) => {
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1)
    updateGlobalConfig('margin', `${formatted}in`)
  }

  const currentFontSizeValue = parseFloat(globalConfig.fontSize)
  const handleFontSizeChange = (value: number) => {
    updateGlobalConfig('fontSize', `${value}pt`)
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      maxWidth="xl"
      actions={<InvertedButton onClick={onClose}>Done</InvertedButton>}
    >
      <div className="mb-6">
        <h2 className="text-xl dark:text-gray-200">Document Settings</h2>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left: Section Manager */}
        <SectionManagerContent />

        {/* Right: Document Config */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-medium dark:text-gray-200">Layout</h3>
          </div>

          <div className="space-y-4">
            {/* Font Selection */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">Font</label>
              <select
                value={globalConfig.font}
                onChange={(e) => handleChange('font', e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size Selection */}
            <DiscreteSlider
              values={FONT_SIZE_VALUES}
              value={currentFontSizeValue}
              onChange={handleFontSizeChange}
              label="Font Size"
              unit="pt"
            />

            {/* Heading Color */}
            <ColorPickerField
              label="Heading Color"
              value={globalConfig.headingColor}
              onChange={(value) => handleChange('headingColor', value)}
            />

            {/* Margin Selection */}
            <DiscreteSlider
              values={MARGIN_VALUES}
              value={currentMarginValue}
              onChange={handleMarginChange}
              label="Page Margin"
              unit="inch"
            />

            {/* Paper Size Selection */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">Paper Size</label>
              <select
                value={globalConfig.paperSize}
                onChange={(e) => handleChange('paperSize', e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                {PAPER_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
