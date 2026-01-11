import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-slate-800 border border-slate-700"
          }
        }}
        forceRedirectUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
        signInUrl="/sign-in"
      />
    </div>
  );
}
