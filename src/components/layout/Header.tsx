import { FileText, Settings } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-2xl font-bold text-gray-900">Staff for Dummies</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Settings className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  )
}