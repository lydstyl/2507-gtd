import React from 'react'
import { IMPORTANCE_MIN, IMPORTANCE_MAX, IMPORTANCE_QUADRANTS, getImportanceQuadrant } from '../utils/taskUtils'

interface ImportanceSliderProps {
  value: number
  onChange: (value: number) => void
}

/**
 * Importance slider with quadrant indicator (100-499)
 * Shows live urgency/importance status while dragging
 */
export function ImportanceSlider({ value, onChange }: ImportanceSliderProps) {
  const quadrant = getImportanceQuadrant(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value))
  }

  // Gradient pour visualiser les 4 zones : gris → orange → bleu → rouge
  const gradient = `linear-gradient(to right, #9ca3af 0%, #9ca3af 25%, #f97316 25%, #f97316 50%, #3b82f6 50%, #3b82f6 75%, #ef4444 75%, #ef4444 100%)`

  return (
    <div>
      <div className='flex items-center justify-between mb-1'>
        <label htmlFor='importance' className='block text-sm font-medium text-gray-700'>
          Importance: <span className='font-bold'>{value}</span>
        </label>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${quadrant.badgeClass}`}
        >
          {quadrant.emoji} {quadrant.shortLabel}
        </span>
      </div>
      <input
        type='range'
        id='importance'
        name='importance'
        min={IMPORTANCE_MIN}
        max={IMPORTANCE_MAX}
        value={value}
        onChange={handleChange}
        className='w-full h-2 rounded-lg appearance-none cursor-pointer slider'
        style={{ background: gradient }}
      />
      {/* Légende des 4 quadrants */}
      <div className='grid grid-cols-4 gap-1 mt-1 text-[10px] leading-tight'>
        {IMPORTANCE_QUADRANTS.map((q) => (
          <div
            key={q.min}
            className={`text-center px-1 py-0.5 rounded ${value >= q.min && value <= q.max ? q.badgeClass : 'text-gray-400'}`}
            title={`${q.min}-${q.max} : ${q.label}`}
          >
            {q.emoji} {q.shortLabel}
            <div className='text-gray-400 font-normal'>{q.min}-{q.max}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
