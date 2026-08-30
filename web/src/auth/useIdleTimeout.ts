import { useEffect, useRef } from 'react'

// Déconnecte automatiquement après un délai d'inactivité
export function useIdleTimeout(onIdle: () => void, timeoutMinutes = 10) {
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const timeoutMs = timeoutMinutes * 60 * 1000

    const reset = () => {
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(onIdle, timeoutMs)
    }

    // Événements qui comptent comme "activité"
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, reset))

    reset() // démarre le compte à rebours

    // Nettoyage quand le composant disparaît
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [onIdle, timeoutMinutes])
}