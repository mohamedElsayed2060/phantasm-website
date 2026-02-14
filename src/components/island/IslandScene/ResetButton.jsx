'use client'

export default function ResetButton({ onReset }) {
  return (
    <div className="absolute left-4 top-4 flex items-center gap-2">
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onReset?.()
        }}
        className="rounded-full px-3 py-1 text-xs text-white/90"
        style={{
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.14)',
          backdropFilter: 'blur(10px)',
        }}
      >
        Reset discovered
      </button>
    </div>
  )
}
