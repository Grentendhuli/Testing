import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, Building2, Phone, Mail, MapPin, Bot, Edit2, Save, X, Lock, 
  Bell, Trash2, AlertTriangle, CheckCircle, Shield, Copy, Check, 
  Palette, Clock, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/Button';
import { Card, MetricCard } from '../components/Card';
import { PageHeader } from '../components/Breadcrumb';
import { useToast } from '../components/Toast';
import { useApp } from '../context/AppContext';
import { useAuth } from '@/features/auth';
import { debounce } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { AIToneSettings } from '../components/AIToneSettings';
import { FeedbackSection } from '../components/FeedbackSection';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  sms: boolean;
}

export function Profile() {
  const { user, updateUser } = useApp();
  const { userData, updateUserData, logout } = useAuth();
  const { success, error: showError } = useToast();
  
  // Edit states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  
  // Form state
  const [profileForm, setProfileForm] = useState({
    email: user?.email || '',
    phoneNumber: userData?.phone_number || '',
    propertyAddress: userData?.property_address || '',
    firstName: userData?.first_name || '',
    lastName: userData?.last_name || '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: 'emergency', label: 'Emergency Alerts', description: 'Heat, water, or safety issues', email: true, sms: true },
    { id: 'leads', label: 'New Lead Notifications', description: 'When a potential tenant inquires', email: true, sms: false },
    { id: 'maintenance', label: 'Maintenance Requests', description: 'Non-urgent repairs', email: true, sms: false },
    { id: 'billing', label: 'Billing & Invoices', description: 'Payment confirmations', email: true, sms: true },
    { id: 'updates', label: 'Product Updates', description: 'New features', email: true, sms: false },
  ]);

  // Sync form with userData
  useEffect(() => {
    if (userData) {
      setProfileForm(prev => ({
        ...prev,
        firstName: userData.first_name || prev.firstName,
        lastName: userData.last_name || prev.lastName,
        phoneNumber: userData.phone_number || prev.phoneNumber,
        propertyAddress: userData.property_address || prev.propertyAddress,
      }));
    }
  }, [userData]);

  // Auto-save function
  const autoSave = useCallback(
    debounce(async (field: string, value: string) => {
      setIsSaving(true);
      try {
        const updateData: Record<string, string> = {};
        
        switch (field) {
          case 'firstName':
            updateData.first_name = value;
            break;
          case 'lastName':
            updateData.last_name = value;
            break;
          case 'phoneNumber':
            updateData.phone_number = value;
            break;
          case 'propertyAddress':
            updateData.property_address = value;
            break;
        }

        const { error } = await updateUserData(updateData);
        if (error) throw error;
        
        success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
      } catch (err) {
        showError(`Failed to update ${field}`);
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [updateUserData, success, showError]
  );

  const handleFieldChange = (field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    autoSave(field, value);
  };

  const handleSaveField = async (field: string) => {
    setIsSaving(true);
    try {
      const updateData: Record<string, string> = {};
      
      switch (field) {
        case 'firstName':
          updateData.first_name = profileForm.firstName;
          break;
        case 'lastName':
          updateData.last_name = profileForm.lastName;
          break;
        case 'phoneNumber':
          updateData.phone_number = profileForm.phoneNumber;
          break;
        case 'propertyAddress':
          updateData.property_address = profileForm.propertyAddress;
          break;
      }

      const { error } = await updateUserData(updateData);
      if (error) throw error;
      
      success('Changes saved');
      setEditingField(null);
    } catch (err) {
      showError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('weak_password')) {
          setPasswordError('Password is too weak. Please use a stronger password.');
        } else {
          setPasswordError(error.message);
        }
        return;
      }
      
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
      success('Password updated successfully');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password. Please try again.');
    }
  };

  const toggleNotification = (id: string, type: 'email' | 'sms') => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === id ? { ...n, [type]: !n[type] } : n
      )
    );
  };

  const copyBotPhone = () => {
    navigator.clipboard.writeText(user?.botPhoneNumber || '');
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
    success('Phone number copied to clipboard');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE' || isDeleting) return;
    setIsDeleting(true);
    try {
      // First, delete user data from the database
      if (user?.id) {
        // Delete related records first (cascade delete should handle this, but being explicit)
        await (supabase as any).from('units').delete().eq('user_id', user.id);
        await (supabase as any).from('leases').delete().eq('user_id', user.id);
        await (supabase as any).from('payments').delete().eq('user_id', user.id);
        await (supabase as any).from('maintenance_requests').delete().eq('user_id', user.id);
        await (supabase as any).from('leads').delete().eq('user_id', user.id);
        await (supabase as any).from('users').delete().eq('id', user.id);
      }
      
      // Then delete the auth user
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
      if (error) {
        // If admin delete fails, try regular user delete
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
        if (signOutError) throw signOutError;
      }
      
      setShowDeleteModal(false);
      setDeleteConfirm('');
      await logout();
      window.location.href = '/login';
    } catch (err: any) {
      console.error('Delete account error:', err);
      showError('Failed to delete account. Please contact support for assistance.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Inline edit field component
  const InlineEditField = ({ 
    label, 
    field, 
    value, 
    type = 'text',
    icon: Icon 
  }: { 
    label: string; 
    field: string; 
    value: string; 
    type?: string;
    icon: React.ElementType;
  }) => {
    const isEditing = editingField === field;
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    return (
      <div className="group">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {label}
          </label>
          
          {!isEditing && (
            <button
              onClick={() => setEditingField(field)}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-500 transition-all"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type={type}
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveField(field);
                if (e.key === 'Escape') setEditingField(null);
              }}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-amber-500/50 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
            />
            <button
              onClick={() => handleSaveField(field)}
              disabled={isSaving}
              className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setEditingField(null)}
              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => setEditingField(field)}
            className="px-3 py-2 -mx-3 rounded-lg cursor-text hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group-hover:pr-8"
          >
            <span className="text-slate-900 dark:text-slate-100">
              {value || <span className="text-slate-400 italic">Click to add {label.toLowerCase()}</span>}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 px-6 py-6">
      <PageHeader
        title="Profile & Settings"
        description="Manage your account and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card with Inline Editing */}
          <Card variant="elevated">
            <div className="p-6">
              <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center"
                >
                  <span className="text-3xl font-bold text-slate-900">
                    {(profileForm.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </span>
                </motion.div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {profileForm.firstName} {profileForm.lastName}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">Property Owner</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                <InlineEditField
                  label="First Name"
                  field="firstName"
                  value={profileForm.firstName}
                  icon={User}
                />
                
                <InlineEditField
                  label="Last Name"
                  field="lastName"
                  value={profileForm.lastName}
                  icon={User}
                />
                
                <InlineEditField
                  label="Email"
                  field="email"
                  value={profileForm.email}
                  type="email"
                  icon={Mail}
                />
                
                <InlineEditField
                  label="Phone"
                  field="phoneNumber"
                  value={profileForm.phoneNumber}
                  type="tel"
                  icon={Phone}
                />
                
                <div className="sm:col-span-2">
                  <InlineEditField
                    label="Property Address"
                    field="propertyAddress"
                    value={profileForm.propertyAddress}
                    icon={MapPin}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Change Password */}
          <Card variant="elevated">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Lock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h2 className="font-medium text-slate-900 dark:text-slate-100">Change Password</h2>
                  <p className="text-sm text-slate-500">Update your account password</p>
                </div>
              </div>

              <AnimatePresence>
                {passwordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-400">Password updated successfully</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400">{passwordError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter your current password"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Min 8 characters"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>
                
                <Button
                  variant="secondary"
                  onClick={handleChangePassword}
                  icon={<Lock className="w-4 h-4" />}
                >
                  Update Password
                </Button>
              </div>
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card variant="elevated">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h2 className="font-medium text-slate-900 dark:text-slate-100">Notification Preferences</h2>
                  <p className="text-sm text-slate-500">Choose how you want to be notified</p>
                </div>
              </div>

              <div className="space-y-4">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    whileHover={{ x: 4 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{notification.label}</p>
                      <p className="text-sm text-slate-500">{notification.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notification.email}
                          onChange={() => toggleNotification(notification.id, 'email')}
                          className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                        <Mail className="w-4 h-4 text-slate-400" />
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notification.sms}
                          onChange={() => toggleNotification(notification.id, 'sms')}
                          className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                        <Phone className="w-4 h-4 text-slate-400" />
                      </label>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>

          {/* Theme */}
          <Card variant="elevated">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Palette className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h2 className="font-medium text-slate-900 dark:text-slate-100">Interface Theme</h2>
                  <p className="text-sm text-slate-500">Choose your preferred appearance</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </Card>

          {/* AI Tone Settings */}
          <AIToneSettings variant="card" />

          {/* Feedback Section */}
          <FeedbackSection variant="card" />

          {/* Danger Zone */}
          <Card variant="outlined" className="border-red-200 dark:border-red-900/50">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="font-medium text-red-600 dark:text-red-400">Danger Zone</h2>
                  <p className="text-sm text-red-600/70">Irreversible account actions</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Delete Account</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Bot Info & Quick Stats */}
        <div className="space-y-6">
          {/* Bot Phone Card */}
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Bot className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-medium text-amber-600 dark:text-amber-400">Your Bot Phone</h3>
                  <p className="text-sm text-slate-500">Tenants text this number</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 rounded-lg p-4 mb-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-mono text-slate-900 dark:text-slate-100">
                    {user?.botPhoneNumber || '—'}
                  </span>
                  <button
                    onClick={copyBotPhone}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Copy phone number"
                  >
                    {showCopied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-500">
                  <span className="text-amber-500 font-medium">Tip:</span> Share this number on:
                </p>
                <ul className="text-sm text-slate-500 space-y-1 ml-4">
                  <li>• Rental listings</li>
                  <li>• Building signage</li>
                  <li>• Welcome packets</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Account Status */}
          <Card variant="elevated">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">Account Status</h3>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Plan</span>
                  <span className="text-emerald-500 font-medium">Completely Free</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Member Since</span>
                  <span className="text-slate-900 dark:text-slate-100">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  ✓ All features unlocked<br />
                  ✓ Unlimited properties<br />
                  ✓ No credit card required
                </p>
              </div>
            </div>
          </Card>

          {/* Security Tips */}
          <Card variant="elevated">
            <div className="p-6">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Security Tips</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Use a unique password</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Enable email notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Keep your bot phone private</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Delete Account</h3>
              </div>
              
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                This will permanently delete your account and all data:
              </p>
              
              <ul className="text-sm text-slate-500 space-y-1 mb-4 ml-4">
                <li>• All tenant messages</li>
                <li>• Unit information</li>
                <li>• Lead data</li>
                <li>• Billing history</li>
              </ul>

              <p className="text-sm text-slate-500 mb-4">
                Type <span className="text-red-500 font-mono">DELETE</span> to confirm:
              </p>

              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />

              <div className="flex items-center gap-3">
                <Button
                  variant="danger"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || isDeleting}
                  loading={isDeleting}
                  className="flex-1"
                >
                  Delete Permanently
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirm('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Profile;
