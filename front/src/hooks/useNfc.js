import { useState, useRef } from 'react'

export const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

export function useNfc() {
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const ndefRef = useRef(null)
  const supported = typeof window !== 'undefined' && 'NDEFReader' in window

  async function startScan(onRead) {
    if (!supported) {
      setError('Web NFC non supporté. Utilisez Chrome sur Android.')
      return
    }
    if (scanning) {
      setScanning(false)
      setStatus('')
      ndefRef.current = null
      return
    }

    setScanning(true)
    setError('')
    setStatus('Approchez un tag NFC…')

    try {
      const ndef = new window.NDEFReader()
      ndefRef.current = ndef
      await ndef.scan()

      ndef.addEventListener('readingerror', () => {
        setError('Impossible de lire le tag — réessayez.')
        setScanning(false)
        setStatus('')
      })

      ndef.addEventListener('reading', ({ message, serialNumber }) => {
        for (const record of message.records) {
          if (record.recordType !== 'text') continue
          const decoder = new TextDecoder(record.encoding ?? 'utf-8')
          const text = decoder.decode(record.data)
          setScanning(false)
          setStatus('')
          ndefRef.current = null
          onRead(text, serialNumber)
          break
        }
      })
    } catch (err) {
      setScanning(false)
      setStatus('')
      setError(`Erreur : ${err.message}`)
    }
  }

  return { scanning, status, error, supported, startScan }
}
