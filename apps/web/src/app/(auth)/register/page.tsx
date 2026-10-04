import { ComingSoon } from '@applyfields/ui';

export const metadata = { title: 'Register' };

export default function RegisterPage() {
  return (
    <ComingSoon
      title="Create your free account"
      description="Sign up once — then fill your profile so ApplyFields can check your eligibility for every opportunity."
      owner="Karthik"
      when="Week 1"
      items={['Sign up with email or phone', 'Verify with a one-time code', 'Agree to terms and privacy', 'Then complete your profile']}
    />
  );
}
