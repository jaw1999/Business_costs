import { Users, DollarSign, Package, Clock } from 'lucide-react'
import type { EquipmentCombination } from '@/types/equipment'
import { useEquipmentStore } from '@/stores/equipmentStore'

interface CombinationCardProps {
  combination: EquipmentCombination
  onEdit?: () => void
  onDelete?: () => void
}

export function CombinationCard({ combination, onEdit, onDelete }: CombinationCardProps) {
  const equipment = useEquipmentStore(state => state.equipment)

  const getEquipmentDetails = (id: string) => {
    return equipment.find(e => e.id === id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{combination.name}</h3>
          <p className="text-sm text-gray-500">Created: {formatDate(combination.created)}</p>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600">{combination.description}</p>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Equipment List:</h4>
        <div className="space-y-2">
          {combination.equipment.map(({ id, quantity }) => {
            const details = getEquipmentDetails(id)
            return details ? (
              <div key={id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {details.name} ({details.category})
                </span>
                <span className="font-medium">x{quantity}</span>
              </div>
            ) : null
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-600">
          <DollarSign className="w-4 h-4 mr-2" />
          <span>Total Cost: ${combination.totalCost.toLocaleString()}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-2" />
          <span>Personnel: {combination.personnelRequired}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Package className="w-4 h-4 mr-2" />
          <span>Items: {combination.equipment.length}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>Used: {combination.usageCount} times</span>
        </div>
      </div>

      {combination.lastUsed && (
        <div className="text-sm text-gray-500">
          Last used: {formatDate(combination.lastUsed)}
        </div>
      )}
    </div>
  )
}