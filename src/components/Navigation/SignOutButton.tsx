"use client";

import { signOut } from "next-auth/react";
import { FaSignOutAlt } from "react-icons/fa";

const SignOutButton = () => {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
            title="Sign Out"
        >
            <FaSignOutAlt className="w-4 h-4" />
            <span className="hidden sm:block">Sign Out</span>
        </button>
    );
};

export default SignOutButton;