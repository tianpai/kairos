import { useActiveProvider, useSelectedModel } from '@hooks/useSettings'
import { HoverPopup } from '@ui/HoverPopup'
import { InfoRow } from '@ui/InfoRow'
import pkg from '@root/package.json'
import { versionQuotes } from '@/data/versionQuotes'

interface SettingsHoverPopupProps {
  applicationCount: number
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function SettingsHoverPopup({
  applicationCount,
}: SettingsHoverPopupProps): JSX.Element {
  const { data: activeProvider } = useActiveProvider()
  const { data: selectedModel } = useSelectedModel(activeProvider || 'openai')

  const providerDisplay = activeProvider ? capitalize(activeProvider) : 'None'
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
