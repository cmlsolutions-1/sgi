
export const addOneYear = (iso: string) => {
    const d = new Date(iso + "T00:00:00")
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().slice(0, 10)
  }
  
  export const isExpired = (validFromISO: string) => {
    const expiresISO = addOneYear(validFromISO)
    const todayISO = new Date().toISOString().slice(0, 10)
    return expiresISO < todayISO
  }
  
  export const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = filename
    a.click()
  }
  