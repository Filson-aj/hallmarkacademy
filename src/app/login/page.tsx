"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import Image from "next/image";
import Link from "next/link";

import Footer from "@/components/ui/footer/footer";

const Login = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        const role = user?.publicMetadata.role;
        if (role) {
            router.push(`/${role}`);
        }
    }, [isLoaded, isSignedIn, user, router]);

    return (
        <article className="flex flex-col min-h-screen bg-neutral-900 text-neutral-200">
            <section className="flex flex-1 items-center justify-center bg-gray-100 text-gray-900 px-4">
                <SignIn.Root>
                    {/* Container scales from full width on mobile to narrower on large screens */}
                    <SignIn.Step
                        name="start"
                        className="flex flex-col sm:flex-row w-full max-w-xl bg-white rounded-lg shadow-2xl overflow-hidden transition-shadow duration-300"
                    >
                        {/* Left Panel (hidden on small screens) */}
                        <div className="hidden sm:flex flex-col w-1/2 bg-gradient-to-br from-cyan-600 to-blue-800 text-white p-6">
                            <Link href="/" className="flex items-center justify-center mb-4">
                                <Image
                                    src="/assets/logo.png"
                                    alt="Hallmark Academy"
                                    width={60}
                                    height={60}
                                    className="rounded-full"
                                />
                            </Link>
                            <h1 className="text-2xl font-bold text-center">Welcome Back</h1>
                            <p className="text-xs text-white/90 text-center mt-1 mb-2">
                                To Hallmark Academy Lafia
                            </p>
                            <hr className="border-gray-300 my-2" />
                            <p className="text-xs leading-relaxed text-justify mt-2">
                                Dive into your world of learning—check today’s assignments, track
                                your progress, and connect with teachers and classmates. Please
                                enter your credentials below to continue your journey.
                            </p>
                        </div>

                        {/* Right Panel (form) */}
                        <div className="flex flex-col w-full sm:w-1/2 p-6 sm:p-8">
                            <h2 className="text-center text-lg sm:text-xl font-semibold text-gray-700 mb-4">
                                Sign in to your account
                            </h2>
                            <Clerk.GlobalError className="text-sm text-red-500 text-center mb-2" />

                            <Clerk.Field name="identifier" className="flex flex-col mb-4">
                                <Clerk.Label className="text-sm text-gray-500 font-medium mb-1">
                                    Email
                                </Clerk.Label>
                                <Clerk.Input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 transition"
                                    placeholder="you@example.com"
                                />
                                <Clerk.FieldError className="text-xs text-red-500 mt-1" />
                            </Clerk.Field>

                            <Clerk.Field name="password" className="flex flex-col mb-6">
                                <Clerk.Label className="text-sm text-gray-500 font-medium mb-1">
                                    Password
                                </Clerk.Label>
                                <Clerk.Input
                                    type="password"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 transition"
                                    placeholder="********"
                                />
                                <Clerk.FieldError className="text-xs text-red-500 mt-1" />
                            </Clerk.Field>

                            <SignIn.Action
                                submit
                                className="w-full py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 transition"
                            >
                                Sign In
                            </SignIn.Action>
                        </div>
                    </SignIn.Step>
                </SignIn.Root>
            </section>
            <Footer />
        </article>
    );
};

export default Login;
