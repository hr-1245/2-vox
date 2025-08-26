import { ThemeLogo } from "@/_components/atoms/ThemeLogo";
import { LoginForm } from "@/_components/auth/login/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirectIfAuthenticated } from "@/utils/auth/auth-guard";

export default async function LoginPage() {
  await redirectIfAuthenticated();
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2">
      <Card className="flex flex-col justify-center px-8 py-12 md:px-16 lg:px-24 bg-card rounded-none">
        <CardHeader>
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 transform hover:scale-105 transition-transform duration-200">
              <ThemeLogo className="text-center" />
            </div>
            <p className="text-primary font-medium">Messaging Platform</p>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="mt-3 text-center text-sm text-muted-foreground">
            Enter your details to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <div className="text-center text-sm mt-6">
            Don&apos;t have an account?{" "}
            <a
              href="/auth/signup"
              className="text-primary hover:underline cursor-pointer"
            >
              Sign up
            </a>
          </div>
        </CardContent>
      </Card>
      <div className="hidden lg:block relative bg-gradient-to-br from-primary to-secondary min-h-screen">
        <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-background/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
          <h2 className="text-4xl font-bold mb-6 text-center drop-shadow-lg">
            Smart Communication Platform
          </h2>
          <p className="text-xl text-center max-w-lg opacity-90 drop-shadow-md">
            Manage your conversations efficiently with our advanced messaging platform
          </p>
          <div className="absolute bottom-8 left-0 right-0 text-center text-sm opacity-75">
            Powered by AI technology
          </div>
        </div>
      </div>
    </div>
  );
}