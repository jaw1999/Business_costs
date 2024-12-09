import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CombinationCard } from './CombinationCard'
import { CombinationBuilder } from './CombinationBuilder'
import type { EquipmentCombination } from '@/types/equipment'

export function CombinationList() {
  const [isCreating, setIsCreating] = useState(false)
  const [combinations, setCombinations] = useState<EquipmentCombination[]>([])
  const [selectedCombination, setSelectedCombination] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this combination?')) {
      setCombinations(prev => prev.filter(c => c.id !== id))
    }
  }

  const handleEdit = (id: string) => {
    setSelectedCombination(id)
  }

  const handleCompleteCreation = (newCombination: EquipmentCombination) => {
    setCombinations(prev => [...prev, newCombination])
    setIsCreating(false)
  }

  const filteredCombinations = combinations
    .filter(combo => {
      const matchesSearch = combo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        combo.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (filterCategory === 'all') return matchesSearch
      return matchesSearch && combo.equipment.some(e => e.id.includes(filterCategory))
    })
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

  if (isCreating) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Create New Combination</h2>
          <button
            onClick={() => setIsCreating(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
        <CombinationBuilder onComplete={handleCompleteCreation} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Combinations</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Combination
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search combinations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-md border-gray-300"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-md border-gray-300"
        >
          <option value="all">All Categories</option>
          <option value="platform">Platforms</option>
          <option value="payload">Payloads</option>
          <option value="sensor">Sensors</option>
        </select>
      </div>

      {/* Combinations List */}
      {filteredCombinations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No combinations found</h3>
          <p className="text-gray-500">
            {combinations.length === 0
              ? "Start by creating your first equipment combination"
              : "No combinations match your search criteria"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCombinations.map(combination => (
            <CombinationCard
              key={combination.id}
              combination={combination}
              onEdit={() => handleEdit(combination.id)}
              onDelete={() => handleDelete(combination.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}