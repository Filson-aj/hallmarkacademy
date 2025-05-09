
import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { FaSearch, FaEnvelope, FaBell } from 'react-icons/fa';
import React from 'react';

const Navbar = async () => {
    const user = await currentUser();
    const role = user?.publicMetadata?.role as string || 'Guest';

    return (
        <header className="flex items-center justify-between bg-white px-4 py-2 shadow-md">
            {/* SEARCH BAR */}
            <div className="hidden md:flex items-center space-x-2 text-gray-600 text-sm bg-gray-100 rounded-full px-3 py-1 flex-grow">
                <FaSearch className="w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent outline-none w-full placeholder-gray-400 py-1"
                />
            </div>

            {/* ICONS & USER */}
            <div className="flex items-center space-x-6 w-3/7 justify-end">
                {/* Messages */}
                <button className="relative p-2 rounded-full hover:bg-gray-200 transition">
                    <FaEnvelope className="w-5 h-5 text-gray-700" />
                </button>

                {/* Notifications */}
                <button className="relative p-2 rounded-full hover:bg-gray-200 transition">
                    <FaBell className="w-5 h-5 text-gray-700" />
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full">
                        1
                    </span>
                </button>

                {/* User Info */}
                <div className="flex flex-col text-right">
                    {/*  <span className="text-sm font-medium text-gray-800">
                        {user?.firstName ?? 'User'}
                    </span> */}
                    <span className="text-xs text-gray-500">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                </div>

                {/* Clerk User Button */}
                <UserButton />
            </div>
        </header>
    );
};

export default Navbar;
