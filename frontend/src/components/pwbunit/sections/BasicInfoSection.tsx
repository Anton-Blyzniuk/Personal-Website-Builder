import { UseFormReturn } from 'react-hook-form';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import type { PWBUnitFormData } from '../PWBUnitForm';

export function BasicInfoSection({ form }: { form: UseFormReturn<PWBUnitFormData> }) {
  const { register, formState: { errors } } = form;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          error={errors.first_name?.message}
          {...register('first_name')}
        />
        <Input
          label="Last name"
          error={errors.last_name?.message}
          {...register('last_name')}
        />
      </div>
      <Input
        label="Headline"
        placeholder="Senior Software Engineer"
        hint="Max 120 characters"
        error={errors.headline?.message}
        {...register('headline')}
      />
      <Input
        label="Contact email"
        type="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Phone" placeholder="+1 234 567 8900" {...register('phone')} />
        <Input label="Location" placeholder="New York, NY" {...register('location')} />
      </div>
      <Textarea
        label="About"
        placeholder="A short bio about yourself..."
        rows={5}
        {...register('about')}
      />
    </div>
  );
}
