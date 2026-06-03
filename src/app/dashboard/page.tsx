export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">12</div>
          <div className="text-gray-600">Projects</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">45</div>
          <div className="text-gray-600">Emails</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">8</div>
          <div className="text-gray-600">Contracts</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">23</div>
          <div className="text-gray-600">Action Items</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Welcome to EXECOS Pro</h2>
        <p className="text-gray-600">
          Start by uploading emails to the Email Intel module or creating your first project.
        </p>
      </div>
    </div>
  )
}
