"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LoginRedirect = () => {
    const router = useRouter();

    useEffect(() => {
        // Use router.replace to avoid adding to history stack
        router.replace("/auth/signin");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-800">
            <div className="text-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg">Redirecting to sign in...</p>
            </div>
        </div>
    );
};

export default LoginRedirect;