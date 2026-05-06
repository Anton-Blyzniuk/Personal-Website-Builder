import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { LogoMark } from '../components/ui/Logo';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { setTokens, setUser } = useAuthStore();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const tokens = await authApi.login(data.email, data.password);
      setTokens(tokens.access, tokens.refresh);
      const user = await usersApi.getProfile();
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      toastError(extractErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 relative transition-theme">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[500px] bg-primary-600/8 dark:bg-primary-600/12 rounded-full blur-3xl pointer-events-none" />

      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <LogoMark className="h-11 w-11 shrink-0 group-hover:scale-105 transition-transform duration-200" />
            <span className="font-bold text-slate-900 dark:text-white text-lg">PWB</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm dark:shadow-card-dark p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
