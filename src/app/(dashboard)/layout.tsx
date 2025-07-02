import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import Menu from "@/components/Navigation/Menu";
import Navbar from "@/components/Navigation/Navbar";

const DashboardLayout = async ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/signin");
    }

    return (
        <article className="h-screen flex bg-gray-100 text-gray-900">
            {/* LEFT */}
            <aside className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] bg-gradient-to-br from-gray-800 to-gray-900 text-white flex flex-col gap-4">
                <Link
                    href={"/"}
                    className="flex flex-col items-center justify-center lg:justify-start gap-2 p-4">
                    <Image src={"/assets/logo.png"} alt="logo" width={62} height={62} />
                    <span className="hidden lg:block font-bold uppercase text-sm text-center">Hallmark Academy.</span>
                </Link>
                <hr className="border-gray-300 w-full" />
                <Menu />
            </aside>
            {/* RIGHT */}
            <section className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
                <Navbar />
                {children}
            </section>
        </article>
    );
}

export default DashboardLayout;