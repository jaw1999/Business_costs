import { useState } from 'react'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { Package, AlertTriangle, TrendingUp, ArrowUpDown } from 'lucide-react'
import type { InventoryTransaction } from '@/types/inventory'
import type { Equipment } from '@/types/equipment'

export function InventoryManager() {
  const equipment = useEquipmentStore(state => state.equipment)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)
  const [transactionType, setTransactionType] = useState<'acquisition' | 'deployment' | 'return' | 'disposal'>('acquisition')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  
  const handleTransaction = () => {
    if (!selectedEquipment) return

    const transaction: InventoryTransaction = {
      id: crypto.randomUUID(),
      equipmentId: selectedEquipment,
      type: transactionType,
      quantity: quantity,
      date: new Date().toISOString(),
      notes: notes
    }

    // In a real app, this would be handled by your inventory store
    console.log('Processing transaction:', transaction)

    // Reset form
    setSelectedEquipment(null)
    setQuantity(1)
    setNotes('')
  }

  const getEquipmentAvailability = (equipment: Equipment) => {
    return {
      available: equipment.quantity - equipment.inUse,
      deployed: equipment.inUse,
      total: equipment.quantity
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Equipment</h3>
              <p className="text-3xl font-bold text-gray-900">{equipment.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ArrowUpDown className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Active Deployments</h3>
              <p className="text-3xl font-bold text-gray-900">
                {equipment.reduce((acc, eq) => acc + eq.inUse, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-10 w-10 text-indigo-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Utilization Rate</h3>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(equipment.reduce((acc, eq) => acc + (eq.inUse / eq.quantity), 0) / equipment.length * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-10 w-10 text-yellow-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
              <p className="text-3xl font-bold text-gray-900">
                {equipment.filter(eq => (eq.quantity - eq.inUse) < 2).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">New Transaction</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleTransaction(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Equipment</label>
                  <select
                    value={selectedEquipment || ''}
                    onChange={(e) => setSelectedEquipment(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select equipment</option>
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as any)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="acquisition">Acquisition</option>
                    <option value="deployment">Deployment</option>
                    <option value="return">Return</option>
                    <option value="disposal">Disposal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Process Transaction
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Equipment Status */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment Status</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deployed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipment.map((eq) => {
                      const availability = getEquipmentAvailability(eq)
                      return (
                        <tr key={eq.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{eq.name}</div>
                            <div className="text-sm text-gray-500">{eq.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              availability.available < 2 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {availability.available}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {availability.deployed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {availability.total}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}