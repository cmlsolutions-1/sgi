"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Info,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { IntelligenceAction, IntelligenceInsight, IntelligencePriority } from "@/types/intelligence"

type IntelligenceCenterProps = {
  insights: IntelligenceInsight[]
  contextLabel?: string
  title?: string
  description?: string
  initialVisible?: number
  onAction?: (action: IntelligenceAction, insight: IntelligenceInsight) => void
  onAsk?: (question: string) => string | Promise<string>
  assistantSuggestions?: string[]
}

type AssistantMessage = {
  id: string
  role: "assistant" | "user"
  content: string
}

const priorityMeta: Record<
  IntelligencePriority,
  { label: string; className: string; icon: typeof CircleAlert }
> = {
  critical: {
    label: "Critica",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: CircleAlert,
  },
  high: {
    label: "Alta",
    className: "border-orange-200 bg-orange-50 text-orange-700",
    icon: AlertTriangle,
  },
  medium: {
    label: "Media",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Info,
  },
  low: {
    label: "Preventiva",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: CheckCircle2,
  },
}

const priorityOrder: IntelligencePriority[] = ["critical", "high", "medium", "low"]

function buildAssistantAnswer(question: string, insights: IntelligenceInsight[]) {
  if (insights.length === 0) {
    return "No detecto situaciones pendientes con los datos disponibles en este momento. Puedes continuar registrando informacion y volvere a analizarla automaticamente."
  }

  const normalized = question.toLowerCase()
  let matches = insights

  if (/urgente|critica|critico|prioridad|primero/.test(normalized)) {
    matches = insights.filter((insight) => insight.priority === "critical" || insight.priority === "high")
  } else if (/evidencia|soporte|foto/.test(normalized)) {
    matches = insights.filter((insight) => /evidencia|soporte|foto/.test(`${insight.title} ${insight.description}`.toLowerCase()))
  } else if (/vencid|fecha|plazo/.test(normalized)) {
    matches = insights.filter((insight) => /vencid|fecha|plazo/.test(`${insight.title} ${insight.description}`.toLowerCase()))
  } else if (/riesgo|peligro/.test(normalized)) {
    matches = insights.filter((insight) => /riesgo|peligro/.test(`${insight.title} ${insight.description}`.toLowerCase()))
  } else if (/empleado|funcionario|seguridad social|afiliacion/.test(normalized)) {
    matches = insights.filter((insight) => /empleado|funcionario|seguridad social|afiliacion/.test(`${insight.title} ${insight.description}`.toLowerCase()))
  }

  const selected = (matches.length > 0 ? matches : insights).slice(0, 3)
  const summary = selected
    .map((insight, index) => `${index + 1}. ${insight.title}. ${insight.reason}`)
    .join("\n")

  return `Esto es lo que recomiendo revisar primero:\n${summary}`
}

