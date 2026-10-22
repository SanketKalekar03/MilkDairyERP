import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/authSchema';
import type { LoginFormData } from '../schemas/authSchema';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Milk, AlertCircle, Lock, Mail } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { isSupabaseConfigured } from '../../../lib/supabase';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [authError, setAuthError] = useState<string | null>(null);

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

  const handleFillDemo = (role: 'admin' | 'operator') => {
    setAuthError(null);
    if (role === 'admin') {
      setValue('email', 'admin@dairyerp.com');
      setValue('password', 'Admin@123456');
    } else {
      setValue('email', 'operator@dairyerp.com');
      setValue('password', 'Operator@123456');
    }
  };

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

          {authError && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-300 rounded text-rose-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{authError}</div>
            </div>
          )}

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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                className="w-full py-2.5"
                isLoading={isSubmitting}
                loadingText="Verifying credentials..."
              >
                Sign In to Dairy ERP
              </Button>
            </div>
          </form>

          {/* Quick Fill Credentials Pills */}
          <div className="mt-6 pt-5 border-t border-[#afc4d4]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#567C8D] mb-2.5 text-center">
              Quick Fill Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="text-left p-2 rounded border border-[#afc4d4] hover:bg-[#F5EFEB] transition-colors"
              >
                <div className="text-xs font-bold text-[#2F4156]">Admin</div>
                <div className="text-[10px] text-[#567C8D] truncate">admin@dairyerp.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('operator')}
                className="text-left p-2 rounded border border-[#afc4d4] hover:bg-[#F5EFEB] transition-colors"
              >
                <div className="text-xs font-bold text-[#2F4156]">Operator</div>
                <div className="text-[10px] text-[#567C8D] truncate">operator@dairyerp.com</div>
              </button>
            </div>
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
