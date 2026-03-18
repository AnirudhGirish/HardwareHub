'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@/lib/schemas/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { extractDomain } from '@/lib/utils/extractDomain'

type Department = { id: string; name: string }
type Team = { id: string; name: string }

export default function RegisterForm() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const selectedDeptId = watch('department_id')

  // Load departments on mount
  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((d) => setDepartments(d.data ?? []))
      .catch(() => {})
  }, [])

  // Load teams when department changes, clear team selection
  useEffect(() => {
    if (!selectedDeptId) { setTeams([]); return }
    setValue('team_id', '')
    fetch(`/api/teams?department_id=${selectedDeptId}`)
      .then((r) => r.json())
      .then((d) => setTeams(d.data ?? []))
      .catch(() => {})
  }, [selectedDeptId, setValue])

  async function onSubmit(data: RegisterInput) {
    setServerError(null)

    // Client-side domain hint
    try {
      extractDomain(data.email)
    } catch {
      setServerError('Invalid email address')
      return
    }

    const res = await fetch('/api/auth/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        username: data.username.toLowerCase(),
        employee_id: data.employee_id,
        department_id: data.department_id,
        team_id: data.team_id,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      setServerError(json.error ?? 'Failed to create account')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-[#FEF2F2] border border-red-200 px-4 py-3">
          <p className="text-sm text-[#991B1B]">{serverError}</p>
        </div>
      )}

      {/* 1. Full Name */}
      <Input
        label="Full name"
        id="full_name"
        autoComplete="name"
        {...register('full_name')}
        error={errors.full_name?.message}
        placeholder="Jane Doe"
      />

      {/* 2. Username */}
      <Input
        label="Username"
        id="username"
        autoComplete="username"
        {...register('username', {
          onChange: (e) => {
            // Enforce lowercase as user types for better UX
            e.target.value = e.target.value.toLowerCase()
          },
        })}
        error={errors.username?.message}
        placeholder="jane_doe"
        hint="Lowercase letters, numbers, and underscores only"
      />

      {/* 3. Employee ID */}
      <Input
        label="Employee ID"
        id="employee_id"
        {...register('employee_id')}
        error={errors.employee_id?.message}
        placeholder="EMP12345"
      />

      {/* 4. Email */}
      <Input
        label="Email"
        type="email"
        id="email"
        autoComplete="email"
        {...register('email')}
        error={errors.email?.message}
        placeholder="you@mbrdi.mercedes-benz.com"
        hint="Must be from an approved domain"
      />

      {/* 5. Password */}
      <Input
        label="Password"
        type="password"
        id="password"
        autoComplete="new-password"
        {...register('password')}
        error={errors.password?.message}
        placeholder="••••••••"
      />

      {/* 6. Confirm Password */}
      <Input
        label="Confirm password"
        type="password"
        id="confirm_password"
        autoComplete="new-password"
        {...register('confirm_password')}
        error={errors.confirm_password?.message}
        placeholder="••••••••"
      />

      {/* 7. Department */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="department_id" className="text-sm font-medium text-[#0A0A0A]">Department</label>
        <select
          id="department_id"
          {...register('department_id')}
          className="h-10 w-full rounded-md border border-[#D1D1D1] bg-white px-3 text-sm text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
        >
          <option value="">Select department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {errors.department_id && <p className="text-xs text-[#991B1B]">{errors.department_id.message}</p>}
      </div>

      {/* 8. Team */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="team_id" className="text-sm font-medium text-[#0A0A0A]">Team</label>
        <select
          id="team_id"
          {...register('team_id')}
          disabled={!selectedDeptId || teams.length === 0}
          className="h-10 w-full rounded-md border border-[#D1D1D1] bg-white px-3 text-sm text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent disabled:opacity-50"
        >
          <option value="">{!selectedDeptId ? 'Select a department first' : 'Select team'}</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {errors.team_id && <p className="text-xs text-[#991B1B]">{errors.team_id.message}</p>}
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Create account
      </Button>
    </form>
  )
}
