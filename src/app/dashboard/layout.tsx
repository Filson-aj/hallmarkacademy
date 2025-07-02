"use client"

import { useState } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Divider } from "primereact/divider";
import { authOptions } from "@/lib/auth";
import Menu from "@/components/Navigation/Menu";
import Navbar from "@/components/Navigation/Navbar";
import { Menu as MenuIcon } from "lucide-react";

const DashboardLayout = async ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    const [open, setOpen] = useState(true);
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/signin");
    }

    return (
        <main className="h-screen flex bg-gray-100 text-gray-900">
            {/* LEFT */}
            <AnimatePresence>
                <aside className={`bg-gray-800 text-white hidden sm:flex flex-col ${open ? 'w-60' : 'w-[75px]'} border-r border-gray-300/40 duration-500`}>
                    <div className={`flex gap-2 items-center ${open ? 'justify-between' : 'justify-center'} px-1 py-3 text-neutral-200 text-lg `}>
                        {open && <div className='flex items-center gap-2'>
                            <Image
                                src={"/assets/logo.png"}
                                alt="logo"
                                width={50}
                                height={50}
                                className="rounded-full"
                            />
                            <span className="font-bold text-[12pt] leading-tight uppercase font-bold transition-all duration-300">Hallmark Academy Lafia</span>
                        </div>}
                        <div className="cursor-pointer w-6 h-6 text-blue-500" onClick={() => setOpen(!open)}>
                            <MenuIcon
                                className="w-6 h-6"
                                size={24}
                            />
                        </div>
                    </div>
                    {/* <Link
                        href={"/"}
                        className="flex flex-col items-center justify-center lg:justify-start gap-2 p-4">
                        <Image src={"/assets/logo.png"} alt="logo" width={62} height={62} />
                        <span className="hidden lg:block font-bold uppercase text-sm text-center">Hallmark Academy.</span>
                    </Link> */}
                    <Divider className="my-1" />
                    <hr className="border-gray-300 w-full" />
                    <Menu />
                </aside>
            </AnimatePresence>

            {/* RIGHT */}
            <section className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
                <Navbar />
                {children}
            </section>
        </main>
    );
}

export default DashboardLayout;