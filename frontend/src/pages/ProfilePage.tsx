import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Camera, Shield, Info } from 'lucide-react';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../lib/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { PageSpinner } from '../components/ui/Spinner';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name:  z.string().min(1, 'Required'),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password:     z.string().min(8, 'Minimum 8 characters'),
  confirm_password: z.string().min(1, 'Required'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match', path: ['confirm_password'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { setUser } = useAuthStore();
  const { success, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: usersApi.getProfile });

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (profile) profileForm.reset({ first_name: profile.first_name, last_name: profile.last_name });
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => usersApi.updateProfile(data),
    onSuccess: (u) => { setUser(u); success('Profile updated'); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => { const f = new FormData(); f.append('profile_picture', file); return usersApi.updateProfile(f); },
    onSuccess: (u) => { setUser(u); success('Profile picture updated'); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  const changePassword = useMutation({
    mutationFn: (d: PasswordForm) => usersApi.changePassword(d.current_password, d.new_password),
    onSuccess: () => { success('Password changed'); passwordForm.reset(); },
    onError: (err) => toastError(extractErrorMessage(err)),
  });

  if (isLoading) return <DashboardLayout><PageSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="page-enter">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">Manage your account information</p>
        </div>

        <div className="space-y-5 max-w-2xl stagger-children">
          {/* Avatar card */}
          <Card>
            <CardHeader><CardTitle>Profile picture</CardTitle></CardHeader>
            <div className="flex items-center gap-5">
              <div className="relative group">
                {avatarPreview || profile?.profile_picture ? (
                  <img src={avatarPreview ?? profile!.profile_picture!} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                    <span className="text-white text-2xl font-semibold">{profile?.first_name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-500 hover:shadow-glow-sm transition-all duration-200 active:scale-[0.92]"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">{profile?.email}</p>
                <button onClick={() => fileRef.current?.click()} className="mt-2 text-xs text-primary-500 hover:text-primary-400 transition-colors">
                  Change photo
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setAvatarPreview(URL.createObjectURL(f)); uploadAvatar.mutate(f); }
                }}
              />
            </div>
          </Card>

          {/* Basic info */}
          <Card>
            <CardHeader><CardTitle>Basic information</CardTitle></CardHeader>
            <form onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First name" error={profileForm.formState.errors.first_name?.message} {...profileForm.register('first_name')} />
                <Input label="Last name"  error={profileForm.formState.errors.last_name?.message}  {...profileForm.register('last_name')}  />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  {profile?.email} — cannot be changed
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={updateProfile.isPending}>Save changes</Button>
              </div>
            </form>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-500 dark:text-slate-500" />
                  Change password
                </span>
              </CardTitle>
            </CardHeader>
            <form onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))} className="space-y-4">
              <Input label="Current password" type="password" autoComplete="current-password" error={passwordForm.formState.errors.current_password?.message} {...passwordForm.register('current_password')} />
              <Input label="New password" type="password" autoComplete="new-password" hint="Minimum 8 characters" error={passwordForm.formState.errors.new_password?.message} {...passwordForm.register('new_password')} />
              <Input label="Confirm new password" type="password" autoComplete="new-password" error={passwordForm.formState.errors.confirm_password?.message} {...passwordForm.register('confirm_password')} />
              <div className="flex justify-end">
                <Button type="submit" loading={changePassword.isPending}>Change password</Button>
              </div>
            </form>
          </Card>

          {/* Account details */}
          <Card>
            <CardHeader><CardTitle>Account details</CardTitle></CardHeader>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Member since', value: profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString() : '—' },
                { label: 'Last login',   value: profile?.last_login   ? new Date(profile.last_login).toLocaleString()     : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                  <dt className="text-slate-500 dark:text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-200">{value}</dd>
                </div>
              ))}
              {profile?.is_staff && (
                <div className="flex justify-between items-center py-1">
                  <dt className="text-slate-500 dark:text-slate-500">Role</dt>
                  <dd>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {profile.is_superuser ? 'Superuser' : 'Staff'}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
