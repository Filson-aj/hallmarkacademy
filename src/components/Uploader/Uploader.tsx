"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone, type Accept } from "react-dropzone";

type UploadResult = {
    path: string;
    id: string;
    url?: string | null;
};

interface Props {
    dropboxFolder?: string;
    onUploadSuccess?: (meta: UploadResult) => void;
    chooseLabel?: string;
    width?: number | string;
    height?: number | string;
    maxSizeBytes?: number;
    accept?: Accept | string;
    className?: string;
    multiple?: boolean;
    chunkSizeBytes?: number;
}

export default function Uploader({
    dropboxFolder = "/hallmark",
    onUploadSuccess,
    chooseLabel = "Upload Image",
    width = "100%",
    height = 180,
    maxSizeBytes = 50 * 1024 * 1024,
    accept = "image/*",
    className,
    multiple = false,
    chunkSizeBytes = 8 * 1024 * 1024, // 8MB default
}: Props) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    // convert string accept into react-dropzone Accept type when needed
    const acceptOption = useMemo<Accept | undefined>(() => {
        if (!accept) return undefined;
        if (typeof accept === "string") {
            // support comma separated mime types like "image/*,video/*"
            const tokens = accept.split(",").map((t) => t.trim()).filter(Boolean);
            const obj: Record<string, string[]> = {};
            for (const t of tokens) obj[t] = [];
            return obj as Accept;
        }
        return accept;
    }, [accept]);

    const style: React.CSSProperties = useMemo(
        () => ({
            width,
            maxWidth: "100%",
            height,
            border: "2px dashed #cbd5e1",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 12,
            boxSizing: "border-box",
            cursor: "pointer",
            overflow: "hidden",
            background: "#fff",
        }),
        [width, height]
    );

    // revoke preview URL on unmount / when changed
    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // helper: call token endpoint
    async function fetchAccessToken(): Promise<string> {
        const res = await fetch("/api/dropbox/token");
        if (!res.ok) {
            const t = await res.text();
            throw new Error(`Failed to fetch Dropbox token: ${t}`);
        }
        const json = await res.json();
        if (!json.access_token) throw new Error("No access_token returned from token endpoint");
        return json.access_token as string;
    }

    // helper: create or list shared link
    async function ensureSharedLink(accessToken: string, path: string): Promise<string | null> {
        try {
            // try create
            const createRes = await fetch("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ path }),
            });
            if (createRes.ok) {
                const json = await createRes.json();
                return typeof json.url === "string" ? json.url.replace("?dl=0", "?raw=1") : null;
            }
            // if create failed (maybe link exists), try list_shared_links
            const listRes = await fetch("https://api.dropboxapi.com/2/sharing/list_shared_links", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ path, direct_only: true }),
            });
            if (listRes.ok) {
                const json = await listRes.json();
                const links = Array.isArray(json.links) ? json.links : [];
                if (links.length > 0 && links[0].url) return links[0].url.replace("?dl=0", "?raw=1");
            }
        } catch {
            // ignore and return null
        }
        return null;
    }

    /**
     * Chunked upload implementation using Dropbox upload_session endpoints.
     * Progress is reported via onChunkProgress(bytesUploaded, total)
     */
    async function uploadFileWithProgress(
        file: Blob,
        accessToken: string,
        path: string,
        onChunkProgress: (uploadedBytes: number, totalBytes: number) => void
    ): Promise<any> {
        const chunkSize = Math.max(1024 * 1024, chunkSizeBytes); // at least 1MB
        const total = file.size;
        let uploaded = 0;

        // small file: use single-call upload endpoint for simplicity
        if (total <= chunkSize) {
            const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/octet-stream",
                    "Dropbox-API-Arg": JSON.stringify({
                        path,
                        mode: { ".tag": "add" },
                        autorename: true,
                        mute: true,
                    }),
                },
                body: file,
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Dropbox single upload failed");
            }
            const json = await res.json();
            uploaded = total;
            onChunkProgress(uploaded, total);
            return json;
        }

        // large file: chunked session
        // start
        const startChunk = file.slice(0, chunkSize);
        let r = await fetch("https://content.dropboxapi.com/2/files/upload_session/start", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/octet-stream",
                "Dropbox-API-Arg": JSON.stringify({ close: false }),
            },
            body: startChunk,
        });
        if (!r.ok) {
            const txt = await r.text();
            throw new Error(txt || "Dropbox upload_session/start failed");
        }
        const startJson = await r.json();
        const sessionId = startJson.session_id;
        uploaded += startChunk.size;
        onChunkProgress(uploaded, total);

        // append chunks
        let offset = startChunk.size;
        while (offset < total) {
            const chunk = file.slice(offset, Math.min(offset + chunkSize, total));
            const isLast = offset + chunk.size >= total;

            if (!isLast) {
                // append_v2
                r = await fetch("https://content.dropboxapi.com/2/files/upload_session/append_v2", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/octet-stream",
                        "Dropbox-API-Arg": JSON.stringify({ cursor: { session_id: sessionId, offset } }),
                    },
                    body: chunk,
                });
                if (!r.ok) {
                    const txt = await r.text();
                    throw new Error(txt || "Dropbox upload_session/append_v2 failed");
                }
                uploaded += chunk.size;
                onChunkProgress(uploaded, total);
                offset += chunk.size;
            } else {
                // finish
                r = await fetch("https://content.dropboxapi.com/2/files/upload_session/finish", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/octet-stream",
                        "Dropbox-API-Arg": JSON.stringify({
                            cursor: { session_id: sessionId, offset },
                            commit: { path, mode: { ".tag": "add" }, autorename: true, mute: true },
                        }),
                    },
                    body: chunk,
                });
                if (!r.ok) {
                    const txt = await r.text();
                    throw new Error(txt || "Dropbox upload_session/finish failed");
                }
                const json = await r.json();
                uploaded += chunk.size;
                onChunkProgress(uploaded, total);
                return json;
            }
        }
        throw new Error("Unexpected upload flow");
    }

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            setError(null);
            setProgress(0);
            if (!acceptedFiles || acceptedFiles.length === 0) return;
            const filesToUpload = multiple ? acceptedFiles : [acceptedFiles[0]];

            // preview first file
            const first = filesToUpload[0];
            const objectUrl = URL.createObjectURL(first);
            setPreview((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return objectUrl;
            });

            setUploading(true);
            setProgress(0);

            try {
                const accessToken = await fetchAccessToken();

                const folder = dropboxFolder.startsWith("/") ? dropboxFolder : `/${dropboxFolder}`;
                const folderNormalized = folder.replace(/\/+$/, "");

                for (const file of filesToUpload) {
                    const uploadPath = `${folderNormalized}/${file.name}`;

                    // perform upload with chunk progress updates
                    const result = await uploadFileWithProgress(
                        file,
                        accessToken,
                        uploadPath,
                        (uploadedBytes, totalBytes) => {
                            const pct = Math.round((uploadedBytes / totalBytes) * 100);
                            setProgress(pct);
                        }
                    );

                    // result is the Dropbox file metadata
                    const pathDisplay = (result && (result.path_display || result.path_lower)) || uploadPath;
                    const id = (result && result.id) || "";

                    // try to obtain / create a shared link for display (best-effort)
                    const sharedUrl = await ensureSharedLink(accessToken, pathDisplay);

                    onUploadSuccess?.({ path: pathDisplay, id, url: sharedUrl ?? null });
                }

                setUploading(false);
                setProgress(100);
            } catch (err: any) {
                setError(err?.error?.error_summary || err?.message || String(err) || "Upload failed");
                setUploading(false);
            }
        },
        [dropboxFolder, multiple, onUploadSuccess, chunkSizeBytes, fetchAccessToken]
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: acceptOption,
        maxSize: maxSizeBytes,
        multiple,
        noClick: true,
        noKeyboard: true,
    });

    return (
        <div className={className} style={{ maxWidth: "100%" }}>
            <div {...getRootProps()} style={style} aria-disabled={uploading}>
                <input {...getInputProps()} />
                {preview ? (
                    <img
                        src={preview}
                        alt="preview"
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
                    />
                ) : (
                    <div style={{ textAlign: "center", padding: "0 8px" }}>
                        {isDragActive ? (
                            <p style={{ margin: 0 }}>Drop the file here …</p>
                        ) : (
                            <>
                                <p style={{ margin: 0, fontWeight: 600 }}>{chooseLabel}</p>
                                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Drag & drop or</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        open();
                                    }}
                                    type="button"
                                    style={{
                                        marginTop: 8,
                                        padding: "6px 12px",
                                        borderRadius: 6,
                                        border: "1px solid #cbd5e1",
                                        background: "#f8fafc",
                                        cursor: "pointer",
                                    }}
                                >
                                    Choose file
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div style={{ marginTop: 8 }}>
                {/* Progress bar only shown during upload */}
                {uploading && (
                    <div style={{ height: 6, background: "#e6edf3", borderRadius: 8, overflow: "hidden" }}>
                        <div
                            style={{
                                width: `${progress}%`,
                                height: "100%",
                                background: "#0ea5e9",
                                transition: "width 200ms linear",
                            }}
                        />
                    </div>
                )}

                <div style={{ marginTop: 8, minHeight: 22, textAlign: "center", fontSize: 13 }}>
                    {uploading ? (
                        <span>{progress}% uploading…</span>
                    ) : error ? (
                        <span style={{ color: "#ef4444" }}>{error}</span>
                    ) : (
                        <span style={{ color: "#6b7280" }}>{progress === 100 ? "Upload complete" : ""}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
