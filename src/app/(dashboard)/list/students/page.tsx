import FormContainer from "@/components/forms/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

import prisma from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Student } from "@/generated/prisma";
import Image from "next/image";
import Link from "next/link";

import { auth } from "@clerk/nextjs/server";

type StudentList = Student & { class: Class };

// We declare props as `any` to avoid the built-in PageProps constraint
export default async function StudentListPage(props: any) {
    // Narrow just the part we need:
    const { searchParams }: { searchParams: { [key: string]: string | undefined } } = props;

    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    const columns = [
        { header: "Info", accessor: "info" },
        { header: "Student ID", accessor: "studentId", className: "hidden md:table-cell" },
        { header: "Grade", accessor: "grade", className: "hidden md:table-cell" },
        { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
        { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
        ...(role === "admin" ? [{ header: "Actions", accessor: "action" }] : []),
    ];

    const renderRow = (item: StudentList) => (
        <tr
            key={item.id}
            className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
        >
            <td className="flex items-center gap-4 p-4">
                <Image
                    src={item.avarta || "/noAvatar.png"}
                    alt=""
                    width={40}
                    height={40}
                    className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                    <h3 className="font-semibold">{item.firstname}</h3>
                    <p className="text-xs text-gray-500">{item.class.name}</p>
                </div>
            </td>
            <td className="hidden md:table-cell">{item.username}</td>
            <td className="hidden md:table-cell">{item.class.name[0]}</td>
            <td className="hidden lg:table-cell">{item.phone}</td>
            <td className="hidden lg:table-cell">{item.address}</td>
            <td>
                <div className="flex items-center gap-2">
                    <Link href={`/list/students/${item.id}`}>
                        <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                            <Image src="/view.png" alt="View" width={16} height={16} />
                        </button>
                    </Link>
                    {role === "admin" && (
                        <FormContainer table="student" type="delete" id={item.id} />
                    )}
                </div>
            </td>
        </tr>
    );

    const { page, ...queryParams } = searchParams;
    const p = page ? parseInt(page, 10) : 1;

    // Build your Prisma filter
    const query: Prisma.StudentWhereInput = {};
    for (const [key, value] of Object.entries(queryParams)) {
        if (!value) continue;
        if (key === "teacherId") {
            query.class = { lessons: { some: { teacherid: value } } };
        } else if (key === "search") {
            query.firstname = { contains: value, mode: "insensitive" };
        }
    }

    // Fetch data + count in one transaction
    const [data, count] = await prisma.$transaction([
        prisma.student.findMany({
            where: query,
            include: { class: true },
            take: ITEMS_PER_PAGE,
            skip: ITEMS_PER_PAGE * (p - 1),
        }),
        prisma.student.count({ where: query }),
    ]);

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4">
            <div className="flex items-center justify-between">
                <h1 className="hidden md:block text-lg font-semibold">All Students</h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <TableSearch />
                    <div className="flex items-center gap-4 self-end">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                            <Image src="/filter.png" alt="Filter" width={14} height={14} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                            <Image src="/sort.png" alt="Sort" width={14} height={14} />
                        </button>
                        {role === "admin" && <FormContainer table="student" type="create" />}
                    </div>
                </div>
            </div>

            <Table columns={columns} renderRow={renderRow} data={data} />

            <Pagination page={p} count={count} />
        </div>
    );
}
