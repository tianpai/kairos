interface InfoRowProps {
  label: string
  value: string | number
}

export function InfoRow({ label, value }: InfoRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-8">
      <span className="text-hint">{label}</span>
      <span className="text-secondary">{value}</span>
    </div>
  )
}
