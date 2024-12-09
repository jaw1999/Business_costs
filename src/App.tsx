import React from 'react'
import { Layout } from '@/components/layout/Layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  Target, 
  Package, 
  DollarSign, 
  Upload,
  AlertCircle 
} from 'lucide-react'
import { EquipmentList } from '@/components/equipment/EquipmentList'
import { CombinationBuilder } from '@/components/combinations/CombinationBuilder'
import { InventoryDisplay } from '@/components/inventory/InventoryDisplay.tsx'
import { CostCalculator } from '@/components/costs/CostCalculator'
import { PDFUploader } from '@/components/pdf/PDFUploader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useInventoryStore } from '@/stores/inventoryStore'

function App() {
  const equipmentError = useEquipmentStore((state) => state.error)
  const inventoryError = useInventoryStore((state) => state.error)

  return (
    <Layout>
      {/* Error Alerts */}
      {(equipmentError || inventoryError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {equipmentError || inventoryError}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="equipment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="combinations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Combinations
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Costs
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          <EquipmentList />
        </TabsContent>

        <TabsContent value="combinations">
          <CombinationBuilder />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryDisplay />
        </TabsContent>

        <TabsContent value="costs">
          <CostCalculator />
        </TabsContent>

        <TabsContent value="import">
          <PDFUploader />
        </TabsContent>
      </Tabs>
    </Layout>
  )
}

export default App