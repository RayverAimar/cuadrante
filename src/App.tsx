import { useState } from 'react'
import { Header } from './components/Header'
import { RosterGrid } from './components/RosterGrid'
import { ViolationsPanel } from './components/ViolationsPanel'
import { EmployeeModal } from './components/modals/EmployeeModal'
import { EmployeeListModal } from './components/modals/EmployeeListModal'
import { RulesModal } from './components/modals/RulesModal'
import { HelpModal } from './components/modals/HelpModal'

export default function App() {
  const [addEmpOpen, setAddEmpOpen] = useState(false)
  const [empListOpen, setEmpListOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Header — sticky, no-print */}
      <div className="no-print">
        <Header
          onAddEmployee={() => setAddEmpOpen(true)}
          onEmployeeList={() => setEmpListOpen(true)}
          onRules={() => setRulesOpen(true)}
          onHelp={() => setHelpOpen(true)}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden print-full">
        {/* Roster table (scrollable) */}
        <main className="flex-1 overflow-auto p-5">
          <RosterGrid />
        </main>

        {/* Violations sidebar — no-print */}
        <div className="no-print">
          <ViolationsPanel />
        </div>
      </div>

      {/* Modals */}
      <EmployeeModal open={addEmpOpen} onClose={() => setAddEmpOpen(false)} />
      <EmployeeListModal open={empListOpen} onClose={() => setEmpListOpen(false)} />
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
