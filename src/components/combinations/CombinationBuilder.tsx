import { useState } from 'react'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { CombinationCard } from './CombinationCard'
import { Plus, Trash2, Save } from 'lucide-react'
import type { Equipment, EquipmentCombination } from '@/types/equipment'

export function CombinationBuilder() {
  const equipment = useEquipmentStore(state => state.equipment)
  const [selectedEquipment, setSelectedEquipment] = useState<Array<{
    equipment: Equipment,
    quantity: number
  }>>([])
  const [combinationName, setCombinationName] = useState('')
  const [combinationDescription, setCombinationDescription] = useState('')

  const addEquipmentToCombination = (equipmentId: string) => {
    const equipmentItem = equipment.find(e => e.id === equipmentId)
    if (equipmentItem) {
      setSelectedEquipment(prev => [
        ...prev,
        { equipment: equipmentItem, quantity: 1 }
      ])
    }
  }

  const updateQuantity = (index: number, quantity: number) => {
    setSelectedEquipment(prev => {
      const updated = [...prev]
      updated[index].quantity = Math.max(1, quantity)
      return updated
    })
  }

  const removeEquipment = (index: number) => {
    setSelectedEquipment(prev => prev.filter((_, i) => i !== index))
  }

  const calculateTotalCost = () => {
    return selectedEquipment.reduce((total, { equipment, quantity }) => {
      return total + (equipment.acquisitionCost * quantity)
    }, 0)
  }

  const calculatePersonnelRequired = () => {
    return selectedEquipment.reduce((total, { equipment, quantity }) => {
      return total + (equipment.personnelRequired * quantity)
    }, 0)
  }

  const calculateConsumables = () => {
    return selectedEquipment.reduce((acc, { equipment, quantity }) => {
      equipment.consumables.forEach(consumable => {
        const totalUnits = consumable.unitsPerUse * quantity
        const existing = acc.find(c => c.id === consumable.id)
        if (existing) {
          existing.quantity += totalUnits
        } else {
          acc.push({ id: consumable.id, quantity: totalUnits })
        }
      })
      return acc
    }, [] as { id: string, quantity: number }[])
  }

  const saveCombination = () => {
    const combination: EquipmentCombination = {
      id: crypto.randomUUID(),
      name: combinationName,
      description: combinationDescription,
      equipment: selectedEquipment.map(({ equipment, quantity }) => ({
        id: equipment.id,
        quantity
      })),
      totalCost: calculateTotalCost(),
      personnelRequired: calculatePersonnelRequired(),
      consumablesRequired: calculateConsumables(),
      created: new Date().toISOString(),
      usageCount: 0
    }
    
    // Save combination logic here
    console.log('Saving combination:', combination)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Create New Combination</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Combination Name</label>
            <input
              type="text"
              value={combinationName}
              onChange={(e) => setCombinationName(e.target.value)}
              placeholder="Enter combination name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={combinationDescription}
              onChange={(e) => setCombinationDescription(e.target.value)}
              placeholder="Describe the purpose and requirements of this combination"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Add Equipment</label>
            <div className="flex gap-2">
              <select
                onChange={(e) => addEquipmentToCombination(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                defaultValue=""
              >
                <option value="" disabled>Select equipment to add</option>
                {equipment.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.category}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const select = document.querySelector('select') as HTMLSelectElement
                  if (select.value) {
                    addEquipmentToCombination(select.value)
                    select.value = ''
                  }
                }}
                className="mt-1 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedEquipment.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Selected Equipment</h3>
          <div className="space-y-4">
            {selectedEquipment.map(({ equipment, quantity }, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                <div>
                  <h4 className="font-medium">{equipment.name}</h4>
                  <p className="text-sm text-gray-500">{equipment.category}</p>
                  <p className="text-sm text-gray-500">
                    Cost: ${(equipment.acquisitionCost * quantity).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <button
                      onClick={() => updateQuantity(index, quantity - 1)}
                      className="p-1 rounded-l border border-gray-300 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-16 text-center border-t border-b border-gray-300"
                    />
                    <button
                      onClick={() => updateQuantity(index, quantity + 1)}
                      className="p-1 rounded-r border border-gray-300 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeEquipment(index)}
                    className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Total Cost: ${calculateTotalCost().toLocaleString()}
                </p>
                <p className="text-sm font-medium">
                  Personnel Required: {calculatePersonnelRequired()}
                </p>
              </div>

              <button
                onClick={saveCombination}
                disabled={!combinationName || selectedEquipment.length === 0}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                Save Combination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}