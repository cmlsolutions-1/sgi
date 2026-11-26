const assert = require('node:assert/strict')
const path = require('node:path')
const crypto = require('node:crypto')
const { spawn } = require('node:child_process')
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/cristiancortes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const root = path.resolve(__dirname, '..'), url = 'http://localhost:3015'
const secret = crypto.randomBytes(32).toString('hex')
function token(role) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')
  const p = Buffer.from(JSON.stringify({ sub: 'demo-user', role, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')
  return `${h}.${p}.${crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')}`
}
const companies = [{ id: 'company-one', name: 'Empresa Uno', status: 'ACTIVE', nit: '123', activeModules: [] }, { id: 'company-two', name: 'Empresa Dos', status: 'ACTIVE', nit: '456', activeModules: [] }]
let browser, server, activeCompany = companies[0]
async function run() {
  server = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '--port', '3015'], { cwd: root, env: { ...process.env, SESSION_JWT_SECRET: secret, SESSION_JWT_ALGORITHM: 'HS256', SESSION_JWT_PUBLIC_KEY: '', SESSION_JWT_ISSUER: '', SESSION_JWT_AUDIENCE: '' }, stdio: 'ignore' })
  let running = false
  for (let i = 0; i < 80; i++) { try { if ((await fetch(url + '/login')).ok) { running = true; break } } catch {} await new Promise(resolve => setTimeout(resolve, 200)) }
  assert.ok(running, 'The isolated test server must start')
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const adminToken = token('ADMIN'), companyToken = token('ADMIN_COMPANY')
  await context.addCookies([{ name: 'sgc_session', value: adminToken, url }])
  await context.addInitScript(({ adminToken, company }) => { if (!localStorage.getItem('sgc_auth')) localStorage.setItem('sgc_auth', JSON.stringify({ state: { accessToken: adminToken, refreshToken: 'demo', modules: [], company }, version: 0 })) }, { adminToken, company: activeCompany })
  const page = await context.newPage(), errors = [], writes = []
  page.on('pageerror', e => errors.push(e.message))
  await page.route('**/api/**', async route => {
    const request = route.request(), p = new URL(request.url()).pathname
    if (request.method() !== 'GET') writes.push({ p, method: request.method() })
    let data = []
    if (p === '/api/company') data = companies
    else if (p === '/api/company/me') data = activeCompany
    else if (p.includes('/company-admin')) data = { company: activeCompany, admin: { id: 'demo-admin', name: 'Administrador', email: 'demo@example.com', phone: '3001234567' } }
    else if (p.startsWith('/api/user/')) data = { id: 'demo-user', name: 'Administrador', email: 'demo@example.com' }
    else if (p === '/api/notifications/unread-count') data = { count: 0 }
    else if (p === '/api/notifications') data = { items: [], total: 0 }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, message: 'OK', data }) })
  })
  await page.goto(url + '/manager')
  const panel = page.getByRole('region', { name: 'Suscripciones y consumo', exact: true })
  await panel.getByRole('button', { name: 'Asociar vista de prueba', exact: true }).waitFor()
  await assert.equal(await panel.getByRole('progressbar').getAttribute('aria-valuetext'), '54,12 GB de 66 GB')
  await panel.getByRole('button', { name: 'Asociar vista de prueba', exact: true }).click()
  await panel.getByRole('button', { name: 'Editar suscripción', exact: true }).click()
  await page.getByLabel('Adicional (GB)', { exact: true }).fill('10')
  await page.getByRole('button', { name: 'Guardar demostración', exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal(await panel.getByRole('progressbar').getAttribute('aria-valuetext'), '54,12 GB de 76 GB')
  await page.reload()
  assert.equal(await panel.getByRole('progressbar').getAttribute('aria-valuetext'), '54,12 GB de 76 GB')
  await panel.getByRole('button', { name: 'Editar suscripción', exact: true }).click()
  await page.getByLabel('Adicional (GB)', { exact: true }).fill('0')
  await page.setViewportSize({ width: 390, height: 844 })
  const dialog = page.getByRole('dialog')
  const footer = await dialog.getByRole('button', { name: 'Guardar demostración', exact: true }).boundingBox()
  assert.ok(footer.y >= 0 && footer.y + footer.height <= 844, 'The save button stays on screen')
  await page.screenshot({ path: '/tmp/subscription-editor-mobile.png' })
  await page.getByRole('button', { name: 'Guardar demostración', exact: true }).click()
  await dialog.waitFor({ state: 'hidden' })
  await page.evaluate(() => {
    const key = 'safecloud:subscription-demo:v1', state = JSON.parse(localStorage.getItem(key))
    state.bindings['company-two'] = { subscriptionId: 'demo-client-1', companyId: 'demo-h2' }
    localStorage.setItem(key, JSON.stringify(state))
  })
  async function companySession(company) {
    activeCompany = company
    await context.addCookies([{ name: 'sgc_session', value: companyToken, url }])
    await page.evaluate(({ companyToken, company }) => localStorage.setItem('sgc_auth', JSON.stringify({ state: { accessToken: companyToken, refreshToken: 'demo', modules: [], company }, version: 0 })), { companyToken, company })
    await page.goto(url + '/dashboard/settings')
  }
  await companySession(companies[0])
  const usage = page.getByRole('region', { name: 'Plan y consumo', exact: true })
  await usage.getByRole('progressbar').waitFor()
  assert.ok((await usage.innerText()).includes('38 de 50'))
  assert.ok(!(await usage.innerText()).includes('Horizonte Logística'))
  assert.equal(await usage.getByRole('progressbar').getAttribute('aria-valuetext'), '54,12 GB de 66 GB')
  await usage.getByRole('button', { name: 'Marcar como leído', exact: true }).click()
  await page.reload()
  await page.waitForLoadState('networkidle')
  assert.ok(await usage.getByRole('button', { name: 'Marcar como leído', exact: true }).isDisabled())
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.screenshot({ path: '/tmp/subscription-settings-mobile.png' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await companySession(companies[1])
  await usage.getByRole('progressbar').waitFor()
  assert.ok((await usage.innerText()).includes('52 de 50'))
  assert.equal(await usage.getByRole('progressbar').getAttribute('aria-valuetext'), '54,12 GB de 66 GB')
  assert.equal(await usage.getByRole('button', { name: 'Marcar como leído', exact: true }).isEnabled(), true)
  await page.screenshot({ path: '/tmp/subscription-settings-desktop.png' })
  assert.deepEqual(writes, [], 'The prototype never writes to backend APIs')
  assert.deepEqual(errors, [])
  console.log('Subscription browser checks passed: manager edits, persistence, company binding, independent active counts, shared storage, per-company notices, mobile scroll and no API writes')
}
run().catch(e => { console.error(e); process.exitCode = 1 }).finally(async () => { await browser?.close(); server?.kill() })
