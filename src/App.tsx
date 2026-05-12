import { useEffect } from 'react'
import { Cuadrante } from './components/Cuadrante'
import { Login } from './components/Login'
import { Toasts } from './components/ui/Toasts'
import { useAuth } from './lib/useAuth'
import { useRosterStore } from './store/useRosterStore'

export default function App() {
  const { loading, user, allowed } = useAuth()
  const loadAll = useRosterStore((s) => s.loadAll)
  const dataLoaded = useRosterStore((s) => s.loaded)
  const dataLoading = useRosterStore((s) => s.loading)
  const dataError = useRosterStore((s) => s.error)

  useEffect(() => {
    if (allowed && !dataLoaded && !dataLoading) loadAll()
  }, [allowed, dataLoaded, dataLoading, loadAll])

  if (loading) {
    return <FullScreenMessage>Cargando…</FullScreenMessage>
  }
  if (!user) return <Login user={null} />
  if (allowed === false) return <Login user={user} notAllowed />
  if (allowed === null) {
    return <FullScreenMessage>Verificando acceso…</FullScreenMessage>
  }
  if (!dataLoaded) {
    return <FullScreenMessage>{dataError ? `Error: ${dataError}` : 'Cargando datos…'}</FullScreenMessage>
  }

  return (
    <>
      <Cuadrante />
      <Toasts />
    </>
  )
}

function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
      {children}
    </div>
  )
}
