import { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import reportWebVitals from './reportWebVitals.ts'
import App from '@/components/layout/App'
import SettingsPage from '@/components/settings/SettingsPage'
import * as TanStackQueryProvider from '@/integrations/tanstack-query/root-provider.tsx'
import { useShortcutListener } from '@/hooks/useShortcutListener'

import './styles.css'

// Track when splash was shown
const splashStartTime = Date.now()
const MINIMUM_SPLASH_TIME = 2000 // 2 seconds

// Hide splash screen with minimum display time
function hideSplash() {
  const elapsed = Date.now() - splashStartTime
  const remainingTime = Math.max(0, MINIMUM_SPLASH_TIME - elapsed)

  setTimeout(() => {
    const splash = document.getElementById('splash')
    if (splash) {
      splash.classList.add('fade-out')
      setTimeout(() => splash.remove(), 300)
    }
  }, remainingTime)
}

function RootLayout() {
  // Initialize keyboard shortcuts listener
  useShortcutListener()

  useEffect(() => {
    // Hide splash once React has mounted (respects minimum time)
    hideSplash()
  }, [])

  return (
    <>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
  validateSearch: (search: Record<string, unknown>) => ({
    jobId: (search.jobId as string) || undefined,
  }),
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([indexRoute, settingsRoute])

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()
const hashHistory = createHashHistory()
const router = createRouter({
  routeTree,
  history: hashHistory,
  context: {
    ...TanStackQueryProviderContext,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
        <RouterProvider router={router} />
      </TanStackQueryProvider.Provider>
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
