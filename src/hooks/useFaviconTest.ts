import { useEffect } from 'react'
import { useSystemSettings } from '../contexts/SystemSettingsContext'

export function useFaviconTest() {
  const { settings } = useSystemSettings()

  useEffect(() => {
    // Test function to verify favicon updates
    const testFavicon = () => {
      const favicon = document.querySelector('#favicon') as HTMLLinkElement
      const appleTouchIcon = document.querySelector('#apple-touch-icon') as HTMLLinkElement
      
      console.log('🎨 Favicon Test Results:')
      console.log('Settings favicon_url:', settings.favicon_url)
      console.log('Current favicon href:', favicon?.href)
      console.log('Current apple-touch-icon href:', appleTouchIcon?.href)
      console.log('Favicon element exists:', !!favicon)
      console.log('Apple touch icon element exists:', !!appleTouchIcon)
      
      // Test if favicon matches system settings
      if (favicon && settings.favicon_url) {
        const isCorrect = favicon.href === settings.favicon_url || 
                         favicon.href.endsWith(settings.favicon_url)
        console.log('✅ Favicon correctly updated:', isCorrect)
      }
    }

    // Run test after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(testFavicon, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [settings.favicon_url])

  return { settings }
}