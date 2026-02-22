import { cache } from '../lib/cache'

// Dev: Vite proxy forwards /api → localhost:8000
// Production (CF Pages): VITE_API_URL=https://api.aitoolcraft.com
const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

// ── TTL constants ──────────────────────────────────
const TTL_CONNECTIONS = 5 * 60_000   // 5 min
const TTL_SCHEMAS     = 5 * 60_000   // 5 min
const TTL_TABLES      = 2 * 60_000   // 2 min
const TTL_ANALYTICS   = 3 * 60_000   // 3 min
const TTL_QUALITY     = 10 * 60_000  // 10 min
const TTL_DETAIL      = 2 * 60_000   // 2 min

// ── Connections ────────────────────────────────────
export function getConnections() {
  return cache.fetch('connections', () => request('/connections'), TTL_CONNECTIONS)
}

export async function createConnection(data) {
  const result = await request('/connections', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  cache.invalidate('connections')
  return result
}

export async function deleteConnection(id) {
  const result = await request(`/connections/${id}`, { method: 'DELETE' })
  cache.invalidate('connections')
  cache.invalidate(`schemas:${id}`)
  cache.invalidate(`tables:${id}`)
  cache.invalidate(`analytics:${id}`)
  cache.invalidate(`detail:${id}`)
  return result
}

// ── Metadata ──────────────────────────────────────
export function getSchemas(connId) {
  return cache.fetch(`schemas:${connId}`, () => request(`/metadata/${connId}/schemas`), TTL_SCHEMAS)
}

export function getTables(connId, schema) {
  const qs = schema ? `?schema=${encodeURIComponent(schema)}` : ''
  return cache.fetch(
    `tables:${connId}:${schema || '__none__'}`,
    () => request(`/metadata/${connId}/tables${qs}`),
    TTL_TABLES
  )
}

export function getTableDetail(connId, table, schema) {
  const qs = schema ? `?schema=${encodeURIComponent(schema)}` : ''
  return cache.fetch(
    `detail:${connId}:${schema || '__none__'}:${table}`,
    () => request(`/metadata/${connId}/tables/${encodeURIComponent(table)}${qs}`),
    TTL_DETAIL
  )
}

// ── Quality ───────────────────────────────────────
export function getQualityReport(connId, table, schema) {
  const qs = schema ? `?schema=${encodeURIComponent(schema)}` : ''
  return cache.fetch(
    `quality:${connId}:${schema || '__none__'}:${table}`,
    () => request(`/quality/${connId}/tables/${encodeURIComponent(table)}${qs}`),
    TTL_QUALITY
  )
}

// ── Analytics ─────────────────────────────────────
export function getAnalytics(connId, schema, refresh = false) {
  const params = new URLSearchParams()
  if (schema) params.set('schema', schema)
  if (refresh) params.set('refresh', 'true')
  const qs = params.toString() ? `?${params}` : ''
  const key = `analytics:${connId}:${schema || '__none__'}`
  if (refresh) cache.invalidate(key)
  return cache.fetch(key, () => request(`/analytics/${connId}${qs}`), TTL_ANALYTICS)
}

// ── AI ────────────────────────────────────────────
export function getAISummary(connId, table, schema, { userProfile, industry } = {}) {
  const params = new URLSearchParams()
  if (schema) params.set('schema', schema)
  if (userProfile) params.set('user_profile', userProfile)
  if (industry) params.set('industry', industry)
  const qs = params.toString() ? `?${params}` : ''
  return request(`/ai/${connId}/tables/${encodeURIComponent(table)}/summary${qs}`)
}

// ── Chat ──────────────────────────────────────────
export function sendChatMessage(messages, context = '', { userProfile, industry, customInstructions } = {}) {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages,
      context,
      user_profile: userProfile || 'beginner',
      industry: industry || '',
      custom_instructions: customInstructions || '',
    }),
  })
}

// ── Enterprise ────────────────────────────────────
export function discoverSystems(connId, schema) {
  const qs = schema ? `?schema=${encodeURIComponent(schema)}` : ''
  return request(`/enterprise/discover/${connId}${qs}`)
}

export function crossMapConnections() {
  return request('/enterprise/cross-map')
}

export function etlPreview(data) {
  return request('/enterprise/etl/preview', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function etlExecute(data) {
  return request('/enterprise/etl/execute', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function listPipelines() {
  return request('/enterprise/pipelines')
}

export function createPipeline(data) {
  return request('/enterprise/pipelines', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function runPipeline(id) {
  return request(`/enterprise/pipelines/${id}/run`, { method: 'POST' })
}

export function deletePipeline(id) {
  return request(`/enterprise/pipelines/${id}`, { method: 'DELETE' })
}

export function listWorkflows() {
  return request('/enterprise/workflows')
}

export function createWorkflow(data) {
  return request('/enterprise/workflows', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function runWorkflow(id) {
  return request(`/enterprise/workflows/${id}/run`, { method: 'POST' })
}

export function toggleWorkflow(id) {
  return request(`/enterprise/workflows/${id}/toggle`, { method: 'POST' })
}

export function deleteWorkflow(id) {
  return request(`/enterprise/workflows/${id}`, { method: 'DELETE' })
}

export function getBusinessInsights(connId, schema, refresh = false) {
  const params = new URLSearchParams()
  if (schema) params.set('schema', schema)
  if (refresh) params.set('refresh', 'true')
  const qs = params.toString() ? `?${params}` : ''
  return request(`/enterprise/insights/${connId}${qs}`)
}
