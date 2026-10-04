import { ComingSoon } from '@applyfields/ui';

export const metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <ComingSoon
      title="Log in"
      description="Log in with your email or phone number — using a password or a one-time code (OTP)."
      owner="Karthik"
      when="Week 1"
      items={['Email or phone + password', 'Log in with OTP', 'Forgot password', 'Stay signed in securely', 'Link to register']}
    />
  );
}
