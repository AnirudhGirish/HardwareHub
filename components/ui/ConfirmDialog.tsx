'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
  /** If set, user must type this exact string to confirm */
  confirmText?: string
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  confirmText,
  loading = false,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canConfirm = !confirmText || inputValue === confirmText

  async function handleConfirm() {
    if (!canConfirm) return
    setSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setSubmitting(false)
      setInputValue('')
    }
  }

  function handleClose() {
    setInputValue('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-[#6B6B6B]">{description}</p>

        {confirmText && (
          <div className="space-y-2">
            <p className="text-xs text-[#6B6B6B]">
              Type{' '}
              <code className="px-1 py-0.5 bg-[#F4F4F4] rounded text-[#0A0A0A] font-mono text-xs">
                {confirmText}
              </code>{' '}
              to confirm:
            </p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={confirmText}
              id="confirm-input"
              autoComplete="off"
            />
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={submitting || loading}>
            Cancel
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={!canConfirm || submitting || loading}
            loading={submitting || loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
