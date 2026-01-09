import { useActiveProvider, useSelectedModel } from '@hooks/useSettings'
import { HoverPopup } from '@ui/HoverPopup'
import { versionQuotes } from '@/data/versionQuotes'
import pkg from '@root/package.json'

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <span className="text-hint">{label}</span>
      <span className="text-secondary">{value}</span>
    </div>
  )
}

interface SettingsHoverPopupProps {
  applicationCount: number
}

export function SettingsHoverPopup({
  applicationCount,
}: SettingsHoverPopupProps) {
  const { data: activeProvider } = useActiveProvider()
  // Only fetch model if provider exists, otherwise skip with placeholder
  const { data: selectedModel } = useSelectedModel(activeProvider || 'openai')

  const providerDisplay = activeProvider
    ? activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)
    : 'None'
  const modelDisplay = activeProvider ? (selectedModel ?? 'None') : 'None'

  return (
    <HoverPopup position="top">
      <div className="space-y-1 text-sm">
        <InfoRow label="Provider" value={providerDisplay} />
        <InfoRow label="Model" value={modelDisplay} />
        <InfoRow label="Applications" value={applicationCount} />
        <InfoRow label="Version" value={pkg.version} />
        {versionQuotes[pkg.version] && (
          <div className="text-hint pt-1 text-xs italic">
            "{versionQuotes[pkg.version]}"
          </div>
        )}
      </div>
    </HoverPopup>
  )
}
