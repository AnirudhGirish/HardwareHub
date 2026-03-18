'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastMessage {
  id: string
  type: ToastType
  title: string
  description?: string
}

// Singleton toast state
let toastQueue: ToastMessage[] = []
let listeners: Array<(toasts: ToastMessage[]) => void> = []

function notify(listeners: Array<(toasts: ToastMessage[]) => void>) {
  listeners.forEach((fn) => fn([...toastQueue]))
}

export const toast = {
  success: (title: string, description?: string) => addToast('success', title, description),
  error: (title: string, description?: string) => addToast('error', title, description),
  info: (title: string, description?: string) => addToast('info', title, description),
  warning: (title: string, description?: string) => addToast('warning', title, description),
}

function addToast(type: ToastType, title: string, description?: string) {
  const id = Math.random().toString(36).slice(2)
  toastQueue = [...toastQueue, { id, type, title, description }]
  notify(listeners)
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== id)
    notify(listeners)
  }, 5000)
}

const iconMap: Record<ToastType, React.ReactNode> = {
  success: (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-[#1A6B3C]" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-[#991B1B]" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-[#92610A]" fill="currentColor">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-[#1E3A5F]" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  ),
}

const bgMap: Record<ToastType, string> = {
  success: 'bg-[#F0FAF4] border-emerald-200',
  error: 'bg-[#FEF2F2] border-red-200',
  warning: 'bg-[#FEF9EC] border-amber-200',
  info: 'bg-[#EFF6FF] border-blue-200',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const handleUpdate = useCallback((updated: ToastMessage[]) => {
    setToasts(updated)
  }, [])

  useEffect(() => {
    listeners.push(handleUpdate)
    return () => {
      listeners = listeners.filter((l) => l !== handleUpdate)
    }
  }, [handleUpdate])

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'flex gap-3 items-start p-4 rounded-lg border shadow-sm pointer-events-auto',
              bgMap[t.type]
            )}
          >
            <div className="shrink-0 mt-0.5">{iconMap[t.type]}</div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0A0A0A]">{t.title}</p>
              {t.description && (
                <p className="text-xs text-[#6B6B6B] mt-0.5">{t.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
