import { cn } from '@/lib/utils/cn'

export type BadgeVariant =
  | 'free'
  | 'on_loan'
  | 'overdue'
  | 'pending'
  | 'deactivated'
  | 'hardware'
  | 'licence'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'active'
  | 'returned'
  | 'maintenance'
  | 'retired'
  | 'available'
  | 'in_use'

const variantStyles: Record<BadgeVariant, string> = {
  free: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_loan: 'bg-amber-50 text-amber-700 border-amber-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
  deactivated: 'bg-gray-100 text-gray-600 border-gray-200',
  hardware: 'bg-[#F4F4F4] text-[#5C5C5C] border-[#D1D1D1]',
  licence: 'bg-purple-50 text-purple-700 border-purple-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  active: 'bg-amber-50 text-amber-700 border-amber-200',
  returned: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  maintenance: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  retired: 'bg-gray-100 text-gray-500 border-gray-200',
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_use: 'bg-amber-50 text-amber-700 border-amber-200',
}

const defaultLabels: Partial<Record<BadgeVariant, string>> = {
  on_loan: 'On Loan',
}

interface BadgeProps {
  variant: BadgeVariant
  className?: string
  children?: React.ReactNode
}

export function Badge({ variant, className, children }: BadgeProps) {
  const label = children ?? defaultLabels[variant] ?? variant.charAt(0).toUpperCase() + variant.slice(1)

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-widest border',
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
