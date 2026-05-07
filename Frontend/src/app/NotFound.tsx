export function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-bold text-slate-200">404</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-2">Page Not Found</h2>
        <p className="text-slate-500 mt-2 mb-6">The page you're looking for doesn't exist.</p>
        <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
          Go Home
        </a>
      </div>
    </div>
  );
}

