"use client";

import React, { useState } from "react";
import { FileUpload } from "primereact/fileupload";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dropbox, files } from "dropbox";

interface FileUploaderProps {
    dropboxFolder: string;
    onUploadSuccess?: (metadata: files.FileMetadataReference) => void;
    chooseLabel?: string;
}

export default function FileUploader({
    dropboxFolder,
    onUploadSuccess,
    chooseLabel = "Upload File",
}: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 1️⃣ Fetch a fresh access token from our API
    async function getAccessToken(): Promise<string> {
        const res = await fetch("/api/dropbox/token");
        console.log("Dropbox token response:", res);
        if (!res.ok) throw new Error("Could not refresh Dropbox token");
        const json = await res.json();
        if ("error" in json) throw new Error(json.error);
        return json.access_token;
    }

    const uploadHandler = async (event: any) => {
        const file = event.files?.[0] as File;
        if (!file) return;

        setError(null);
        setUploading(true);

        try {
            const token = await getAccessToken();
            const dbx = new Dropbox({ accessToken: token, fetch: window.fetch.bind(window) });

            // normalize dropbox path
            const folder = dropboxFolder.startsWith("/")
                ? dropboxFolder
                : `/${dropboxFolder}`;
            const uploadPath = `${folder.replace(/\/+$/, "")}/${file.name}`;

            const response = await dbx.filesUpload({
                path: uploadPath,
                contents: file,
                mode: { ".tag": "add" },
                autorename: true,
                mute: true,
            });

            setUploading(false);
            onUploadSuccess?.(response.result as files.FileMetadataReference);
            event.options?.clear?.();
        } catch (err: any) {
            console.error("Dropbox upload error:", err);
            setError(err.error?.error_summary || err.message || "Upload failed");
            setUploading(false);
        }
    };

    return (
        <div className="p-field w-full">
            <FileUpload
                mode="basic"
                accept="image/*"
                maxFileSize={50 * 1024 * 1024}
                auto
                customUpload
                uploadHandler={uploadHandler}
                chooseLabel={chooseLabel}
                disabled={uploading}
                className="w-full"
            />

            {uploading && (
                <div className="flex justify-center my-2">
                    <ProgressSpinner strokeWidth="4" />
                </div>
            )}

            {error && <small className="p-error block text-center">{error}</small>}
        </div>
    );
}
