import { useState, useEffect } from 'react'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowBanner(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setShowBanner(false))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return null
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowBanner(false)
    return outcome
  }

  const dismiss = () => setShowBanner(false)

  return { showBanner, install, dismiss }
}
