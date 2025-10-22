"use client";

import { useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import Footer from "@/components/ui/footer/footer";

// Validation schema
const signInSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z
        .string()
        .min(1, "Password is required")
        .min(6, "Password must be at least 6 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;

const SignIn = () => {
    const toast = useRef<Toast>(null);
    const router = useRouter();

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            username: "",
            password: "",
        },
        mode: 'onBlur'
    });

    /**
    * Map server/client error code to a toast message object.
    * { severity, summary, detail, life, icon }
    */
    const mapErrorToToast = (code?: string) => {
        switch (code) {
            case "inactive":
                return {
                    severity: "warn" as const,
                    summary: "Account Inactive",
                    detail: "Your account is inactive. Contact support if you believe this is an error.",
                    life: 5000,
                    icon: "pi pi-lock",
                };
            case "invalid_credentials":
            case "CredentialsSignin":
                return {
                    severity: "error" as const,
                    summary: "Invalid Credentials",
                    detail: "Invalid username or password. Please check and try again.",
                    life: 4000,
                    icon: "pi pi-times",
                };
            case "server_error":
            default:
                return {
                    severity: "error" as const,
                    summary: "Server Error",
                    detail: "Server error, please try again.",
                    life: 5000,
                    icon: "pi pi-exclamation-triangle",
                };
        }
    };

    const onSubmit = async (data: SignInFormData) => {
        try {
            const result = await signIn("credentials", {
                username: data.username,
                password: data.password,
                redirect: false,
            });

            // Handle known error responses from next-auth / authorize
            if (result?.error) {
                const errToast = mapErrorToToast(result.error);
                toast.current?.show(errToast);
                return;
            }

            // Show success message
            toast.current?.show({
                severity: "success",
                summary: "Welcome Back!",
                detail: "Sign in successful. Redirecting to your dashboard...",
                life: 2000,
                icon: "pi pi-check",
            });

            // Acquire session and redirect by role
            const session = await getSession();
            if (session?.user?.role) {
                setTimeout(() => {
                    router.push(`/dashboard/${session.user.role}`);
                }, 700);
            } else {
                toast.current?.show(mapErrorToToast("server_error"));
            }
        } catch (err) {
            console.error("Sign in error:", err);
            toast.current?.show(mapErrorToToast("server_error"));
        }
    };

    return (
        <article className="w-full min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
            <Toast ref={toast} />

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>

            <section className="flex-1 flex items-center justify-center p-4 relative z-10">
                <motion.div
                    className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Left Panel - Welcome Section */}
                    <motion.div
                        className="hidden lg:flex flex-col justify-center text-white space-y-6"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <Image
                                    src="/assets/logo.png"
                                    alt="Hallmark Academy"
                                    width={40}
                                    height={40}
                                />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Welcome Back</h1>
                                <p className="text-blue-200">to Hallmark Academy</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold leading-tight">
                                Continue Your
                                <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                    Learning Journey
                                </span>
                            </h2>
                            <p className="text-xl text-blue-200 leading-relaxed">
                                Access your personalized dashboard, track your progress,
                                connect with your learning community, and explore new opportunities.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-4">
                            {[
                                "📚 Access your subjects and assignments",
                                "📊 Track your academic progress",
                                "👥 Connect with teachers and classmates",
                                "🎯 Achieve your learning goals"
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    className="flex items-center gap-3 text-blue-100"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                                >
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                                    <span>{feature}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right Panel - Sign In Form */}
                    <motion.div
                        className="w-full max-w-md mx-auto"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <Card className="px-4 lg:px-8 py-4 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                            <div className="text-center mb-4">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                    Welcome Back!
                                </h2>
                                <p className="text-gray-600">
                                    Enter your credentials to access your account
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Username Field */}
                                <div className="space-y-2">
                                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                                        Username
                                    </label>
                                    <Controller
                                        name="username"
                                        control={control}
                                        render={({ field }) => (
                                            <InputText
                                                {...field}
                                                id="username"
                                                type="text"
                                                placeholder="Enter your username"
                                                className={`w-full p-3 border-2 rounded-lg transition-all duration-300 ${errors.username
                                                    ? 'p-invalid'
                                                    : ''
                                                    }`}
                                                autoComplete="username"
                                            />
                                        )}
                                    />
                                    {errors.username && (
                                        <motion.p
                                            className="text-red-500 text-sm flex items-center gap-1"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <i className="pi pi-exclamation-circle" />
                                            {errors.username.message}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                        Password
                                    </label>
                                    <Controller
                                        name="password"
                                        control={control}
                                        render={({ field }) => (
                                            <Password
                                                {...field}
                                                id="password"
                                                placeholder="Enter your password"
                                                className={`w-full block ${errors.password ? 'p-invalid' : ''
                                                    }`}
                                                inputClassName="w-full p-3 border-2 rounded-lg transition-all duration-300"
                                                toggleMask
                                                feedback={false}
                                                autoComplete="current-password"
                                            />
                                        )}
                                    />
                                    {errors.password && (
                                        <motion.p
                                            className="text-red-500 text-sm flex items-center gap-1"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <i className="pi pi-exclamation-circle" />
                                            {errors.password.message}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="remember"
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="remember" className="text-sm text-gray-600">
                                            Remember me
                                        </label>
                                    </div>
                                    <Link
                                        href="/auth/forgot-password"
                                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-300"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    label={isSubmitting ? "Signing In..." : "Sign In"}
                                    icon={isSubmitting ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
                                    className="w-full mt-2 lg:mt-4 p-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0 rounded-lg font-semibold text-white transition-all duration-300"
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                />
                            </form>

                            <Divider align="center" className="my-6">
                                <span className="text-gray-500 text-sm">OR</span>
                            </Divider>
                            {/* Back to Home */}
                            <div className="text-center mt-6">
                                <Link
                                    href="/"
                                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-300 flex items-center justify-center gap-1"
                                >
                                    <i className="pi pi-arrow-left" />
                                    Back to Homepage
                                </Link>
                            </div>
                        </Card>
                    </motion.div>
                </motion.div>
            </section>

            <Footer />
        </article>
    );
};

export default SignIn;