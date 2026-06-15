"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { LaborNewsManager } from "@/components/employee/EmployeesManagementPage"
import { listEmployees } from "@/services/employeeService"
import type { Employee } from "@/types/manager/employee"

export default function LaborNewsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    listEmployees()
      .then((data) => {
        if (active) setEmployees(data)
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar los funcionarios")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <LaborNewsManager employees={employees} />
}
