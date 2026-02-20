import { useEffect, useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import changelogRaw from '@root/CHANGELOG.md?raw'
import pkg from '@root/package.json'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@ui/Accordion'
import type { UpdateState } from '../../../../shared/updater'
import { versionQuotes } from '@/data/versionQuotes'

function GitHubIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

const GITHUB_URL = 'https://github.com/tianpai/kairos'

interface ChangelogEntry {
  version: string
  quote?: string
  sections: Array<{ title: string; items: Array<string> }>
}

interface GroupedChangelog {
  minorVersion: string
  quote?: string
  entries: Array<ChangelogEntry>
}

function stripCommitLink(text: string): string {
  // Remove commit links like "([abc123](url))" from end of text
  return text.replace(/\s*\(\[[a-f0-9]+\]\([^)]+\)\)\s*$/, '').trim()
}

function getMinorVersion(version: string): string {
  const [major, minor] = version.split('.')
  return `${major}.${minor}`
}

function parseChangelog(raw: string): Array<ChangelogEntry> {
  const entries: Array<ChangelogEntry> = []
  const lines = raw.split('\n')
  let current: ChangelogEntry | null = null
  let currentSection: { title: string; items: Array<string> } | null = null

  for (const line of lines) {
    // Match both formats:
    // - "## 0.1.1" (manual)
    // - "### [0.1.1](url) (date)" (standard-version)
    const versionMatch = line.match(/^##?#?\s*\[?(\d+\.\d+\.\d+)\]?/)
    if (versionMatch) {
      if (current) entries.push(current)
      current = {
        version: versionMatch[1],
        quote: versionQuotes[versionMatch[1]],
        sections: [],
      }
      currentSection = null
      continue
    }

    if (!current) continue

    // Match section headers, but not version lines
    const sectionMatch = line.match(/^### ([A-Za-z ]+)$/)
    if (sectionMatch) {
      currentSection = { title: sectionMatch[1], items: [] }
      current.sections.push(currentSection)
      continue
    }

    if ((line.startsWith('* ') || line.startsWith('- ')) && currentSection) {
      const itemText = stripCommitLink(line.slice(2))
      currentSection.items.push(itemText)
    }
  }

  if (current) entries.push(current)
  return entries
}

function groupByMinorVersion(
  entries: Array<ChangelogEntry>,
): Array<GroupedChangelog> {
  const groups = new Map<string, GroupedChangelog>()

  for (const entry of entries) {
    const minorVersion = getMinorVersion(entry.version)
    const minorFullVersion = `${minorVersion}.0`

    if (!groups.has(minorVersion)) {
      groups.set(minorVersion, {
        minorVersion,
        quote: versionQuotes[minorFullVersion],
        entries: [],
      })
    }

    groups.get(minorVersion)!.entries.push(entry)
  }

  return Array.from(groups.values())
}

const changelogEntries = parseChangelog(changelogRaw)
const groupedChangelog = groupByMinorVersion(changelogEntries)

export const currentVersionEntry = changelogEntries.find(
  (e) => e.version === pkg.version,
)

export function AboutSection() {
  const { update, version } = useSearch({ from: '/settings' })
  const [updateState, setUpdateState] = useState<UpdateState>({
    status: 'idle',
  })
  const [isPackaged, setIsPackaged] = useState<boolean | null>(null)

  useEffect(() => {
    window.kairos.updater
      .isPackaged()
      .then(setIsPackaged)
      .catch(() => {})
    // Hydrate from current updater state (in case auto-check already ran)
    window.kairos.updater
      .getState()
      .then(setUpdateState)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (update !== 'available') return

    setUpdateState((prev) => {
      if (prev.status === 'downloading' || prev.status === 'downloaded') {
        return prev
      }

      return {
        status: 'available',
        version: version ?? prev.version,
        releaseNotes: prev.releaseNotes,
      }
    })
  }, [update, version])

  const checkForUpdates = async () => {
    setUpdateState({ status: 'checking' })
    try {
      const state = await window.kairos.updater.check()
      setUpdateState(state)
    } catch {
      setUpdateState({ status: 'error', error: 'Failed to check for updates' })
    }
  }

  const handleDownload = async () => {
    try {
      await window.kairos.updater.download()
      // Poll for state updates during download
      const pollInterval = setInterval(async () => {
        const state = await window.kairos.updater.getState()
        setUpdateState(state)
        if (state.status === 'downloaded' || state.status === 'error') {
          clearInterval(pollInterval)
        }
      }, 500)
    } catch {
      setUpdateState({ status: 'error', error: 'Failed to download update' })
    }
  }

  const handleInstall = () => {
    window.kairos.updater.quitAndInstall()
  }

  const openReleasesPage = () => {
    window.kairos.updater.openReleasesPage()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">About</h2>
        <p className="text-hint mt-1 text-sm">
          Kairos - AI-powered resume optimization
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-secondary text-sm font-medium">
            Version {pkg.version}
          </p>
          {currentVersionEntry?.quote && (
            <p className="text-hint mt-1 text-sm italic">
              "{currentVersionEntry.quote}"
            </p>
          )}
        </div>

        {/* Update Section */}
        <div className="space-y-2">
          {isPackaged === false && (
            <p className="text-hint text-sm">
              Development mode — update check disabled
            </p>
          )}

          {isPackaged === true && updateState.status === 'idle' && (
            <button
              onClick={checkForUpdates}
              className="text-link hover:text-link-hover text-sm"
            >
              Check for Updates
            </button>
          )}

          {updateState.status === 'checking' && (
            <p className="text-hint text-sm">Checking for updates...</p>
          )}

          {updateState.status === 'not-available' && (
            <p className="text-success text-sm">
              You're running the latest version
            </p>
          )}

          {updateState.status === 'available' && (
            <div className="space-y-2">
              <p className="text-warning text-sm">
                Version {updateState.version} is available
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="bg-info hover:bg-info/90 rounded px-3 py-1 text-sm text-white"
                >
                  Download Update
                </button>
                <button
                  onClick={openReleasesPage}
                  className="text-secondary hover:text-primary text-sm"
                >
                  View on GitHub
                </button>
              </div>
            </div>
          )}

          {updateState.status === 'downloading' && (
            <div className="space-y-1">
              <p className="text-hint text-sm">
                Downloading... {updateState.progress?.percent.toFixed(0)}%
              </p>
              <div className="bg-hover h-1.5 w-48 overflow-hidden rounded-full">
                <div
                  className="bg-info h-full transition-all"
                  style={{ width: `${updateState.progress?.percent ?? 0}%` }}
                />
              </div>
            </div>
          )}

          {updateState.status === 'downloaded' && (
            <div className="space-y-2">
              <p className="text-success text-sm">Update ready to install</p>
              <button
                onClick={handleInstall}
                className="bg-success hover:bg-success/90 rounded px-3 py-1 text-sm text-white"
              >
                Restart to Install
              </button>
            </div>
          )}

          {updateState.status === 'error' && (
            <div className="space-y-2">
              <p className="text-error text-sm">
                {updateState.error || 'Update check failed'}
              </p>
              <button
                onClick={checkForUpdates}
                className="text-link hover:text-link-hover text-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-secondary hover:text-primary inline-flex items-center gap-2 text-sm"
        >
          <GitHubIcon size={14} />
          github.com/tianpai/kairos
        </a>
      </div>

      <div className="border-default border-t pt-6">
        <h3 className="text-secondary mb-4 text-sm font-semibold">Changelog</h3>
        <Accordion
          defaultValue={getMinorVersion(pkg.version)}
          className="max-h-[calc(100vh-26rem)] overflow-y-auto"
        >
          {groupedChangelog.map((group) => (
            <AccordionItem
              key={group.minorVersion}
              value={group.minorVersion}
              className="border-default border-b last:border-b-0"
            >
              <AccordionTrigger
                value={group.minorVersion}
                className="hover:bg-hover py-3 text-sm"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-primary font-medium">
                    {group.minorVersion}
                  </span>
                  {group.quote && (
                    <span className="text-hint text-xs italic">
                      "{group.quote}"
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent value={group.minorVersion} className="pb-3">
                {group.entries.map((entry) => (
                  <div key={entry.version} className="mt-3 first:mt-0">
                    {/* Patch version header - muted and indented */}
                    <p className="text-hint mb-1 text-xs font-medium">
                      {entry.version}
                    </p>
                    <div className="pl-3">
                      {entry.sections.map((section, idx) => (
                        <div key={`${entry.version}-${idx}`} className="mt-1">
                          <p className="text-secondary text-xs font-medium">
                            {section.title}
                          </p>
                          <ul className="mt-0.5 space-y-0.5">
                            {section.items.map((item, i) => (
                              <li
                                key={i}
                                className="text-hint text-xs before:mr-1.5 before:content-['•']"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
