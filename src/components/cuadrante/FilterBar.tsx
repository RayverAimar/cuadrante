import type { Employee } from '../../types'
import { Icon } from '../ui/Icon'
import { Select } from '../ui/Select'

interface FilterBarProps {
  employees: Employee[]
  filterRole: string
  setFilterRole: (r: string) => void
  search: string
  setSearch: (s: string) => void
  visibleCount: number
  totalCount: number
}

export function FilterBar({
  employees, filterRole, setFilterRole, search, setSearch, visibleCount, totalCount,
}: FilterBarProps) {
  const roles = Array.from(new Set(employees.map((e) => e.role))).sort()
  const clear = () => { setFilterRole('all'); setSearch('') }
  const hasFilter = filterRole !== 'all' || search.trim() !== ''
  return (
    <div
      className="cdr-no-print cdr-filterbar"
      style={{
        borderBottom: '1px solid var(--rule)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: 'var(--paper)',
        flexWrap: 'wrap',
      }}
    >
      <span className="cdr-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Icon name="sliders" size={12} /> FILTROS
      </span>

      <input
        className="cdr-input"
        placeholder="Buscar empleado…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: 200, padding: '6px 10px', fontSize: 12 }}
      />

      <Select
        value={filterRole}
        onChange={setFilterRole}
        options={[
          { value: 'all', label: 'Todos los cargos' },
          ...roles.map((r) => ({ value: r, label: r })),
        ]}
        width={180}
        style={{ padding: '6px 10px', fontSize: 12 }}
      />

      {hasFilter && (
        <button onClick={clear} className="cdr-btn cdr-btn--ghost" style={{ fontSize: 11, padding: '4px 8px' }}>
          <Icon name="x" size={11} /> Limpiar
        </button>
      )}

      <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
        MOSTRANDO {visibleCount}/{totalCount} EMPL.
      </span>
    </div>
  )
}
