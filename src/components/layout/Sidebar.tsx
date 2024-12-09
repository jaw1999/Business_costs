import { Database, Target, Package, DollarSign, Upload } from 'lucide-react'

const navigation = [
  { name: 'Equipment Library', icon: Database, href: '#' },
  { name: 'Combinations', icon: Target, href: '#' },
  { name: 'Inventory', icon: Package, href: '#' },
  { name: 'Cost Analysis', icon: DollarSign, href: '#' },
  { name: 'Import Data', icon: Upload, href: '#' },
]

export function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-lg min-h-screen">
      <nav className="mt-5 px-2">
        {navigation.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <item.icon className="mr-3 h-6 w-6" />
            {item.name}
          </a>
        ))}
      </nav>
    </div>
  )
}