export function IntelligenceCenter({
  insights,
  contextLabel = "SafeCloud",
  title = "Centro inteligente",
  description,
  initialVisible = 5,
  onAction,
  onAsk,
  assistantSuggestions = ["¿Qué debo atender primero?", "¿Cuántos empleados tengo?", "¿Qué puedo preguntarte?"],
}: IntelligenceCenterProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [answering, setAnswering] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      content: "Hola. Soy tu consultor SafeCloud. Puedo consultar la información real del sistema, verificar funcionarios, afiliaciones, documentos, medidas, riesgos y prioridades. No completaré respuestas con datos que no pueda comprobar.",
    },
  ])

  const visibleInsights = expanded ? insights : insights.slice(0, initialVisible)
  const groupedInsights = useMemo(
    () =>
      priorityOrder
        .map((priority) => ({
          priority,
          items: visibleInsights.filter((insight) => insight.priority === priority),
        }))
        .filter((group) => group.items.length > 0),
    [visibleInsights],
  )

  const counts = useMemo(
    () =>
      priorityOrder.reduce(
        (result, priority) => ({ ...result, [priority]: insights.filter((insight) => insight.priority === priority).length }),
        {} as Record<IntelligencePriority, number>,
      ),
    [insights],
  )

  function executeAction(action: IntelligenceAction, insight: IntelligenceInsight) {
    if (onAction) onAction(action, insight)
    if (action.href) router.push(action.href)
  }

  async function submitQuestion(value = question) {
    const cleanQuestion = value.trim()
    if (!cleanQuestion || answering) return

    const messageId = Date.now()
    setMessages((current) => [...current, { id: `user-${messageId}`, role: "user", content: cleanQuestion }])
    setQuestion("")
    setAnswering(true)

    try {
      const answer = onAsk ? await onAsk(cleanQuestion) : buildAssistantAnswer(cleanQuestion, insights)
      setMessages((current) => [
        ...current,
        { id: `assistant-${messageId}`, role: "assistant", content: answer },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${messageId}`,
          role: "assistant",
          content: "No pude consultar la información en este momento. Intenta nuevamente; no voy a asumir una respuesta sin verificar los datos.",
        },
      ])
    } finally {
      setAnswering(false)
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-white via-sky-50/40 to-cyan-50/70 shadow-sm">
        <div className="border-b border-sky-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-500 text-white shadow-sm">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    Analisis activo
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {description ??
                    (insights.length > 0
                      ? `Hemos detectado ${insights.length} ${insights.length === 1 ? "situacion que requiere" : "situaciones que requieren"} tu atencion.`
                      : "No detectamos situaciones pendientes con la informacion disponible.")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {priorityOrder.map((priority) => {
                if (!counts[priority]) return null
                const meta = priorityMeta[priority]
                return (
                  <span key={priority} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", meta.className)}>
                    {meta.label}: {counts[priority]}
                  </span>
                )
              })}
              <Button type="button" size="sm" className="gap-2" onClick={() => setAssistantOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Preguntar a SafeCloud
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          {groupedInsights.length > 0 ? (
            groupedInsights.map(({ priority, items }) => {
              const meta = priorityMeta[priority]
              const PriorityIcon = meta.icon
              return (
                <div key={priority} className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <PriorityIcon className="h-3.5 w-3.5" />
                    Prioridad {meta.label.toLowerCase()}
                  </div>
                  <div className="grid gap-3 xl:grid-cols-2">
                    {items.map((insight) => (
                      <article key={insight.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-primary">{insight.module}</p>
                            <h3 className="mt-1 font-semibold text-slate-950">{insight.title}</h3>
                          </div>
                          <span className={cn("shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold", meta.className)}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-5 text-slate-600">{insight.description}</p>
                        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                          <span className="font-semibold text-slate-800">Por que importa: </span>
                          {insight.reason}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {insight.actions.map((action) => (
                            <Button
                              key={action.id}
                              type="button"
                              size="sm"
                              variant={action.emphasis ? "default" : "outline"}
                              className="gap-2"
                              onClick={() => executeAction(action, insight)}
                            >
                              {action.label}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Todo se encuentra al dia según los datos disponibles en {contextLabel}.
            </div>
          )}

          {insights.length > initialVisible ? (
            <Button type="button" variant="ghost" size="sm" className="mx-auto flex gap-2" onClick={() => setExpanded((current) => !current)}>
              {expanded ? "Ver menos" : `Ver las ${insights.length} situaciones`}
              <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
            </Button>
          ) : null}
        </div>
      </section>

      <Sheet open={assistantOpen} onOpenChange={setAssistantOpen}>
        <SheetContent className="w-[calc(100vw-1rem)] bg-white p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-5 py-4 pr-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle>Asistente SafeCloud</SheetTitle>
                <SheetDescription>Analiza el contexto actual de {contextLabel}.</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-5",
                    message.role === "assistant"
                      ? "rounded-tl-md bg-slate-100 text-slate-700"
                      : "ml-auto rounded-tr-md bg-primary text-primary-foreground",
                  )}
                >
                  {message.content}
                </div>
              ))}
              {answering ? (
                <div className="flex w-fit items-center gap-2 rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Consultando datos reales...
                </div>
              ) : null}
            </div>

            <div className="border-t border-border bg-slate-50/70 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {assistantSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-primary hover:text-primary"
                    disabled={answering}
                    onClick={() => void submitQuestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  void submitQuestion()
                }}
              >
                <Input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Pregunta sobre tus pendientes..."
                  className="bg-white"
                />
                <Button type="submit" size="icon" aria-label="Enviar pregunta" disabled={!question.trim() || answering}>
                  {answering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Las respuestas se consultan en los datos disponibles de SafeCloud. Si un dato no está disponible, el asistente lo indicará.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
