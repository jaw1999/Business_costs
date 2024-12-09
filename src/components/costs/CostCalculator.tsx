import { useState } from 'react'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { CostBreakdown } from './CostBreakdown'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calculator, DollarSign, TrendingUp, Clock, FileText } from 'lucide-react'

interface CostProjection {
  month: string
  equipmentCosts: number
  operationalCosts: number
  maintenanceCosts: number
  personnelCosts: number
  total: number
}

export function CostCalculator() {
  const equipment = useEquipmentStore(state => state.equipment)
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [includeOperational, setIncludeOperational] = useState(true)
  const [includeMaintenance, setIncludeMaintenance] = useState(true)
  const [includePersonnel, setIncludePersonnel] = useState(true)

  // Generate sample projection data
  const generateProjections = (months: number): CostProjection[] => {
    const projections: CostProjection[] = []
    const baseEquipmentCost = equipment.reduce((acc, eq) => acc + eq.acquisitionCost, 0)
    const baseOperationalCost = baseEquipmentCost * 0.1 // 10% of equipment cost
    const baseMaintenanceCost = baseEquipmentCost * 0.05 // 5% of equipment cost
    const basePersonnelCost = equipment.reduce((acc, eq) => acc + (eq.personnelRequired * 5000), 0) // $5000 per person per month

    for (let i = 0; i < months; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() + i)
      
      const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' })
      const equipmentCosts = baseEquipmentCost / 12 // Spread across the year
      const operationalCosts = includeOperational ? baseOperationalCost : 0
      const maintenanceCosts = includeMaintenance ? baseMaintenanceCost * (1 + i * 0.02) : 0 // Increasing maintenance costs
      const personnelCosts = includePersonnel ? basePersonnelCost : 0
      
      projections.push({
        month: monthName,
        equipmentCosts,
        operationalCosts,
        maintenanceCosts,
        personnelCosts,
        total: equipmentCosts + operationalCosts + maintenanceCosts + personnelCosts
      })
    }

    return projections
  }

  const projections = generateProjections(timeframe === 'monthly' ? 12 : timeframe === 'quarterly' ? 4 : 1)
  const totalCost = projections.reduce((acc, proj) => acc + proj.total, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Projected Cost</h3>
              <p className="text-3xl font-bold text-gray-900">
                ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calculator className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Equipment Items</h3>
              <p className="text-3xl font-bold text-gray-900">{equipment.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-10 w-10 text-yellow-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Personnel Required</h3>
              <p className="text-3xl font-bold text-gray-900">
                {equipment.reduce((acc, eq) => acc + eq.personnelRequired, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50"
             onClick={() => { /* Generate report logic */ }}>
          <div className="flex items-center">
            <FileText className="h-10 w-10 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Generate Report</h3>
              <p className="text-sm text-gray-500">Export detailed cost analysis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeOperational}
                onChange={(e) => setIncludeOperational(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Operational Costs</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeMaintenance}
                onChange={(e) => setIncludeMaintenance(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Maintenance Costs</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includePersonnel}
                onChange={(e) => setIncludePersonnel(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Personnel Costs</span>
            </label>
          </div>
        </div>
      </div>

      {/* Cost Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Projections</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projections}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="equipmentCosts" name="Equipment" stroke="#3B82F6" />
              {includeOperational && (
                <Line type="monotone" dataKey="operationalCosts" name="Operational" stroke="#10B981" />
              )}
              {includeMaintenance && (
                <Line type="monotone" dataKey="maintenanceCosts" name="Maintenance" stroke="#F59E0B" />
              )}
              {includePersonnel && (
                <Line type="monotone" dataKey="personnelCosts" name="Personnel" stroke="#8B5CF6" />
              )}
              <Line type="monotone" dataKey="total" name="Total" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <CostBreakdown projections={projections} />
    </div>
  )
}