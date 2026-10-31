import { useEffect } from 'react'

export type Theme = 'paper' | 'void'

// Switches the whole page's theme while the calling screen is shown, and
// switches back when it goes away. The colors live in tokens.css.
export function useTheme(theme: Theme): void {
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    updateBrowserBar()
    return () => {
      delete root.dataset.theme
      updateBrowserBar()
    }
  }, [theme])
}

// Phones tint their browser bar with theme-color; keep it matching the page.
function updateBrowserBar(): void {
  const meta = document.querySelector('meta[name="theme-color"]')
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  if (meta && bg) meta.setAttribute('content', bg)
}
