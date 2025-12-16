interface ColorPickerFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ColorPickerField({
  label,
  value,
  onChange,
}: ColorPickerFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ml-4 h-10 w-10 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-3 py-2 text-sm"
        />
      </div>
    </div>
  )
}
