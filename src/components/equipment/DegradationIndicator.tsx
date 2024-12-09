import type { DegradationParams } from '@/types/equipment'

interface DegradationIndicatorProps {
  params: DegradationParams
}

export function DegradationIndicator({ params }: DegradationIndicatorProps) {
  const percentage = (params.currentValue / params.maxValue) * 100
  const getColorClass = (percent: number) => {
    if (percent > 75) return 'bg-green-500'
    if (percent > 50) return 'bg-yellow-500'
    if (percent > 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Equipment Condition</span>
        <span className="font-medium">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div
          className={`h-full rounded-full ${getColorClass(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Type: {params.type}</span>
        <span>Last Updated: {new Date(params.lastUpdated).toLocaleDateString()}</span>
      </div>
    </div>
  )
}