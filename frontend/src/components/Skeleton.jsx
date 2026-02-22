import { memo } from 'react'

// ── Base shimmer block ─────────────────────────────────────
const Skeleton = memo(function Skeleton({
  width = '100%',
  height = 14,
  radius = 6,
  style,
  className = '',
}) {
  return (
    <div
      className={`skeleton${className ? ` ${className}` : ''}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
})

// ── Mimics the 4-card stat-grid ───────────────────────────
export const SkeletonStatGrid = memo(function SkeletonStatGrid() {
  return (
    <div className="stat-grid">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="stat-box">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <Skeleton height={11} width="55%" style={{ marginBottom: 10 }} />
              <Skeleton height={26} width="42%" style={{ marginBottom: 8 }} />
              <Skeleton height={10} width="62%" />
            </div>
            <Skeleton height={40} width={40} radius={10} />
          </div>
        </div>
      ))}
    </div>
  )
})

// ── Mimics a card with a title + chart area ───────────────
export const SkeletonChart = memo(function SkeletonChart({ height = 240, showTitle = true }) {
  return (
    <div className="card">
      {showTitle && (
        <div className="card-header" style={{ marginBottom: 16 }}>
          <Skeleton height={14} width="32%" />
          <Skeleton height={11} width="20%" style={{ marginTop: 6 }} />
        </div>
      )}
      <Skeleton height={height} width="100%" radius={8} />
    </div>
  )
})

// ── Mimics a data-table ───────────────────────────────────
export const SkeletonTable = memo(function SkeletonTable({ rows = 6, cols = 4 }) {
  const widths = ['75%', '50%', '40%', '25%', '30%', '60%']
  return (
    <div className="card">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }, (_, c) => (
              <th key={c}>
                <Skeleton height={11} width={c === 0 ? '65%' : '45%'} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }, (_, c) => (
                <td key={c}>
                  <Skeleton
                    height={11}
                    width={widths[(r + c) % widths.length]}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

// ── Mimics the connection list rows ───────────────────────
export const SkeletonConnRows = memo(function SkeletonConnRows({ rows = 3 }) {
  return (
    <div className="card">
      <table className="data-table">
        <thead>
          <tr>
            {['Name', 'Type', 'Status', ''].map((h) => (
              <th key={h}>{h && <Skeleton height={11} width="55%" />}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              <td><Skeleton height={11} width="55%" /></td>
              <td><Skeleton height={20} width={72} radius={20} /></td>
              <td><Skeleton height={11} width="40%" /></td>
              <td><Skeleton height={28} width={32} radius={6} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

export default Skeleton
