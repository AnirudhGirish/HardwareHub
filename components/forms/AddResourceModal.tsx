'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { UserCreateResourceSchema, type UserCreateResourceInput } from '@/lib/schemas/resource'

interface AddResourceModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddResourceModal({ open, onClose, onSuccess }: AddResourceModalProps) {
  const [serialError, setSerialError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateResourceInput>({
    resolver: zodResolver(UserCreateResourceSchema),
    defaultValues: { type: 'hardware' },
  })

  const selectedType = watch('type')

  function handleClose() {
    reset()
    setSerialError(null)
    onClose()
  }

  async function onSubmit(data: UserCreateResourceInput) {
    setSerialError(null)

    const res = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        type: data.type,
        description: data.description || undefined,
        serial_number: data.serial_number || undefined,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      if (res.status === 409 || (json.error as string)?.toLowerCase().includes('serial')) {
        setSerialError(json.error ?? 'Serial number already exists in the system')
        return
      }
      toast.error(json.error ?? 'Failed to add resource')
      return
    }

    reset()
    setSerialError(null)
    onSuccess()
    onClose()
    toast.success('Resource added successfully')
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add a Resource" size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Resource Name */}
        <Input
          label="Resource name"
          id="resource-name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="e.g. MacBook Pro 14&quot;"
        />

        {/* Type — segmented control */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#0A0A0A]">Type</span>
          <div className="flex gap-2">
            {(['hardware', 'licence'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t)}
                className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
                  selectedType === t
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#6B6B6B] border-[#D1D1D1] hover:border-[#9B9B9B]'
                }`}
              >
                {t === 'hardware' ? 'Hardware' : 'Licence'}
              </button>
            ))}
          </div>
          {errors.type && <p className="text-xs text-[#991B1B]">{errors.type.message}</p>}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="resource-description" className="text-sm font-medium text-[#0A0A0A]">
            Description <span className="text-[#9B9B9B] font-normal">(optional)</span>
          </label>
          <textarea
            id="resource-description"
            {...register('description')}
            rows={3}
            maxLength={500}
            placeholder="Brief description of this resource…"
            className="w-full rounded-md border border-[#D1D1D1] bg-white px-3 py-2 text-sm text-[#0A0A0A] placeholder-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent resize-none"
          />
          {errors.description && <p className="text-xs text-[#991B1B]">{errors.description.message}</p>}
        </div>

        {/* Serial Number */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="resource-serial" className="text-sm font-medium text-[#0A0A0A]">
            Serial number <span className="text-[#9B9B9B] font-normal">(optional)</span>
          </label>
          <input
            id="resource-serial"
            type="text"
            {...register('serial_number')}
            maxLength={100}
            placeholder="SN-XXXXXXXX"
            className="h-10 w-full rounded-md border border-[#D1D1D1] bg-white px-3 font-mono text-sm text-[#0A0A0A] placeholder-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
          />
          {(errors.serial_number || serialError) && (
            <p className="text-xs text-[#991B1B]">{errors.serial_number?.message ?? serialError}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={isSubmitting}>
            Add Resource
          </Button>
        </div>
      </form>
    </Modal>
  )
}
