import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/authSchema';
import type { LoginFormData } from '../schemas/authSchema';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Milk,
  AlertCircle,
  Lock,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Database,
  Wrench,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { QUICK_FIX_TOKENS_SQL, COMPLETE_SEED_SQL } from '../constants/seedSql';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [authError, setAuthError] = useState<string | null>(null);
  const [quickRoleLoading, setQuickRoleLoading] = useState<'admin' | 'operator' | null>(null);
  const [copiedType, setCopiedType] = useState<'quick' | 'full' | null>(null);
  const [showSql, setShowSql] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      await login(data.email, data.password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.message || 'Invalid email or password. Please verify your credentials.';
      setAuthError(msg);
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'operator') => {
    setAuthError(null);
    const email = role === 'admin' ? 'admin@dairyerp.com' : 'operator@dairyerp.com';
    const password = role === 'admin' ? 'Admin@123456' : 'Operator@123456';

    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });

    setQuickRoleLoading(role);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Quick login error:', err);
      const msg = err.message || 'Login failed. Please verify credentials.';
      setAuthError(msg);
    } finally {
      setQuickRoleLoading(null);
    }
  };

  const handleCopyQuickFix = async () => {
    try {
      await navigator.clipboard.writeText(QUICK_FIX_TOKENS_SQL);
      setCopiedType('quick');
      setTimeout(() => setCopiedType(null), 3500);
    } catch (err) {
      console.error('Failed to copy quick fix SQL:', err);
    }
  };

  const handleCopyFullSeed = async () => {
    try {
      await navigator.clipboard.writeText(COMPLETE_SEED_SQL);
      setCopiedType('full');
      setTimeout(() => setCopiedType(null), 3500);
    } catch (err) {
      console.error('Failed to copy seed SQL:', err);
    }
  };

  const isSchemaError =
    authError &&
    (authError.toLowerCase().includes('schema') ||
      authError.toLowerCase().includes('database error'));

  const isMissingUserError =
    authError &&
    (authError.toLowerCase().includes('seed') ||
      authError.toLowerCase().includes('invalid email or password') ||
      authError.toLowerCase().includes('invalid login credentials'));

  const isProcessing = isSubmitting || quickRoleLoading !== null;

  return (
    <div className="min-h-screen bg-[#F5EFEB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Name */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-lg bg-[#2F4156] flex items-center justify-center text-white shadow-sm">
            <Milk className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#2F4156]">
          GOKUL DAIRY ERP
        </h2>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-wider text-[#567C8D]">
          Milk Collection & Sales Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded border border-[#afc4d4] shadow-sm">
          {!isSupabaseConfigured && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs flex gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Supabase Keys Required</p>
                <p className="mt-0.5 text-amber-800">
                  Configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> and{' '}
                  <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code> in{' '}
                  <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> to connect with live database.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {authError && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-300 rounded text-rose-900 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">
                  {isSchemaError ? (
                    <span>
                      <strong>Database error querying schema:</strong> The user records in Supabase{' '}
                      <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">auth.users</code> contain{' '}
                      <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">NULL</code> token values.
                      Supabase requires empty strings <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">''</code>.
                    </span>
                  ) : (
                    authError
                  )}
                </div>
              </div>

              {/* Actionable Resolution Buttons */}
              {(isSchemaError || isMissingUserError) && (
                <div className="mt-2 pt-2 border-t border-rose-200 text-rose-800 space-y-2">
                  <p className="font-semibold text-[11px] uppercase tracking-wide text-rose-900 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-rose-700" />
                    <span>Quick Fix (Run in SQL Editor tab):</span>
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {/* Quick Fix Button (Primary when schema error) */}
                    <button
                      type="button"
                      onClick={handleCopyQuickFix}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#2F4156] text-white hover:bg-[#1f2b38] transition-colors cursor-pointer"
                    >
                      {copiedType === 'quick' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied 4-Line Fix SQL!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy 4-Line Fix SQL</span>
                        </>
                      )}
                    </button>

                    <a
                      href={sqlEditorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded border border-[#afc4d4] bg-white text-[#2F4156] hover:bg-gray-50 transition-colors"
                    >
                      <span>Open SQL Tab</span>
                      <ExternalLink className="w-3 h-3 text-[#567C8D]" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowSql(!showSql)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#567C8D] hover:underline ml-auto"
                    >
                      <span>{showSql ? 'Hide SQL' : 'View Fix SQL'}</span>
                      {showSql ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {showSql && (
                    <div className="mt-2 bg-slate-900 text-slate-100 p-2.5 rounded text-[11px] font-mono overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{QUICK_FIX_TOKENS_SQL}</pre>
                    </div>
                  )}

                  <p className="text-[10px] text-rose-700">
                    Switch to your open <strong>SQL Editor</strong> tab, paste the 4 lines, click <strong>Run</strong>, then click <strong>Operator</strong> below.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#567C8D]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={isProcessing}
                  placeholder="admin@dairyerp.com"
                  className="w-full bg-white text-[#2F4156] pl-9 pr-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#2F4156] mb-1.5"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#567C8D]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isProcessing}
                  placeholder="••••••••"
                  className="w-full bg-white text-[#2F4156] pl-9 pr-3 py-2 text-sm rounded border border-[#afc4d4] focus:border-[#567C8D] focus:ring-1 focus:ring-[#567C8D]"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 font-medium"
                isLoading={isSubmitting && quickRoleLoading === null}
                loadingText="Verifying credentials..."
                disabled={isProcessing}
              >
                Sign In to Dairy ERP
              </Button>
            </div>
          </form>

          {/* Quick Sign-In Credential Buttons */}
          <div className="mt-6 pt-5 border-t border-[#afc4d4]">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#567C8D]">
                1-Click Quick Sign In
              </p>
              <span className="text-[10px] text-[#567C8D] bg-[#F5EFEB] px-1.5 py-0.5 rounded border border-[#afc4d4]">
                Auto Logs In
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Admin Quick Login Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleQuickLogin('admin')}
                className={`text-left p-2.5 rounded border transition-colors ${
                  quickRoleLoading === 'admin'
                    ? 'border-[#2F4156] bg-[#C8D9E6]/30'
                    : 'border-[#afc4d4] hover:border-[#2F4156] hover:bg-[#F5EFEB]'
                } ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2F4156]">Admin</span>
                  {quickRoleLoading === 'admin' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F4156]" />
                  ) : (
                    <span className="text-[9px] uppercase font-semibold text-[#567C8D] bg-white px-1 py-0.5 rounded border border-[#afc4d4]">
                      Full Access
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#567C8D] truncate mt-0.5">admin@dairyerp.com</div>
                <div className="text-[10px] text-[#2F4156] font-mono mt-1 opacity-75">
                  {quickRoleLoading === 'admin' ? 'Logging in...' : 'Click to Log In →'}
                </div>
              </button>

              {/* Operator Quick Login Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleQuickLogin('operator')}
                className={`text-left p-2.5 rounded border transition-colors ${
                  quickRoleLoading === 'operator'
                    ? 'border-[#2F4156] bg-[#C8D9E6]/30'
                    : 'border-[#afc4d4] hover:border-[#2F4156] hover:bg-[#F5EFEB]'
                } ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2F4156]">Operator</span>
                  {quickRoleLoading === 'operator' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F4156]" />
                  ) : (
                    <span className="text-[9px] uppercase font-semibold text-[#567C8D] bg-white px-1 py-0.5 rounded border border-[#afc4d4]">
                      Shift Desk
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#567C8D] truncate mt-0.5">operator@dairyerp.com</div>
                <div className="text-[10px] text-[#2F4156] font-mono mt-1 opacity-75">
                  {quickRoleLoading === 'operator' ? 'Logging in...' : 'Click to Log In →'}
                </div>
              </button>
            </div>
          </div>

          {/* Database Setup Helper Pill */}
          <div className="mt-4 pt-3 border-t border-[#afc4d4]/60 flex items-center justify-between text-[11px] text-[#567C8D]">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-[#567C8D]" />
              <span>Database seed script</span>
            </span>
            <button
              type="button"
              onClick={handleCopyFullSeed}
              className="text-[#2F4156] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedType === 'full' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Seed SQL Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Complete Seed SQL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-xs text-[#567C8D]">
          Protected by Supabase Auth & PostgreSQL Row-Level Security
        </p>
      </div>
    </div>
  );
};
