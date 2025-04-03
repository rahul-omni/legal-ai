'use client'

export function AIWaveform() {
  return (
    <div className="inline-flex items-center gap-1 w-4 h-4">
      <span className="w-[2.5px] h-4 bg-indigo-500 rounded-full animate-wave1"></span>
      <span className="w-[2.5px] h-4 bg-sky-500 rounded-full animate-wave2"></span>
      <span className="w-[2.5px] h-4 bg-indigo-500 rounded-full animate-wave3"></span>
    </div>
  )
} 