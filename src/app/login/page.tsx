"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
/* import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in"; */
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
        <div>Login page</div>
    );

};

export default Login;
