const BASE = '/api'

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

// ── Connections ────────────────────────────────────
export function getConnections() {
  return request('/connections')
}

export function createConnection(data) {
  return request('/connections', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteConnection(id) {
  return request(`/connections/${id}`, { method: 'DELETE' })
}

// ── Metadata ──────────────────────────────────────
export function getSchemas(connId) {
  return request(`/metadata/${connId}/schemas`)
}

export function getTables(connId, schema) {
  const qs = schema ? `?schema=${encodeURIComponent(schema)}` : ''
  return request(`/metadata/${connId}/tables${qs}`)
}

export function getTableDetail(connId, table, schema) {
  const qs = schema ? `?schema=${encodeURIComponent(schema)}` : ''
  return request(`/metadata/${connId}/tables/${encodeURIComponent(table)}${qs}`)
}

// ── Quality ───────────────────────────────────────
export function getQualityReport(connId, table, schema) {
  const qs = schema ? `?schema=${encodeURIComponent(schema)}` : ''
  return request(`/quality/${connId}/tables/${encodeURIComponent(table)}${qs}`)
}

// ── Analytics ─────────────────────────────────────
export function getAnalytics(connId, schema, refresh = false) {
  const params = new URLSearchParams()
  if (schema) params.set('schema', schema)
  if (refresh) params.set('refresh', 'true')
  const qs = params.toString() ? `?${params}` : ''
  return request(`/analytics/${connId}${qs}`)
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
