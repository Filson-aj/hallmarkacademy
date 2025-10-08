"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { OverlayPanel } from "primereact/overlaypanel";
import { confirmDialog } from "primereact/confirmdialog";
import { AgGridReact } from 'ag-grid-react'
import Spinner from "@/components/Spinner/Spinner";

const Grades: React.FC = () => {
    const { data: session } = useSession();
    const params = useParams() as { id?: string } | null;
    const id = params?.id || "";
    const [grade, setGrade] = useState<any | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [publish, setPublish] = useState(false)
    const gridRef = useRef(null)
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);

    const role = (session?.user?.role || "Guest").toLowerCase();

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const show = useCallback((
        type: "success" | "error" | "info" | "warn" | "secondary" | "contrast" | undefined,
        title: string,
        message: string
    ) => {
        toast.current?.show({ severity: type, summary: title, detail: message });
    }, []);

    const fetchJSON = async (url: string, signal?: AbortSignal) => {
        const res = await fetch(url, { signal });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || err.message || `HTTP ${res.status}`);
        }
        return res.json();
    };

    const fetchData = async () => {
        if (!id) {
            setError("Missing grade id in URL");
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;

        setLoading(true);
        setError(null);

        try {
            // 1) fetch grade
            const gradeResp = await fetch(`/api/gradings/${encodeURIComponent(id)}`, { signal });
            if (!gradeResp.ok) {
                const e = await gradeResp.json().catch(() => ({}));
                throw new Error(e.error || e.message || `Failed to fetch grade (status ${gradeResp.status})`);
            }
            const gradeData = await gradeResp.json();
            // support both shapes: { data: {...} } or direct object
            const fetchedGrade = gradeData?.data ?? gradeData;
            setGrade(fetchedGrade);
            setPublish(Boolean(fetchedGrade?.published));

            // determine school id from grade (either schoolid or nested school.id)
            const schoolId = fetchedGrade?.schoolid ?? fetchedGrade?.school?.id ?? null;

            if (!schoolId) {
                // nothing else to fetch
                setStudents([]);
                setClasses([]);
                setSubjects([]);
                return;
            }

            // 2) fetch students, classes and subjects in parallel filtered by schoolid
            // adjust endpoints if your API uses different query params
            const studentsUrl = `/api/students?schoolId=${encodeURIComponent(schoolId)}`;
            const classesUrl = `/api/classes?schoolId=${encodeURIComponent(schoolId)}`;
            const subjectsUrl = `/api/subjects?schoolId=${encodeURIComponent(schoolId)}`;

            const [studentsResp, classesResp, subjectsResp] = await Promise.allSettled([
                fetchJSON(studentsUrl, signal),
                fetchJSON(classesUrl, signal),
                fetchJSON(subjectsUrl, signal),
            ]);

            if (studentsResp.status === "fulfilled") {
                const payload = studentsResp.value;
                setStudents(payload?.data ?? payload ?? []);
            } else {
                console.warn("Failed fetching students:", studentsResp.reason);
                show("warn", "Partial load", "Failed to load students list.");
                setStudents([]);
            }

            if (classesResp.status === "fulfilled") {
                const payload = classesResp.value;
                setClasses(payload?.data ?? payload ?? []);
            } else {
                console.warn("Failed fetching classes:", classesResp.reason);
                show("warn", "Partial load", "Failed to load classes list.");
                setClasses([]);
            }

            if (subjectsResp.status === "fulfilled") {
                const payload = subjectsResp.value;
                setSubjects(payload?.data ?? payload ?? []);
            } else {
                console.warn("Failed fetching subjects:", subjectsResp.reason);
                show("warn", "Partial load", "Failed to load subjects list.");
                setSubjects([]);
            }
        } catch (err: any) {
            if (err?.name === "AbortError") {
                // ignore
                return;
            }
            console.error("Failed to fetch grade + related lists:", err);
            setError(err.message || "Failed to fetch data");
            show("error", "Fetch Error", err.message || "Failed to fetch grade record, please try again.");
        } finally {
            setLoading(false);
        }

        return () => controller.abort();
    };

    /* Loading effect */
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    // Simple debug UI for now — replace with actual grid/UI as needed
    return (
        <div className='mx-auto w-[90%] max-w-5xl my-10 bg-white shadow rounded-md p-6'>
            <Toast ref={toast} />
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {!grade ? (
                <div className="text-center py-10 text-gray-600">No grade data found.</div>
            ) : (
                <>
                    <h2 className="text-xl font-semibold mb-2">{grade.title ?? "Untitled Grade"}</h2>
                    <div className="text-sm text-gray-500 mb-4">
                        Session: <strong>{grade.session ?? "—"}</strong> • Term: <strong>{grade.term ?? "—"}</strong>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="p-3 border rounded">
                            <div className="text-xs text-gray-500">Students</div>
                            <div className="text-lg font-medium">{students.length}</div>
                        </div>
                        <div className="p-3 border rounded">
                            <div className="text-xs text-gray-500">Classes</div>
                            <div className="text-lg font-medium">{classes.length}</div>
                        </div>
                        <div className="p-3 border rounded">
                            <div className="text-xs text-gray-500">Subjects</div>
                            <div className="text-lg font-medium">{subjects.length}</div>
                        </div>
                    </div>

                    <details className="mt-4 p-4 bg-gray-50 rounded">
                        <summary className="cursor-pointer">Raw fetched data</summary>
                        <pre className="mt-2 text-xs text-gray-700 overflow-auto max-h-72">
                            {JSON.stringify({ grade, students, classes, subjects }, null, 2)}
                        </pre>
                    </details>
                </>
            )}
        </div>
    )
}

export default Grades;
