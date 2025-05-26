export default function TestPage() {
    return (
      <div className="min-h-screen bg-blue-500 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Tailwind Test
          </h1>
          <p className="text-gray-600">
            この背景が青色で、このボックスが白色なら、Tailwindは動作しています。
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            テストボタン
          </button>
        </div>
      </div>
    )
  }