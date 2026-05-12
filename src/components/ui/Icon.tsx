import type { SVGProps } from 'react'

export type IconName =
  | 'sun' | 'moon' | 'sparkles' | 'arrow-l' | 'arrow-r' | 'plus'
  | 'users' | 'shield' | 'help' | 'more' | 'print' | 'download'
  | 'check' | 'x' | 'alert' | 'grid' | 'corner' | 'dot' | 'paint'
  | 'sliders' | 'logo' | 'flag' | 'calendar' | 'edit' | 'logout'
  | 'copy' | 'database' | 'upload' | 'undo' | 'redo' | 'history'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  strokeWidth?: number
}

export function Icon({ name, size = 16, strokeWidth = 1.5, ...rest }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  }
  switch (name) {
    case 'sun':       return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
    case 'moon':      return <svg {...common}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    case 'sparkles':  return <svg {...common}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14zM5 14l.6 1.7L7 16.3l-1.4.6L5 18.7l-.6-1.8L3 16.3l1.4-.6L5 14z"/></svg>
    case 'arrow-l':   return <svg {...common}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    case 'arrow-r':   return <svg {...common}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    case 'plus':      return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>
    case 'users':     return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'shield':    return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'help':      return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    case 'more':      return <svg {...common}><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>
    case 'print':     return <svg {...common}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    case 'download':  return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
    case 'check':     return <svg {...common}><path d="M20 6L9 17l-5-5"/></svg>
    case 'x':         return <svg {...common}><path d="M18 6L6 18M6 6l12 12"/></svg>
    case 'alert':     return <svg {...common}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    case 'grid':      return <svg {...common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    case 'corner':    return <svg {...common}><path d="M5 5h6M5 5v6"/></svg>
    case 'dot':       return <svg {...common}><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
    case 'paint':     return <svg {...common}><path d="M3 3h18v6H3zM21 9v6a2 2 0 0 1-2 2h-7M12 17v4"/></svg>
    case 'sliders':   return <svg {...common}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
    case 'flag':      return <svg {...common}><path d="M4 22V4M4 4h12l-2 4 2 4H4"/></svg>
    case 'calendar':  return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="0"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'edit':      return <svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    case 'logout':    return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
    case 'copy':      return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
    case 'database':  return <svg {...common}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/></svg>
    case 'upload':    return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
    case 'undo':      return <svg {...common}><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>
    case 'redo':      return <svg {...common}><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>
    case 'history':   return <svg {...common}><path d="M3 3v6h6"/><path d="M3.51 9A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l3 3"/></svg>
    case 'logo':      return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="2" width="9" height="9"/>
        <rect x="13" y="2" width="9" height="9" fillOpacity={0.4}/>
        <rect x="2" y="13" width="9" height="9" fillOpacity={0.4}/>
        <rect x="13" y="13" width="9" height="9"/>
      </svg>
    )
    default: return null
  }
}
