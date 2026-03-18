'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils/formatDate'
import { CheckCircle2, XCircle, Package, AlertCircle, RefreshCw, Info, Bell, Inbox, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  request_approved: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  request_rejected: <XCircle className="w-5 h-5 text-red-600" />,
  request_received: <Inbox className="w-5 h-5 text-blue-600" />,
  loan_created: <Package className="w-5 h-5 text-zinc-600" />,
  loan_overdue: <AlertCircle className="w-5 h-5 text-red-600" />,
  loan_returned: <RefreshCw className="w-5 h-5 text-emerald-600" />,
}

export function NotificationBell() {
  const { notifications, unreadCount, refresh } = useNotifications()
  const [open, setOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function handleMarkAsRead(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
    if (error) { toast.error('Failed to mark read'); return }
    refresh()
  }

  async function handleClearAll() {
    setClearing(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setClearing(false); return }

    const { error } = await supabase.from('notifications').delete().eq('user_id', user.id)
    setClearing(false)
    if (error) { toast.error('Failed to clear notifications'); return }
    toast.success('All notifications cleared')
    refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-md text-[#6B6B6B] hover:bg-[#F4F4F4] transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="unread-badge"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-[#991B1B] text-white text-[10px] font-semibold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Notifications" size="md">
        <div className="-mx-6 border-b border-[#E5E5E5] pb-4 px-6 mb-4 flex justify-between items-center">
          <p className="text-sm text-[#6B6B6B]">
            You have {unreadCount} unread message{unreadCount !== 1 && 's'}.
          </p>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} loading={clearing} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear all
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
          {notifications.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="text-sm font-medium text-[#0A0A0A]">All caught up!</h3>
              <p className="text-xs text-[#6B6B6B] mt-1">Check back later for new notifications.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 space-y-4">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`pt-4 first:pt-0 flex gap-4 ${notif.read ? 'opacity-70' : ''}`}
                >
                  <div className="shrink-0 mt-1">
                    {NOTIFICATION_ICONS[notif.type] || <Info className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm tracking-tight ${notif.read ? 'font-medium text-[#4A4A4A]' : 'font-semibold text-[#0A0A0A]'}`}>
                        {notif.title}
                      </p>
                      <span className="shrink-0 text-[10px] font-medium text-[#9B9B9B] uppercase tracking-wider">
                        {formatDateTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B6B6B] mt-1 pr-6 leading-relaxed">
                      {notif.body}
                    </p>
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-xs font-semibold text-[#0A0A0A] mt-2 hover:underline inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark as read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  )
}
