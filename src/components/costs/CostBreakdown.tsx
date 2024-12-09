import { ArrowDown, ArrowUp } from 'lucide-react'

interface CostProjection {
  month: string
  equipmentCosts: number
  operationalCosts: number
  maintenanceCosts: number
  personnelCosts: number
  total: number
}

interface CostBreakdownProps {
  projections: CostProjection[]
}

export function CostBreakdown({ projections }: CostBreakdownProps) {
  const totalCosts = {
    equipment: projections.reduce((acc, proj) => acc + proj.equipmentCosts, 0),
    operational: projections.reduce((acc, proj) => acc + proj.operationalCosts, 0),
    maintenance: projections.reduce((acc, proj) => acc + proj.maintenanceCosts, 0),
    personnel: projections.reduce((acc, proj) => acc + proj.personnelCosts, 0),
  }

  const grandTotal = Object.values(totalCosts).reduce((acc, val) => acc + val, 0)

  const calculatePercentage = (value: number) => ((value / grandTotal) * 100).toFixed(1)

  const calculateTrend = (costType: keyof typeof totalCosts) => {
    if (projections.length < 2) return 0
    const firstMonth = projections[0][`${costType}Costs`]
    const lastMonth = projections[projections.length - 1][`${costType}Costs`]
    return ((lastMonth - firstMonth) / firstMonth) * 100
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const CostRow = ({ 
    title, 
    amount, 
    trend 
  }: { 
    title: string
    amount: number
    trend: number 
  }) => (
    <div className="py-4 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500">{calculatePercentage(amount)}% of total</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{formatCurrency(amount)}</p>
          <div className={`flex items-center text-sm ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend !== 0 && (
              trend > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
            )}
            <span>{Math.abs(trend).toFixed(1)}% {trend > 0 ? 'increase' : trend < 0 ? 'decrease' : 'no change'}</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Cost Breakdown</h3>
        <p className="text-sm text-gray-500">Detailed analysis of projected costs</p>
      </div>

      <div className="px-6 py-4">
        <CostRow 
          title="Equipment Costs"
          amount={totalCosts.equipment}
          trend={calculateTrend('equipment')}
        />
        <CostRow
          title="Operational Costs"
          amount={totalCosts.operational}
          trend={calculateTrend('operational')}
        />
        <CostRow
          title="Maintenance Costs"
          amount={totalCosts.maintenance}
          trend={calculateTrend('maintenance')}
        />
        <CostRow
          title="Personnel Costs"
          amount={totalCosts.personnel}
          trend={calculateTrend('personnel')}
        />

        <div className="mt-4 pt-4 border-t-2 border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-base font-semibold text-gray-900">Total Projected Costs</h4>
              <p className="text-sm text-gray-500">All costs combined</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
        <div className="text-sm text-gray-500">
          <p>* Projections are based on current equipment data and historical trends</p>
          <p>* Personnel costs include standard rates for required staff</p>
        </div>
      </div>
    </div>
  )
}