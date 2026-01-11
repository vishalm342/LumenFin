import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-slate-800 border border-slate-700"
          }
        }}
        forceRedirectUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
