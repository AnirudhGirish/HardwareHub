'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

type ExploreSearchFormProps = {
  initialSearch?: string
  initialType?: string
  initialDepartment?: string
  initialTeam?: string
}

type Department = { id: string; name: string }
type Team = { id: string; name: string }

export function ExploreSearchForm({
  initialSearch = '',
  initialType = '',
  initialDepartment = '',
  initialTeam = '',
}: ExploreSearchFormProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [type, setType] = useState(initialType)
  const [departmentId, setDepartmentId] = useState(initialDepartment)
  const [teamId, setTeamId] = useState(initialTeam)
  
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  // Load departments
  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((d) => setDepartments(d.data ?? []))
      .catch(() => {})
  }, [])

  // Load teams when department changes
  useEffect(() => {
    if (!departmentId) {
      setTeams([])
      if (teamId) setTeamId('') 
      return
    }
    fetch(`/api/teams?department_id=${departmentId}`)
      .then((r) => r.json())
      .then((d) => {
        setTeams(d.data ?? [])
        // If the initially loaded team doesn't belong to this department anymore, clear it
        if (teamId && !(d.data ?? []).find((t: Team) => t.id === teamId)) {
          setTeamId('')
        }
      })
      .catch(() => {})
  }, [departmentId])

  // Debounced auto-submit
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    
    const timeoutId = setTimeout(() => {
      const p = new URLSearchParams()
      if (search) p.set('search', search)
      if (type) p.set('type', type)
      if (departmentId) p.set('department', departmentId)
      if (teamId) p.set('team', teamId)
      
      router.push(`/explore?${p.toString()}`)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [search, type, departmentId, teamId, router])

  function handleClear() {
    setSearch('')
    setType('')
    setDepartmentId('')
    setTeamId('')
    router.push('/explore')
  }

  const hasFilters = search || type || departmentId || teamId

  return (
    <div className="bg-[#FAFBFD] border border-blue-100 rounded-xl p-5 mb-8 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or serial…"
              className="h-10 w-full rounded-lg border border-[#D1D1D1] bg-white pl-9 pr-3 text-sm text-[#0A0A0A] placeholder-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 rounded-lg border border-[#D1D1D1] bg-white px-3 text-sm text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-w-[140px]"
          >
            <option value="">All Types</option>
            <option value="hardware">Hardware</option>
            <option value="licence">Software Licence</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="h-10 flex-1 rounded-lg border border-[#D1D1D1] bg-white px-3 text-sm text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="">Any Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            disabled={!departmentId || teams.length === 0}
            className="h-10 flex-1 rounded-lg border border-[#D1D1D1] bg-white px-3 text-sm text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-50"
          >
            <option value="">Any Team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <div className="flex gap-2">
            {hasFilters && (
              <button
                type="button"
                onClick={handleClear}
                className="h-10 px-4 rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#6B6B6B] hover:bg-slate-50 transition-colors bg-white whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
