import { useState } from 'react'
import { Plus } from 'lucide-react'
import { EquipmentCard } from './EquipmentCard'
import { EquipmentForm } from './EquipmentForm'
import { useEquipmentStore } from '@/stores/equipmentStore'

export function EquipmentList() {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const equipment = useEquipmentStore(state => state.equipment)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Library</h2>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Equipment
        </button>
      </div>

      {isAddingNew && (
        <EquipmentForm onClose={() => setIsAddingNew(false)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((item) => (
          <EquipmentCard key={item.id} equipment={item} />
        ))}
      </div>
    </div>
  )
}