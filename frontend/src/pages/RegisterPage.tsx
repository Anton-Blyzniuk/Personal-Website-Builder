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

const schema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name:  z.string().min(1, 'Last name is required'),
    email:      z.string().email('Invalid email address'),
    password:   z.string().min(8, 'Minimum 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { setTokens, setUser } = useAuthStore();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const tokens = await authApi.register({
        email: data.email, password: data.password,
        first_name: data.first_name, last_name: data.last_name,
      });
      setTokens(tokens.access, tokens.refresh);
      const user = await usersApi.getProfile();
      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      toastError(extractErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-12 relative transition-theme">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[500px] bg-primary-600/8 dark:bg-primary-600/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-4 right-4">
        <ThemeToggle className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <div className="h-11 w-11 rounded-xl bg-primary-600 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-primary transition-all duration-300">
              <span className="text-white text-lg font-bold">P</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">Start building your professional profile</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-sm dark:shadow-card-dark p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First name" autoComplete="given-name" placeholder="Jane" error={errors.first_name?.message} {...register('first_name')} />
              <Input label="Last name"  autoComplete="family-name" placeholder="Doe"  error={errors.last_name?.message}  {...register('last_name')}  />
            </div>
            <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" autoComplete="new-password" placeholder="••••••••" hint="Minimum 8 characters" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm password" type="password" autoComplete="new-password" placeholder="••••••••" error={errors.confirm_password?.message} {...register('confirm_password')} />
            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
