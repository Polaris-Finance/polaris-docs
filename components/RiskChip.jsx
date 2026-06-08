const labels = {
  high: 'High risk',
  low: 'Lower risk',
  moderate: 'Moderate risk'
}

export function RiskChip({ level = 'moderate' }) {
  const normalized = labels[level] ? level : 'moderate'

  return (
    <span className={`pl-risk-chip pl-risk-${normalized}`}>
      <span className="pl-risk-dot" aria-hidden="true" />
      {labels[normalized]}
    </span>
  )
}
