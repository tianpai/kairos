import changelogRaw from '@root/CHANGELOG.md?raw'
import pkg from '@root/package.json'

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
const currentVersionEntry = changelogEntries.find(
  (e) => e.version === pkg.version,
)

export function AboutSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">About</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Kairos - AI-powered resume optimization
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Version {pkg.version}
          </p>
          {currentVersionEntry?.quote && (
            <p className="mt-1 text-sm text-gray-500 italic dark:text-gray-400">
              "{currentVersionEntry.quote}"
            </p>
          )}
        </div>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <GitHubIcon size={14} />
          github.com/tianpai/kairos
        </a>
      </div>

      <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
        <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Changelog
        </h3>
        <div className="max-h-64 space-y-4 overflow-y-auto rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          {changelogEntries.map((entry) => (
            <div key={entry.version} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {entry.version}
                </span>
                {entry.quote && (
                  <span className="text-xs text-gray-400 italic dark:text-gray-500">
                    "{entry.quote}"
                  </span>
                )}
              </div>
              {entry.sections.map((section) => (
                <div key={section.title} className="pl-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {section.title}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {section.items.map((item, i) => (
                      <li
                        key={i}
                        className="text-xs text-gray-500 before:mr-1 before:content-['-'] dark:text-gray-400"
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
