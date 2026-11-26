"use client"

import { useEffect, useState } from "react"
import { createDemoState, validateSubscription, type DemoState } from "@/lib/subscriptions/model"

const key = "safecloud:subscription-demo:v1"
const event = "safecloud:subscription-demo-change"
function read(): DemoState {
  const raw = localStorage.getItem(key)
  if (!raw) return createDemoState()
  const value = JSON.parse(raw) as DemoState
  if (!Array.isArray(value.subscriptions) || !value.subscriptions.length || !value.bindings || !value.acknowledged || value.subscriptions.some(item => validateSubscription(item))) throw new Error("Los datos del prototipo no son válidos. Restablece la demostración.")
  return value
}
export function useSubscriptionDemo() {
  const [data, setData] = useState<DemoState>(createDemoState)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    const refresh = () => { try { setData(read()); setError("") } catch (e) { setError((e as Error).message) } finally { setReady(true) } }
    const storage = (e: StorageEvent) => { if (e.key === key || e.key === null) refresh() }
    refresh(); window.addEventListener(event, refresh); window.addEventListener("storage", storage)
    return () => { window.removeEventListener(event, refresh); window.removeEventListener("storage", storage) }
  }, [])
  function update(transform: (current: DemoState) => DemoState) {
    const next = transform(read())
    localStorage.setItem(key, JSON.stringify(next))
    setData(next); setError(""); window.dispatchEvent(new Event(event))
  }
  function reset() { localStorage.removeItem(key); setError(""); setData(createDemoState()); window.dispatchEvent(new Event(event)) }
  return { data, ready, error, update, reset }
}
