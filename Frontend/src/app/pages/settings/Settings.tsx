import { useState } from 'react';
import { Bell, Moon, Globe, Shield, Sliders, Save, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { SettingRow } from '../../components/common/SettingRow';
import { PageHeader } from '../../components/common/PageHeader';

export default function Settings() {
  const { isDarkMode, toggleDarkMode } = useApp();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    readingReminders: true,
    abnormalAlerts: true,
    billingAlerts: true,
    reminderDay: '1',
    language: 'en',
    currency: 'PKR',
    confidenceThreshold: '75',
    timezone: 'Asia/Karachi',
    twoFactor: false,
  });

  const toggle = (key: keyof typeof settings) => setSettings(p => ({ ...p, [key]: !p[key] }));
  const set = (key: keyof typeof settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSettings(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Settings" subtitle="Customize your SmartMeter experience" />

      {/* Notifications */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Bell size={16} className="text-blue-600" />
          </div>
          <h2 className="font-semibold text-slate-900">Notification Preferences</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <SettingRow label="Email Notifications" desc="Receive notifications via email" checked={settings.emailNotifications} onChange={() => toggle('emailNotifications')} />
          <SettingRow label="Reading Reminders" desc="Monthly reminder to submit meter readings" checked={settings.readingReminders} onChange={() => toggle('readingReminders')} />
          <SettingRow label="Abnormal Usage Alerts" desc="Alert when consumption exceeds 150% of average" checked={settings.abnormalAlerts} onChange={() => toggle('abnormalAlerts')} />
          <SettingRow label="Billing Notifications" desc="Notify when new bill estimate is generated" checked={settings.billingAlerts} onChange={() => toggle('billingAlerts')} />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Monthly Reminder Day</label>
          <div className="flex items-center gap-3">
            <input type="range" min="1" max="31" value={settings.reminderDay} onChange={set('reminderDay')} className="flex-1 accent-blue-600" />
            <span className="text-slate-900 font-medium text-sm w-12 text-center bg-slate-100 px-2 py-1 rounded-lg">{settings.reminderDay}</span>
          </div>
          <p className="text-slate-400 text-xs mt-1">Reminder sent on day {settings.reminderDay} of each month</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
            <Moon size={16} className="text-purple-600" />
          </div>
          <h2 className="font-semibold text-slate-900">Appearance</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <SettingRow label="Dark Mode" desc="Switch to dark theme (coming soon)" checked={isDarkMode} onChange={toggleDarkMode} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Language</label>
            <select value={settings.language} onChange={set('language')} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="en">English</option>
              <option value="ur">اردو (Urdu)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Currency</label>
            <select value={settings.currency} onChange={set('currency')} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="PKR">PKR (Pakistani Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
            <Sliders size={16} className="text-green-600" />
          </div>
          <h2 className="font-semibold text-slate-900">AI Reading Settings</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confidence Threshold</label>
          <div className="flex items-center gap-3">
            <input type="range" min="50" max="100" step="5" value={settings.confidenceThreshold} onChange={set('confidenceThreshold')} className="flex-1 accent-blue-600" />
            <span className={`text-sm font-bold w-12 text-center px-2 py-1 rounded-lg ${
              parseInt(settings.confidenceThreshold) >= 80 ? 'bg-green-100 text-green-700'
              : parseInt(settings.confidenceThreshold) >= 65 ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700'
            }`}>{settings.confidenceThreshold}%</span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Readings below {settings.confidenceThreshold}% confidence will be flagged for admin review
          </p>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-red-600" />
          </div>
          <h2 className="font-semibold text-slate-900">Security</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <SettingRow label="Two-Factor Authentication" desc="Add an extra layer of security (coming soon)" checked={settings.twoFactor} onChange={() => toggle('twoFactor')} />
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
