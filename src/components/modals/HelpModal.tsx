import { Modal } from '../ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: Props) {
  const steps = [
    {
      tag: '01',
      title: 'Selecciona celdas',
      body: 'Click sobre una celda para seleccionarla. Arrastra para seleccionar un rango. Mantén Shift mientras seleccionas para sumar al conjunto actual.',
    },
    {
      tag: '02',
      title: 'Aplica un turno',
      body: 'Con la selección activa aparece la barra inferior. Elige M, T, N, V, L o D para aplicar a todas las celdas — o pulsa la letra en el teclado. Limpia con ⌫.',
    },
    {
      tag: '03',
      title: 'Cierra el mes',
      body: 'Las violaciones de regla aparecen en vivo en el panel derecho. Auto-llenar completa los días vacíos respetando reglas y exporta a PDF, Excel o CSV desde el ícono de descarga.',
    },
    {
      tag: '04',
      title: 'Atajos de teclado',
      body: '⌘/Ctrl+Z deshace la última edición. ⌘/Ctrl+← y ⌘/Ctrl+→ cambian de mes. Esc limpia la selección. Click-derecho sobre una celda con turno abre una nota.',
    },
  ]
  return (
    <Modal open={open} onClose={onClose} title="Cómo usar Cuadrante" width={620}>
      <div style={{ display: 'grid', gap: 0, border: '1px solid var(--rule)' }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr',
              gap: 16,
              padding: '20px 22px',
              borderTop: i === 0 ? 'none' : '1px solid var(--rule)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 36,
                color: 'var(--accent)',
                lineHeight: 1,
              }}
            >
              {s.tag}
            </span>
            <div>
              <h4 style={{ margin: '4px 0 6px', fontWeight: 600, fontSize: 16 }}>{s.title}</h4>
              <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 13.5, lineHeight: 1.55 }}>{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
