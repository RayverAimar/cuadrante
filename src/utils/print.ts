/**
 * Open the browser print dialog with a body class applied while it's open.
 *
 * The class lets the print stylesheet hide everything except the target
 * container (see `body.cdr-printing-individuals` etc. in index.css). The
 * `afterprint` event fires whether the user prints or cancels, so cleanup
 * is symmetric.
 *
 * `beforePrint` runs after the class is applied but before `window.print()`,
 * giving callers a hook to mark React state or wait one frame.
 */
export function printWithBodyClass(className: string, opts?: { beforePrint?: () => void; onAfterPrint?: () => void }) {
  document.body.classList.add(className)
  const cleanup = () => {
    document.body.classList.remove(className)
    opts?.onAfterPrint?.()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  opts?.beforePrint?.()
  // Give React one paint to flush the print container before the dialog opens.
  requestAnimationFrame(() => window.print())
}
