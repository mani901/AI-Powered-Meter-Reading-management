import { useNavigate } from 'react-router';
import { Zap, Camera, BarChart3, FileText, Shield, Bell, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const features = [
  { icon: Camera, title: 'AI-Powered Reading', desc: 'Upload a photo of your meter and our Google Gemini AI instantly extracts the reading with a confidence score.', color: 'bg-blue-50 text-blue-600' },
  { icon: BarChart3, title: 'Consumption Analytics', desc: 'Visualize your electricity usage trends with detailed monthly charts and comparisons.', color: 'bg-green-50 text-green-600' },
  { icon: FileText, title: 'Billing Estimation', desc: 'Automatic bill estimation based on NEPRA tariff slabs. Download PDF bills instantly.', color: 'bg-purple-50 text-purple-600' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Get alerts for abnormal consumption, low confidence readings, and monthly reminders.', color: 'bg-amber-50 text-amber-600' },
  { icon: Shield, title: 'Admin Control', desc: 'Full admin panel for reviewing flagged readings, managing users, and updating tariffs.', color: 'bg-red-50 text-red-600' },
  { icon: Zap, title: 'Multi-Meter Support', desc: 'Manage multiple electricity meters for homes, shops, and properties in one dashboard.', color: 'bg-indigo-50 text-indigo-600' },
];

const steps = [
  { step: '01', title: 'Register & Add Meter', desc: 'Create your account and register your electricity meter with its serial number and details.' },
  { step: '02', title: 'Upload Meter Photo', desc: 'Take a photo of your meter dial or display and upload it through our app or mobile browser.' },
  { step: '03', title: 'AI Extracts Reading', desc: 'Google Gemini Vision API analyzes your image and extracts the reading with a confidence score.' },
  { step: '04', title: 'Track & Export', desc: 'View your consumption history, analytics, and download bills as PDF or CSV.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-semibold text-slate-900">SmartMeter</span>
          </div>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-6">
              <Zap size={14} />
              <span>Powered by Google Gemini Vision AI</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Smart Electricity<br />
              <span className="text-blue-400">Meter Reading</span><br />
              Made Effortless
            </h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-2xl">
              Upload a photo of your electricity meter and let AI extract the reading instantly.
              Track consumption, estimate bills, and monitor usage — all in one platform designed for Pakistan's housing societies and utility providers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all group"
              >
                Start For Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-xl font-medium transition-all"
              >
                Login to Dashboard
              </button>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-slate-400">
              {['No installation required', 'Mobile friendly', 'Pakistan NEPRA tariffs'].map(text => (
                <div key={text} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-green-400" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo credentials banner */}
      <div className="bg-blue-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
          <span className="font-medium">Try the demo:</span>
          <div className="flex gap-6">
            <span className="bg-blue-700 px-3 py-1 rounded-md">Admin: <strong>admin@smartmeter.com</strong> / Admin@123</span>
            <span className="bg-blue-700 px-3 py-1 rounded-md">User: <strong>user@test.com</strong> / User@123</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">A complete electricity meter management platform with AI-powered reading extraction and comprehensive analytics.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon size={24} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500">Get started in minutes with our simple 4-step process</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, idx) => (
              <div key={s.step} className="relative">
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-slate-200 -translate-x-4 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mb-4">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Automate Your Meter Readings?</h2>
          <p className="text-slate-400 mb-8">Join housing societies and utility providers already using SmartMeter AI.</p>
          <button
            onClick={() => navigate('/register')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
          >
            Get Started Free <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span>SmartMeter AI v1.0 — Pakistan Electricity Reading System</span>
          </div>
          <span>Built with Google Gemini Vision API • NEPRA Tariff Compliant</span>
        </div>
      </footer>
    </div>
  );
}
