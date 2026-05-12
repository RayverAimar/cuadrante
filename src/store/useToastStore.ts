import { create } from 'zustand'

export type ToastLevel = 'error' | 'info' | 'success'

export interface Toast {
  id: number
  level: ToastLevel
  message: string
}

interface ToastStore {
  toasts: Toast[]
  push: (message: string, level?: ToastLevel) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  push(message, level = 'error') {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, level, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 6000)
  },
  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

export function toastError(label: string, err: unknown) {
  const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Error desconocido'
  useToastStore.getState().push(`${label}: ${msg}`, 'error')
}
