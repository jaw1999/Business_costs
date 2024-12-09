import { Package, Clock, Users } from 'lucide-react'
import type { Equipment } from '@/types/equipment'
import { DegradationIndicator } from './DegradationIndicator'

interface EquipmentCardProps {
  equipment: Equipment
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{equipment.name}</h3>
          <p className="text-sm text-gray-500">{equipment.modelNumber}</p>
        </div>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {equipment.category}
        </span>
      </div>

      <p className="text-sm text-gray-600">{equipment.description}</p>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <Package className="w-4 h-4 mr-2" />
          <span>Quantity: {equipment.quantity}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>In Use: {equipment.inUse}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-2" />
          <span>Personnel Required: {equipment.personnelRequired}</span>
        </div>
      </div>

      <DegradationIndicator params={equipment.degradation} />

      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900">
            Cost: ${equipment.acquisitionCost.toLocaleString()}
          </span>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}