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

// ── AI ────────────────────────────────────────────
export function getAISummary(connId, table, schema) {
  const qs = schema ? `?schema=${encodeURIComponent(schema)}` : ''
  return request(`/ai/${connId}/tables/${encodeURIComponent(table)}/summary${qs}`)
}

// ── Chat ──────────────────────────────────────────
export function sendChatMessage(messages, context = '') {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, context }),
  })
}
