# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.0.4 (2026-01-07)


### Features

* add Anthropic API provider support ([d27113b](https://github.com/tianpai/kairos/commit/d27113b1d415f0bce0ce218079c7d52ee36c888a))
* add batch PDF export with folder selection ([bce5daa](https://github.com/tianpai/kairos/commit/bce5daaab906f9b5e2e77141b18a6106c680da1a))
* add changelog system and refactor settings page ([8c61419](https://github.com/tianpai/kairos/commit/8c61419bdb707a67e51540efd0a1b2bbc1fabb6f))
* add Claude CLI support with auto-detection ([6e5af73](https://github.com/tianpai/kairos/commit/6e5af73be0c05ea80265a746b18102a87add2272))
* add clear button to text-array fields ([1b223ae](https://github.com/tianpai/kairos/commit/1b223aea793b7168428ef8ddfa6ea6c52f9321f4))
* add create application from existing resume ([38a7682](https://github.com/tianpai/kairos/commit/38a7682efc6df62f27ed5b27b243025eab931dde))
* add DeepSeek provider support ([e088a0a](https://github.com/tianpai/kairos/commit/e088a0a8c09f564137d5b8935a7499bb3c013fb8))
* add drag-and-drop reordering to section entries ([75bd559](https://github.com/tianpai/kairos/commit/75bd559f12648c4e07fac4d8aa0c141c69f997fa))
* add drag-and-drop reordering to text-array fields ([6151c9e](https://github.com/tianpai/kairos/commit/6151c9e42125dca2c339347d6dbb9fcaf1a542a9))
* add Gemini provider ([9b2e53e](https://github.com/tianpai/kairos/commit/9b2e53edf581755e7623a974ec67406a427ef61f))
* add HoldButton component and replace ConfirmModal ([343d075](https://github.com/tianpai/kairos/commit/343d0758232693c301608d431423950cce18d8d9))
* add job URL field with browser open support ([7191775](https://github.com/tianpai/kairos/commit/719177562eee3f0feedf7fef71ed767dcbde9b71))
* add keyboard shortcuts for header buttons and restructure menu bar ([e8b28dd](https://github.com/tianpai/kairos/commit/e8b28dd0006c0b42ca6a5446cf3455339838fe44))
* add keyboard shortcuts for settings, new application, and build ([7572d52](https://github.com/tianpai/kairos/commit/7572d522e76a81ac39c62987ec7aa60823a358bc))
* add Ollama local model support ([bd101d0](https://github.com/tianpai/kairos/commit/bd101d03e561ce188cc3f145a98988433a023e72))
* add resume builder for creating from scratch ([6a40f61](https://github.com/tianpai/kairos/commit/6a40f61d18f85c8cd39bd10be6ad1147b93938d9))
* add tips management section to settings page ([53e8c1b](https://github.com/tianpai/kairos/commit/53e8c1b2dd7cd34b8bba6435d4a6bca882a5332f))
* add tips system and fix workflow data persistence ([49c6a74](https://github.com/tianpai/kairos/commit/49c6a7466f2d6de5d14ed89f221d3448d9d60004))
* add version name to about pages ([3c22ab5](https://github.com/tianpai/kairos/commit/3c22ab54b53e337240257168ac8cf6ae24a56565))
* add xAI Grok provider support ([581d2e5](https://github.com/tianpai/kairos/commit/581d2e588afd3e5679d500b469ed5b45577c90ab))
* extract company, position, due date from JD by AI ([6942a1c](https://github.com/tianpai/kairos/commit/6942a1c2c37e5ce11e8106f4c571ec308d07980f))
* inline keyword highlighting in checklist requirements ([68901a0](https://github.com/tianpai/kairos/commit/68901a0816b38c859a71525036134092d0e0cd6a))
* merge page/section controls into single header button ([77ab7f4](https://github.com/tianpai/kairos/commit/77ab7f477ef568b3c22037b9885dc018c48a4c31))
* unified new application modal with popup variant ([83c5ee7](https://github.com/tianpai/kairos/commit/83c5ee71bfed19b563d8463ab3891137d6d1a2c4))
* update app icon and add GitHub repo link ([cddd72b](https://github.com/tianpai/kairos/commit/cddd72b9880529d88e26c6dd75eb98fc7e0a5ec3))


### Bug Fixes

* add missing key prop to SortableZone list items ([70bde35](https://github.com/tianpai/kairos/commit/70bde355ab900e1380425b90d6130541b77245fd))
* add null checks to workflow store selectors ([32b0e3e](https://github.com/tianpai/kairos/commit/32b0e3ec254a81c2ebf54e77a61a69c3b0fd11b3))
* batch PDF export applies schema defaults for missing fields ([86a2f3f](https://github.com/tianpai/kairos/commit/86a2f3f8453fd78a455225fe46958aa52a003369))
* errors in ResumeParsingLoader and SidebarItem ([bef20b3](https://github.com/tianpai/kairos/commit/bef20b38c5a02679bc9d2736d213e17a10824f50))
* eslint config not found ([1a35a95](https://github.com/tianpai/kairos/commit/1a35a952c53d091e8a7a9e188cf1734f4c90a6c7))
* lint config and shadowed variable ([3237dcc](https://github.com/tianpai/kairos/commit/3237dcc0e5bd728e0a2309c7a1185cffae1b073f))
* multi-workflow state tracking for async parsing ([ab91b75](https://github.com/tianpai/kairos/commit/ab91b75893cb49ecf6343ccbf9553b1c7cfd7249))
* remove duplicate provider name from settings panel ([253e388](https://github.com/tianpai/kairos/commit/253e388be24a005d02c0246a03f28671c8ed0453))
* sidebar navigation getting stuck on latest job ([c8a163b](https://github.com/tianpai/kairos/commit/c8a163b8e9bcc8fcf866c5951fa4f6bb8b606de0))
* sidebar score not updating in realtime ([b6b7577](https://github.com/tianpai/kairos/commit/b6b75778a14cd15226f7c779661572523bc29c58))
* update to latest models for claude ([b06a146](https://github.com/tianpai/kairos/commit/b06a1461945e3f52954bf43e4454f3b19782b889))
* worker crash due to window not defined ([f3e0ce4](https://github.com/tianpai/kairos/commit/f3e0ce46c9f0ab2a32535e58859022e38565976e))

## 0.0.4 (Unreleased)

"You shall be the Fellowship of the Ring"

### Features

- Add Anthropic API provider support
- Add Google Gemini provider support
- Add xAI Grok provider support
- Add DeepSeek provider support
- Add Ollama local model support
- Support Claude Code subscription login with auto-detection

### Bug Fixes

- Update to latest Claude models
- Remove duplicate provider name from settings panel

## 0.0.3 (2024-12-31)

"I need you to hurry up now, 'Cause I can't wait much longer"

### Features

- Start a new application from an existing resume instead of uploading again
- Create multiple applications at once by selecting multiple job descriptions
- Export all your resumes as PDFs in one click with batch download
- Company, position, and due date auto-fill from job description
- Use markdown or text files as job descriptions
- Keyboard shortcuts for all header buttons
- Save job posting URL and open it directly in your browser

### Bug Fixes

- PDF exports now include proper defaults for missing fields
- Drag-and-drop lists no longer flicker during reordering

## 0.0.2 (2024-12-22)

"Damn! It even uses like a desktop app"

### Features

- Remove individual fields without deleting subsection
- Reorder items within sections
- Fix async parsing (resume.parsing, checklist.parsing)
- Update modal to have full screen modal and popup like modal
- Unify builder and new btn into one with a toggle btn to select
- Better parsing system for pdfs (replaced pdfjs-dist with unpdf, removed previews)
- Tips system (app usage hints + job decision guidance)
- Keyboard shortcuts for build new resume, setting page
- Style document configuration drag-drop item to match dynamic field inputs

## 0.0.1 (2024-12-17)

"Damn! It looks like a Desktop app"

### Features

- Resume builder without AI (start from scratch, not just upload)
- Merge page/section controls into header button
- Update checklist badge styling (rounded corners, better colors)
- Display version name in settings About page and menu bar About panel
