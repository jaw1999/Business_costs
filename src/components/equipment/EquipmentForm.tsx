import { useState } from 'react'
import { useEquipmentStore } from '@/stores/equipmentStore'
import type { Equipment, EquipmentCategory } from '@/types/equipment'

interface EquipmentFormProps {
  equipment?: Equipment
  onClose: () => void
}

const initialState: Partial<Equipment> = {
  name: '',
  description: '',
  category: 'platform',
  manufacturer: '',
  modelNumber: '',
  acquisitionCost: 0,
  quantity: 0,
  personnelRequired: 0,
  degradation: {
    type: 'cycles',
    maxValue: 100,
    currentValue: 100,
    replacementCost: 0,
    degradationRate: 1,
    lastUpdated: new Date().toISOString()
  }
}

export function EquipmentForm({ equipment, onClose }: EquipmentFormProps) {
  const [formData, setFormData] = useState(equipment || initialState)
  const addEquipment = useEquipmentStore(state => state.addEquipment)
  const updateEquipment = useEquipmentStore(state => state.updateEquipment)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (equipment) {
      updateEquipment(formData as Equipment)
    } else {
      addEquipment({
        ...formData,
        id: crypto.randomUUID(),
        dateAdded: new Date().toISOString(),
        inUse: 0,
        consumables: [],
        specifications: {},
        documents: []
      } as Equipment)
    }
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="platform">Platform</option>
            <option value="payload">Payload</option>
            <option value="sensor">Sensor</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
          <input
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Model Number</label>
          <input
            type="text"
            name="modelNumber"
            value={formData.modelNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Acquisition Cost</label>
          <input
            type="number"
            name="acquisitionCost"
            value={formData.acquisitionCost}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Personnel Required</label>
          <input
            type="number"
            name="personnelRequired"
            value={formData.personnelRequired}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="0"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
        >
          {equipment ? 'Update' : 'Add'} Equipment
        </button>
      </div>
    </form>
  )
}