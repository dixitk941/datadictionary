import { useState, useEffect, memo } from 'react'
import { CheckCircle2 } from 'lucide-react'

/**
 * StageLoader — shows sequential loading messages so the user knows progress is happening.
 *
 * Props:
 *   stages  – string[]  list of messages in order
 *   interval – number   ms between stage advances (default 1200)
 *   compact  – bool     smaller inline variant (default false)
 */
const StageLoader = memo(function StageLoader({ stages = [], interval = 1200, compact = false }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    setCurrent(0)
  }, [stages])

  useEffect(() => {
    if (current >= stages.length - 1) return
    const t = setTimeout(() => setCurrent((c) => Math.min(c + 1, stages.length - 1)), interval)
    return () => clearTimeout(t)
  }, [current, stages.length, interval])

  if (!stages.length) return null

  if (compact) {
    return (
      <div className="stage-loader-compact">
        <span className="stage-spinner-sm" />
        <span className="stage-msg-compact">{stages[current]}</span>
      </div>
    )
  }

  return (
    <div className="stage-loader">
      <div className="stage-icon-ring">
        <span className="stage-ring-spinner" />
      </div>

      <ul className="stage-list">
        {stages.map((msg, i) => {
          const done    = i < current
          const active  = i === current
          const pending = i > current
          return (
            <li
              key={i}
              className={`stage-item ${done ? 'done' : active ? 'active' : 'pending'}`}
            >
              {done ? (
                <CheckCircle2 size={16} className="stage-check" />
              ) : active ? (
                <span className="stage-dot-spin" />
              ) : (
                <span className="stage-dot-idle" />
              )}
              <span className="stage-text">{msg}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
})

export default StageLoader
