import { KpiCard } from "@/components/dashboard/kpi-card"
import { NonConformitiesChart, SatisfactionChart, AuditChart, DepartmentChart } from "@/components/dashboard/charts"
import { FindingsTable } from "@/components/dashboard/findings-table"
import { mockIndicators } from "@/lib/mock-data"
import { Users, FileText, AlertTriangle, CheckCircle, ClipboardCheck, Target } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Sistema de Gestión de Calidad ISO 9001:2015</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString("es-ES")}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Satisfacción Cliente"
          value={mockIndicators[0].value}
          target={mockIndicators[0].target}
          unit="%"
          trend={mockIndicators[0].trend}
          icon={<Target className="h-5 w-5" />}
        />
        <KpiCard
          title="No Conformes"
          value={mockIndicators[1].value}
          target={mockIndicators[1].target}
          unit="%"
          trend={mockIndicators[1].trend}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <KpiCard
          title="Eficiencia"
          value={mockIndicators[2].value}
          target={mockIndicators[2].target}
          unit="%"
          trend={mockIndicators[2].trend}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <KpiCard
          title="Entregas"
          value={mockIndicators[3].value}
          target={mockIndicators[3].target}
          unit="%"
          trend={mockIndicators[3].trend}
          icon={<FileText className="h-5 w-5" />}
        />
        <KpiCard
          title="Auditorías"
          value={mockIndicators[4].value}
          target={mockIndicators[4].target}
          trend={mockIndicators[4].trend}
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <KpiCard
          title="Hallazgos Cerrados"
          value={mockIndicators[5].value}
          target={mockIndicators[5].target}
          unit="%"
          trend={mockIndicators[5].trend}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NonConformitiesChart />
        <SatisfactionChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AuditChart />
        <DepartmentChart />
      </div>

      {/* Findings Table */}
      <FindingsTable />
    </div>
  )
}
