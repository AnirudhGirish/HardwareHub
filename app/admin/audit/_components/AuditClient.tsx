'use client'

import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils/formatDate'
import type { Database, Json } from '@/lib/supabase/types'

type BaseLog = Database['public']['Tables']['audit_log']['Row']
type LogRow = BaseLog & { actor_name: string; actor_email: string }

export default function AuditClient({ initialLogs }: { initialLogs: LogRow[] }) {
  
  function handleExport() {
    window.location.href = '/api/audit?export=csv'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Audit Log</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Immutable record of system activity (showing latest 100).</p>
        </div>
        <Button onClick={handleExport} variant="secondary">Export all to CSV</Button>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Timestamp</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Actor</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Action</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Entity</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {initialLogs.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#9B9B9B]">No logs found.</td>
                </tr>
            ) : initialLogs.map((log) => (
              <tr key={log.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-6 py-4 text-[#6B6B6B] whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-[#0A0A0A]">{log.actor_name}</div>
                  {log.actor_email && <div className="text-xs text-[#6B6B6B]">{log.actor_email}</div>}
                </td>
                <td className="px-6 py-4 font-mono text-xs max-w-xs truncate" title={log.action}>{log.action}</td>
                <td className="px-6 py-4 text-[#6B6B6B] whitespace-nowrap">
                   {log.entity_type} {log.entity_id && `<${log.entity_id.split('-')[0]}>`}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-[#6B6B6B] w-64">
                   {log.metadata ? (
                     <pre className="max-h-20 overflow-y-auto w-full max-w-sm whitespace-pre-wrap">
                        {JSON.stringify(log.metadata)}
                     </pre>
                   ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
