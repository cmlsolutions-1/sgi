const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { webcrypto } = require('node:crypto')
const ts = require('typescript')
globalThis.crypto = webcrypto
const cache = new Map()
function load(file) {
  file = path.resolve(__dirname, '..', file)
  if (cache.has(file)) return cache.get(file).exports
  const module = { exports: {} }; cache.set(file, module)
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  new Function('require', 'module', 'exports', source)(id => id.startsWith('.') ? load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(file), id + '.ts'))) : require(id), module, module.exports)
  return module.exports
}
async function main() {
  const { verifySessionJwt } = load('lib/jwt-verification.ts')
  const { isTokenExpired } = load('lib/jwt.ts')
  const secret = 'test-only-never-deploy-this-secret-1234567890'
  const hmac = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const seconds = Math.floor(Date.now() / 1000)
  const claims = { sub: 'test-user', role: 'ADMIN', exp: seconds + 600, iss: 'test-backend', aud: 'safecloud' }
  async function signed(payload, header = { alg: 'HS256', typ: 'JWT' }, key = hmac, algorithm = 'HMAC') {
    const data = [header, payload].map(v => Buffer.from(JSON.stringify(v)).toString('base64url')).join('.')
    const signature = await crypto.subtle.sign(algorithm, key, new TextEncoder().encode(data))
    return `${data}.${Buffer.from(signature).toString('base64url')}`
  }
  const config = { algorithm: 'HS256', secret, issuer: 'test-backend', audience: 'safecloud' }
  const token = await signed(claims)
  assert.equal((await verifySessionJwt(token, config)).role, 'ADMIN')
  assert.equal(await verifySessionJwt(token, {}), null)
  assert.equal(await verifySessionJwt(token, { ...config, secret: 'short' }), null)
  assert.equal(await verifySessionJwt(token, { ...config, secret: secret + 'wrong' }), null)
  assert.equal(await verifySessionJwt(token, { ...config, issuer: 'other' }), null)
  assert.equal(await verifySessionJwt(token, { ...config, audience: 'other' }), null)
  assert.equal(await verifySessionJwt(await signed({ ...claims, exp: seconds - 1 }), config), null)
  assert.equal(await verifySessionJwt(await signed({ ...claims, exp: undefined }), config), null)
  assert.equal(await verifySessionJwt(await signed({ ...claims, exp: String(seconds + 600) }), config), null)
  assert.equal(await verifySessionJwt(await signed({ ...claims, nbf: seconds + 500 }), config), null)
  assert.equal(await verifySessionJwt(await signed({ ...claims, iat: seconds + 500 }), config), null)
  assert.equal(await verifySessionJwt(await signed(claims, { alg: 'none' }), config), null)
  assert.equal(await verifySessionJwt(await signed(claims, { alg: 'HS256', crit: ['custom'] }), config), null)
  const parts = token.split('.'); parts[1] = Buffer.from(JSON.stringify({ ...claims, role: 'ADMIN_COMPANY' })).toString('base64url')
  assert.equal(await verifySessionJwt(parts.join('.'), config), null)
  assert.equal(await verifySessionJwt('malformed', config), null)
  assert.equal(isTokenExpired(await signed({ role: 'ADMIN' })), true)
  const rsa = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
  const publicKey = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(await crypto.subtle.exportKey('spki', rsa.publicKey)).toString('base64')}\n-----END PUBLIC KEY-----`
  const rsaToken = await signed(claims, { alg: 'RS256' }, rsa.privateKey, 'RSASSA-PKCS1-v1_5')
  assert.equal((await verifySessionJwt(rsaToken, { algorithm: 'RS256', publicKey })).sub, 'test-user')
  assert.equal(await verifySessionJwt(token, { algorithm: 'RS256', publicKey }), null)
  assert.equal(await verifySessionJwt(rsaToken, { algorithm: 'HS256', secret: publicKey }), null)
  assert.equal(await verifySessionJwt(token, { ...config, publicKey }), null)
  process.env.NODE_ENV = 'production'
  const { contentSecurityPolicy, securityHeaders } = await import('../lib/security-headers.mjs')
  const csp = contentSecurityPolicy('testnonce')
  const script = csp.split(';').find(v => v.trim().startsWith('script-src'))
  assert.ok(script.includes("'nonce-testnonce'")); assert.ok(script.includes("'strict-dynamic'"))
  assert.ok(!script.includes('unsafe-inline')); assert.ok(!script.includes('unsafe-eval'))
  assert.ok(csp.includes("frame-ancestors 'none'")); assert.ok(csp.includes("object-src 'none'"))
  const headers = Object.fromEntries(securityHeaders().map(h => [h.key, h.value]))
  assert.equal(headers['X-Frame-Options'], 'DENY'); assert.equal(headers['X-Content-Type-Options'], 'nosniff')
  assert.equal(headers['Strict-Transport-Security'], 'max-age=31536000')
  process.env.CSP_DOCUMENT_ORIGINS = 'https://files.example.test'
  assert.ok(contentSecurityPolicy().includes('https://files.example.test'))
  process.env.CSP_DOCUMENT_ORIGINS = "https://files.example.test/path; script-src *"
  assert.throws(() => contentSecurityPolicy())
  delete process.env.CSP_DOCUMENT_ORIGINS
  const pkg = require('../package.json'), lock = require('../package-lock.json')
  for (const group of ['dependencies', 'devDependencies']) for (const [name, version] of Object.entries(pkg[group])) {
    assert.match(version, /^\d+\.\d+\.\d+$/); assert.equal(lock.packages[''][group][name], version); assert.equal(lock.packages[`node_modules/${name}`].version, version)
  }
  const docker = fs.readFileSync(path.resolve(__dirname, '../Dockerfile'), 'utf8')
  assert.ok(docker.includes('USER node')); assert.ok(docker.includes('npm ci')); assert.ok(!docker.includes('else npm install'))
  console.log('Security checks passed: HS256/RS256 signatures, tampering, expiry, claims, fail-closed, CSP, lockfile and Docker')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
