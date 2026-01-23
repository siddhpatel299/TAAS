import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Globe, Clock, Calendar, PhoneCall, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';

interface SettingsModalProps {
    onClose: () => void;
    currentSettings: {
        phoneNumber?: string;
        timezone?: string;
        defaultReminderDays?: number;
        defaultReminderTime?: string;
    };
    onSave: () => void;
}

const COMMON_TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona (No DST)' },
    { value: 'America/Anchorage', label: 'Alaska Time' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

export function SettingsModal({ onClose, currentSettings, onSave }: SettingsModalProps) {
    const [phoneNumber, setPhoneNumber] = useState(currentSettings.phoneNumber || '');
    const [timezone, setTimezone] = useState(currentSettings.timezone || 'America/New_York');
    const [defaultReminderDays, setDefaultReminderDays] = useState(currentSettings.defaultReminderDays || 3);
    const [defaultReminderTime, setDefaultReminderTime] = useState(currentSettings.defaultReminderTime || '10:00');
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isTestingSMS, setIsTestingSMS] = useState(false);
    const [error, setError] = useState('');
    const [testMessage, setTestMessage] = useState('');

    const handleSave = async () => {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (phoneNumber && !phoneRegex.test(phoneNumber.replace(/[-()\s]/g, ''))) {
            setError('Please enter a valid phone number (e.g., +1234567890)');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            await api.patch('/auth/profile', {
                phoneNumber: phoneNumber || null,
                timezone,
                defaultReminderDays,
                defaultReminderTime,
            });

            onSave();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestCall = async () => {
        if (!phoneNumber) {
            setError('Please enter a phone number first');
            return;
        }

        // First save the phone number
        setIsTesting(true);
        setError('');
        setTestMessage('');

        try {
            // Save settings first
            await api.patch('/auth/profile', {
                phoneNumber: phoneNumber || null,
                timezone,
                defaultReminderDays,
                defaultReminderTime,
            });

            // Then trigger test call
            const response = await api.post('/call-reminders/test-call');
            setTestMessage(response.data.message || '📞 Test call initiated! Check your phone!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to trigger test call');
        } finally {
            setIsTesting(false);
        }
    };

    const handleTestSMS = async () => {
        if (!phoneNumber) {
            setError('Please enter a phone number first');
            return;
        }

        setIsTestingSMS(true);
        setError('');
        setTestMessage('');

        try {
            // Save settings first
            await api.patch('/auth/profile', {
                phoneNumber: phoneNumber || null,
                timezone,
                defaultReminderDays,
                defaultReminderTime,
            });

            // Then trigger test SMS
            const response = await api.post('/call-reminders/test-sms');
            setTestMessage(response.data.message || '💬 Test SMS sent! Check your phone!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send test SMS');
        } finally {
            setIsTestingSMS(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Call Reminder Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                {testMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        {testMessage}
                    </div>
                )}

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        📞 Configure your default settings for phone call reminders. These will be used for all new subscriptions.
                    </p>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Phone className="w-4 h-4" />
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1234567890"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Include country code (e.g., +1 for US, +44 for UK)
                        </p>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Globe className="w-4 h-4" />
                            Timezone
                        </label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {COMMON_TIMEZONES.map((tz) => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4" />
                            Default Days Before Renewal
                        </label>
                        <select
                            value={defaultReminderDays}
                            onChange={(e) => setDefaultReminderDays(parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="0">Same day</option>
                            <option value="1">1 day before</option>
                            <option value="2">2 days before</option>
                            <option value="3">3 days before</option>
                            <option value="5">5 days before</option>
                            <option value="7">7 days before</option>
                        </select>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Clock className="w-4 h-4" />
                            Default Call Time
                        </label>
                        <input
                            type="time"
                            value={defaultReminderTime}
                            onChange={(e) => setDefaultReminderTime(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Test Buttons */}
                    <div className="border-t border-gray-200 pt-4 space-y-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Test Your Setup</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleTestCall}
                                disabled={isTesting || !phoneNumber}
                                className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <PhoneCall className="w-4 h-4" />
                                {isTesting ? '...' : '📞 Test Call'}
                            </button>
                            <button
                                onClick={handleTestSMS}
                                disabled={isTestingSMS || !phoneNumber}
                                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                {isTestingSMS ? '...' : '💬 Test SMS'}
                            </button>
                        </div>
                        <p className="text-xs text-center text-gray-500">
                            Test call or SMS to verify your phone number works
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !phoneNumber}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
