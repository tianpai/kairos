import { useEffect, useState } from 'react'
import changelogRaw from '@root/CHANGELOG.md?raw'
import pkg from '@root/package.json'

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

interface UpdateState {
  status: UpdateStatus
  version?: string
  error?: string
  progress?: {
    percent: number
  }
}

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

function parseChangelog(raw: string): Array<ChangelogEntry> {
  const entries: Array<ChangelogEntry> = []
  const lines = raw.split('\n')
  let current: ChangelogEntry | null = null
  let currentSection: { title: string; items: Array<string> } | null = null

  for (const line of lines) {
    const versionMatch = line.match(/^## (\d+\.\d+\.\d+)/)
    if (versionMatch) {
      if (current) entries.push(current)
      current = { version: versionMatch[1], sections: [] }
      currentSection = null
      continue
    }

    if (!current) continue

    if (line.startsWith('"') && line.endsWith('"')) {
      current.quote = line.slice(1, -1)
      continue
    }

    const sectionMatch = line.match(/^### (.+)/)
    if (sectionMatch) {
      currentSection = { title: sectionMatch[1], items: [] }
      current.sections.push(currentSection)
      continue
    }

    if ((line.startsWith('* ') || line.startsWith('- ')) && currentSection) {
      currentSection.items.push(line.slice(2))
    }
  }

  if (current) entries.push(current)
  return entries
}

const changelogEntries = parseChangelog(changelogRaw)
export const currentVersionEntry = changelogEntries.find(
  (e) => e.version === pkg.version,
)

export function AboutSection() {
  const [updateState, setUpdateState] = useState<UpdateState>({ status: 'idle' })
  const [isPackaged, setIsPackaged] = useState<boolean | null>(null)

  useEffect(() => {
    window.electron.updater.isPackaged().then(setIsPackaged)
  }, [])

  const checkForUpdates = async () => {
    setUpdateState({ status: 'checking' })
    try {
      const state = (await window.electron.updater.check()) as UpdateState
      setUpdateState(state)
    } catch {
      setUpdateState({ status: 'error', error: 'Failed to check for updates' })
    }
  }

  const handleDownload = async () => {
    try {
      await window.electron.updater.download()
      // Poll for state updates during download
      const pollInterval = setInterval(async () => {
        const state = (await window.electron.updater.getState()) as UpdateState
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
    window.electron.updater.quitAndInstall()
  }

  const openReleasesPage = () => {
    window.electron.updater.openReleasesPage()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">About</h2>
        <p className="mt-1 text-sm text-hint">
          Kairos - AI-powered resume optimization
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-secondary">
            Version {pkg.version}
          </p>
          {currentVersionEntry?.quote && (
            <p className="mt-1 text-sm text-hint italic">
              "{currentVersionEntry.quote}"
            </p>
          )}
        </div>

        {/* Update Section */}
        <div className="space-y-2">
          {isPackaged === false && (
            <p className="text-sm text-hint">
              Development mode — update check disabled
            </p>
          )}

          {isPackaged === true && updateState.status === 'idle' && (
            <button
              onClick={checkForUpdates}
              className="text-sm text-link hover:text-link-hover"
            >
              Check for Updates
            </button>
          )}

          {updateState.status === 'checking' && (
            <p className="text-sm text-hint">
              Checking for updates...
            </p>
          )}

          {updateState.status === 'not-available' && (
            <p className="text-sm text-success">
              You're running the latest version
            </p>
          )}

          {updateState.status === 'available' && (
            <div className="space-y-2">
              <p className="text-sm text-warning">
                Version {updateState.version} is available
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="rounded bg-info px-3 py-1 text-sm text-white hover:bg-info/90"
                >
                  Download Update
                </button>
                <button
                  onClick={openReleasesPage}
                  className="text-sm text-secondary hover:text-primary"
                >
                  View on GitHub
                </button>
              </div>
            </div>
          )}

          {updateState.status === 'downloading' && (
            <div className="space-y-1">
              <p className="text-sm text-hint">
                Downloading... {updateState.progress?.percent.toFixed(0)}%
              </p>
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-hover">
                <div
                  className="h-full bg-info transition-all"
                  style={{ width: `${updateState.progress?.percent ?? 0}%` }}
                />
              </div>
            </div>
          )}

          {updateState.status === 'downloaded' && (
            <div className="space-y-2">
              <p className="text-sm text-success">
                Update ready to install
              </p>
              <button
                onClick={handleInstall}
                className="rounded bg-success px-3 py-1 text-sm text-white hover:bg-success/90"
              >
                Restart to Install
              </button>
            </div>
          )}

          {updateState.status === 'error' && (
            <div className="space-y-2">
              <p className="text-sm text-error">
                {updateState.error || 'Update check failed'}
              </p>
              <button
                onClick={checkForUpdates}
                className="text-sm text-link hover:text-link-hover"
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
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary"
        >
          <GitHubIcon size={14} />
          github.com/tianpai/kairos
        </a>
      </div>

      <div className="border-t border-default pt-6">
        <h3 className="mb-4 text-sm font-semibold text-secondary">
          Changelog
        </h3>
        <div className="max-h-64 space-y-4 overflow-y-auto rounded-lg border border-default p-4">
          {changelogEntries.map((entry) => (
            <div key={entry.version} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-primary">
                  {entry.version}
                </span>
                {entry.quote && (
                  <span className="text-xs text-hint italic">
                    "{entry.quote}"
                  </span>
                )}
              </div>
              {entry.sections.map((section, idx) => (
                <div key={`${entry.version}-${idx}`} className="pl-2">
                  <p className="text-xs font-medium text-secondary">
                    {section.title}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {section.items.map((item, i) => (
                      <li
                        key={i}
                        className="text-xs text-hint before:mr-1 before:content-['-']"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
