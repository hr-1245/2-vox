"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { login, resetPassword } from "@/app/auth/actions/auth";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSocket } from "../../../../context/SocketProvider";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Better error message mapping
const getErrorMessage = (error: string): string => {
  if (error.includes("Invalid login credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (error.includes("Email not confirmed")) {
    return "Please check your email and click the confirmation link before signing in.";
  }
  if (error.includes("Too many requests")) {
    return "Too many login attempts. Please wait a few minutes and try again.";
  }
  if (error.includes("Network")) {
    return "Network error. Please check your connection and try again.";
  }
  return error || "Something went wrong. Please try again.";
};

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [isResetPending, setIsResetPending] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState(false);

  const { connectWithSocket } = useSocket();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  React.useEffect(() => {
    const emailInput = document.querySelector(
      'input[name="email"]'
    ) as HTMLInputElement;
    if (emailInput) emailInput.focus();
  }, []);

  const onSubmit = async (values: LoginFormValues) => {
    console.log("logingin in .....");

    setErrorMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      console.log("before login");

      const result = await login(formData);

      console.log("after login", result);

      if (result && "success" in result) {
        connectWithSocket(result.access_token);

        // ✅ Navigate from client component
        router.push("/dashboard"); // or ROUTES.dashboard
      }

      if (result && "error" in result) {
        setErrorMessage(getErrorMessage(result.error));
      }
    });
  };

  const handleResetPassword = async (values: ResetPasswordFormValues) => {
    setIsResetPending(true);

    const formData = new FormData();
    formData.append("email", values.email);

    try {
      const result = await resetPassword(formData);

      if (result && "error" in result) {
        toast.error(getErrorMessage(result.error));
      } else {
        setResetSuccess(true);
        toast.success("Password reset email sent! Check your inbox.");
        resetForm.reset();
      }
    } catch (error) {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setIsResetPending(false);
    }
  };

  const handleResetDialogClose = () => {
    setIsResetDialogOpen(false);
    setResetSuccess(false);
    resetForm.reset();
  };

  return (
    <>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter your email"
                      disabled={isPending}
                      className="pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      disabled={isPending}
                      className="pl-10 pr-10"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isPending}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between text-sm">
            <div /> {/* Spacer */}
            <Dialog
              open={isResetDialogOpen}
              onOpenChange={setIsResetDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </DialogDescription>
                </DialogHeader>

                {resetSuccess ? (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">Email Sent!</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Check your inbox for password reset instructions.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Form {...resetForm}>
                    <form
                      onSubmit={resetForm.handleSubmit(handleResetPassword)}
                      className="space-y-4"
                    >
                      <FormField
                        control={resetForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Enter your email"
                                  disabled={isResetPending}
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResetDialogClose}
                          disabled={isResetPending}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isResetPending}>
                          {isResetPending ? (
                            <>
                              <LoadingSpinner className="mr-2 h-4 w-4" />
                              Sending...
                            </>
                          ) : (
                            "Send Reset Link"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                )}

                {resetSuccess && (
                  <DialogFooter>
                    <Button onClick={handleResetDialogClose} className="w-full">
                      Close
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <div className="flex items-center">
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}
