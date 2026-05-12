import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { useRosterStore } from '../../store/useRosterStore'
import { exportYearXLS, importYearXLS, type ImportResult } from '../../utils/export'
import { MONTHS_ES } from '../../constants/shifts'

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'export' | 'import'

export function DataModal({ open, onClose }: Props) {
  const { year, employees, byMonth, replaceMonth } = useRosterStore()
  const [tab, setTab] = useState<Tab>('export')
  const [exportYear, setExportYear] = useState(year)
  const [importYear, setImportYear] = useState(year)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)

  const handleExportXLS = () => {
    exportYearXLS(employees, byMonth, exportYear)
  }

  const handleExportPDF = () => {
    // Trigger print of the year via a body class. Cuadrante mounts
    // <YearRosterPrint /> on this flag (see Cuadrante.tsx).
    onClose()
    window.dispatchEvent(new CustomEvent('cdr:print-year', { detail: { year: exportYear } }))
  }

  const handleFile = async (file: File) => {
    setBusy(true)
    try {
      const result = await importYearXLS(file, employees)
      setPreview({ ...result, year: importYear })
      setSelected(new Set(result.months.filter((m) => m.cells > 0).map((m) => m.month)))
    } catch (err) {
      console.error('import error', err)
      alert('No se pudo leer el archivo')
    } finally {
      setBusy(false)
    }
  }

  const handleApply = () => {
    if (!preview) return
    if (!window.confirm(`Reemplazar ${selected.size} mes(es) del año ${importYear}. Esto borrará las asignaciones existentes en esos meses. ¿Continuar?`)) return
    preview.months.forEach((m) => {
      if (!selected.has(m.month)) return
      replaceMonth(importYear, m.month, m.assignments)
    })
    setPreview(null)
    setSelected(new Set())
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Datos · Importar / Exportar" width={680}>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)', marginBottom: 18 }}>
        {(['export', 'import'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--ink)' : '2px solid transparent',
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: tab === t ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: 600,
            }}
          >
            {t === 'export' ? 'EXPORTAR AÑO' : 'IMPORTAR AÑO'}
          </button>
        ))}
      </div>

      {tab === 'export' && (
        <div>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            Genera un archivo Excel con una hoja por mes ({MONTHS_ES[0]}–{MONTHS_ES[11]}). El formato se puede
            re-importar.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
            <label style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
              AÑO
            </label>
            <input
              type="number"
              className="cdr-input"
              value={exportYear}
              onChange={(e) => setExportYear(parseInt(e.target.value || '0', 10))}
              min={2000}
              max={2100}
              style={{ width: 100 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleExportXLS} className="cdr-btn cdr-btn--primary">
              <Icon name="download" size={14} /> Excel · {exportYear}.xlsx
            </button>
            <button onClick={handleExportPDF} className="cdr-btn">
              <Icon name="download" size={14} /> PDF · 12 páginas
            </button>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
            EL PDF ABRE EL DIÁLOGO DE IMPRESIÓN · UNA HOJA APAISADA POR MES
          </p>
        </div>
      )}

      {tab === 'import' && (
        <div>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            Sube un Excel exportado por Cuadrante. Los empleados se emparejan por <strong>nombre</strong>.
            Nombres no encontrados se ignoran.
          </p>

          {!preview && (
            <>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                  AÑO DESTINO
                </label>
                <input
                  type="number"
                  className="cdr-input"
                  value={importYear}
                  onChange={(e) => setImportYear(parseInt(e.target.value || '0', 10))}
                  min={2000}
                  max={2100}
                  style={{ width: 100 }}
                />
              </div>
              {/* Label-wrapped input: clicking the label opens the native picker.
                  Using button+ref.click() fails in some browsers when the input
                  is display:none — the label pattern is the reliable form. */}
              <label
                className="cdr-btn"
                style={{ cursor: busy ? 'wait' : 'pointer', position: 'relative', opacity: busy ? 0.6 : 1 }}
              >
                <Icon name="upload" size={14} />
                {busy ? 'Leyendo…' : 'Elegir archivo'}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  disabled={busy}
                  style={{
                    position: 'absolute', inset: 0,
                    opacity: 0, cursor: 'inherit',
                    pointerEvents: busy ? 'none' : 'auto',
                  }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                    e.target.value = ''
                  }}
                />
              </label>
            </>
          )}

          {preview && (
            <div>
              <div className="cdr-eyebrow" style={{ marginBottom: 10 }}>
                VISTA PREVIA · {preview.year}
              </div>
              <div style={{ border: '1px solid var(--rule)', marginBottom: 14 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr 80px 80px 80px',
                    padding: '8px 12px',
                    background: 'var(--paper-2)',
                    borderBottom: '1px solid var(--rule)',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    color: 'var(--ink-3)',
                    letterSpacing: '0.1em',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <span />
                  <span>MES</span>
                  <span style={{ textAlign: 'right' }}>EMPL.</span>
                  <span style={{ textAlign: 'right' }}>CELDAS</span>
                  <span style={{ textAlign: 'right' }}>NO MATCH</span>
                </div>
                {preview.months.map((m) => {
                  const isOn = selected.has(m.month)
                  return (
                    <label
                      key={m.month}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '28px 1fr 80px 80px 80px',
                        padding: '8px 12px',
                        borderTop: '1px solid var(--rule)',
                        alignItems: 'center',
                        gap: 8,
                        cursor: m.cells > 0 ? 'pointer' : 'default',
                        opacity: m.cells > 0 ? 1 : 0.5,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isOn}
                        disabled={m.cells === 0}
                        onChange={() => {
                          const next = new Set(selected)
                          if (isOn) next.delete(m.month)
                          else next.add(m.month)
                          setSelected(next)
                        }}
                      />
                      <span style={{ fontSize: 13 }}>{MONTHS_ES[m.month]}</span>
                      <span style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12 }}>{m.matched}</span>
                      <span style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12 }}>{m.cells}</span>
                      <span
                        style={{
                          textAlign: 'right',
                          fontFamily: 'var(--mono)',
                          fontSize: 12,
                          color: m.unmatched.length > 0 ? 'var(--warn)' : 'var(--ink-3)',
                        }}
                      >
                        {m.unmatched.length}
                      </span>
                    </label>
                  )
                })}
              </div>

              {preview.totalUnmatched.length > 0 && (
                <div
                  style={{
                    padding: 10,
                    marginBottom: 14,
                    background: 'color-mix(in oklch, var(--warn) 8%, var(--paper))',
                    border: '1px solid var(--warn)',
                    fontSize: 12,
                  }}
                >
                  <strong>Nombres no encontrados:</strong>{' '}
                  <span style={{ fontFamily: 'var(--mono)' }}>
                    {preview.totalUnmatched.join(', ')}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setPreview(null)} className="cdr-btn cdr-btn--ghost">
                  Cancelar
                </button>
                <button
                  onClick={handleApply}
                  disabled={selected.size === 0}
                  className="cdr-btn cdr-btn--primary"
                  style={selected.size === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  <Icon name="check" size={13} /> Aplicar {selected.size} mes{selected.size !== 1 ? 'es' : ''}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
