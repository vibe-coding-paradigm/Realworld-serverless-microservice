import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-green-600">conduit</h1>
            <nav className="flex items-center space-x-4">
              <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Sign in</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Sign up</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16 bg-green-500 text-white mb-8 rounded-lg">
          <h2 className="text-4xl font-bold mb-4">conduit</h2>
          <p className="text-xl">A place to share your knowledge.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Articles</h3>
              <p className="text-gray-600">No articles are here... yet.</p>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Popular Tags</h3>
              <p className="text-gray-600">No tags are here... yet.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App