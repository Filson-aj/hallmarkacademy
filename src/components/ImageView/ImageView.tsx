"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dropbox, files } from "dropbox";

export type UploadResult = {
    path: string;
    id: string;
    url?: string | null;
};

interface Props {
    /** Dropbox API path (e.g. "/folder/file.jpg") */
    path?: string | null;
    /** Called when image successfully replaced in Dropbox */
    onChange?: (meta: UploadResult) => void | Promise<void>;
    /** Placeholder image shown when no path or on error */
    placeholder?: string;
    /** Tailwind className applied to outer container */
    className?: string;
    /** width/height can be px number or CSS string (e.g. '100%', '200px') */
    width?: number | string;
    height?: number | string;
    /** optional alt text */
    alt?: string;
    /** maximum size in bytes (default 10MB) */
    maxSizeBytes?: number;
    /** whether to show the edit control and allow uploads */
    editable?: boolean;
}

export default function ImageView({
    path,
    onChange,
    placeholder = "/assets/profile.png",
    className,
    width = "100%",
    height = 160,
    alt = "image",
    maxSizeBytes = 10 * 1024 * 1024,
    editable = true,
}: Props) {
    const [imgSrc, setImgSrc] = useState<string>(placeholder);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const mountedRef = useRef(true);

    // local preview URL
    const [localPreview, setLocalPreview] = useState<string | null>(null);

    // fetch access token from server (expects /api/dropbox/token)
    const fetchAccessToken = useCallback(async (): Promise<string> => {
        const res = await fetch("/api/dropbox/token");
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to get Dropbox token: ${text}`);
        }
        const json = await res.json();
        if (!json.access_token) throw new Error("No access_token from token endpoint");
        return json.access_token as string;
    }, []);

    // load temporary link for provided path
    useEffect(() => {
        mountedRef.current = true;
        let cancelled = false;

        const load = async () => {
            // clear any local preview if path changes
            if (localPreview) {
                URL.revokeObjectURL(localPreview);
                setLocalPreview(null);
            }

            if (!path) {
                setImgSrc(placeholder);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const token = await fetchAccessToken();
                if (cancelled) return;
                const dbx = new Dropbox({ accessToken: token, fetch: window.fetch.bind(window) as any });
                const res = await dbx.filesGetTemporaryLink({ path });
                if (cancelled) return;
                setImgSrc(res.result.link);
            } catch (err) {
                console.error("Failed to get temporary link:", err);
                setImgSrc(placeholder);
                setError("Could not load image");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, placeholder, fetchAccessToken]);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (localPreview) URL.revokeObjectURL(localPreview);
        };
    }, [localPreview]);

    const handleEditClick = useCallback(() => {
        if (!editable) return;
        inputRef.current?.click();
    }, [editable]);

    // upload and overwrite
    const uploadToDropbox = useCallback(
        async (file: File) => {
            if (!path) throw new Error("No target path provided for upload");
            if (file.size > maxSizeBytes) throw new Error(`File too large (max ${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB)`);

            setLoading(true);
            setError(null);

            const previousImg = imgSrc;

            // show local preview immediately
            const url = URL.createObjectURL(file);
            if (localPreview) URL.revokeObjectURL(localPreview);
            setLocalPreview(url);
            setImgSrc(url);

            try {
                const token = await fetchAccessToken();
                const dbx = new Dropbox({ accessToken: token, fetch: window.fetch.bind(window) as any });

                const uploadRes = await dbx.filesUpload({
                    path,
                    contents: file,
                    mode: { ".tag": "overwrite" },
                    autorename: false,
                    mute: true,
                });

                // try create/list shared link
                let sharedUrl: string | null = null;
                try {
                    const create = await dbx.sharingCreateSharedLinkWithSettings({ path });
                    sharedUrl = create.result?.url ? create.result.url.replace("?dl=0", "?raw=1") : null;
                } catch {
                    try {
                        const list = await dbx.sharingListSharedLinks({ path, direct_only: true });
                        if (Array.isArray(list.result.links) && list.result.links.length > 0) {
                            sharedUrl = list.result.links[0].url.replace("?dl=0", "?raw=1");
                        }
                    } catch {
                        /* ignore */
                    }
                }

                if (sharedUrl) {
                    setImgSrc(sharedUrl);
                } else {
                    try {
                        const temp = await dbx.filesGetTemporaryLink({ path });
                        setImgSrc(temp.result.link);
                    } catch {
                        // leave local preview
                    }
                }

                // prepare payload and call onChange (await if promise)
                const meta = uploadRes.result as files.FileMetadataReference;
                const payload: UploadResult = {
                    path: meta.path_display || meta.path_lower || path,
                    id: (meta as any).id || "",
                    url: sharedUrl ?? null,
                };

                // cleanup preview
                if (localPreview) {
                    URL.revokeObjectURL(localPreview);
                    setLocalPreview(null);
                }

                const maybePromise = onChange?.(payload);
                if (maybePromise && typeof (maybePromise as Promise<void>).then === "function") {
                    await (maybePromise as Promise<void>);
                }

                setError(null);
            } catch (err: any) {
                console.error("Upload failed:", err);
                setError(err?.error?.error_summary || err?.message || "Upload failed");
                setImgSrc(previousImg);
                if (localPreview) {
                    URL.revokeObjectURL(localPreview);
                    setLocalPreview(null);
                }
            } finally {
                if (mountedRef.current) setLoading(false);
            }
        },
        [fetchAccessToken, imgSrc, localPreview, maxSizeBytes, onChange, path]
    );

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            e.currentTarget.value = "";
            try {
                await uploadToDropbox(file);
            } catch (err) {
                // uploadToDropbox handles errors
                console.error(err);
            }
        },
        [uploadToDropbox]
    );

    // layout styles:
    // outer wrapper allows overflow so control can sit over border
    const outerStyle: React.CSSProperties = useMemo(
        () => ({
            width,
            maxWidth: "100%",
            // allow the edit control to render slightly outside the image area
            overflow: "visible",
            position: "relative",
            display: "block",
        }),
        [width]
    );

    // inner image box holds the image and provides the rounded crop + overflow hidden
    const imageBoxStyle: React.CSSProperties = useMemo(
        () => ({
            height,
            width: "100%",
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: "#ffffff",
            position: "relative",
        }),
        [height]
    );

    const imgStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    };

    // position the control centered over the bottom border (outside image)
    const overlayBtnStyle: React.CSSProperties = {
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: -18, // sits slightly below the image bottom border
        zIndex: 20,
        background: "rgba(255,255,255,0.65)", // semi-transparent
        borderRadius: 9999,
        padding: 6,
        width: 40,
        height: 40,
        display: editable ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        cursor: loading || !editable ? "not-allowed" : "pointer",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 8px 18px rgba(2,6,23,0.08)",
        backdropFilter: "blur(4px)",
        transition: "transform 120ms ease",
    };

    const Spinner = () => (
        <svg className="animate-spin" style={{ width: 18, height: 18 }} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.12)" strokeWidth="3" fill="none" />
            <path d="M22 12a10 10 0 00-10-10" stroke="rgba(30,64,175,0.95)" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
    );

    return (
        <div className={className} style={outerStyle}>
            {/* image box (rounded, overflow hidden) */}
            <div style={imageBoxStyle}>
                <img
                    src={localPreview ?? imgSrc}
                    alt={alt}
                    style={imgStyle}
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = placeholder;
                    }}
                />
            </div>

            {/* hidden input (kept outside inner box) */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                aria-hidden
                disabled={!editable}
            />

            {/* control centered over bottom border (outside image) */}
            {editable && (
                <div
                    style={overlayBtnStyle}
                    onClick={() => {
                        if (loading || !editable) return;
                        handleEditClick();
                    }}
                    role="button"
                    aria-label={loading ? "Working…" : "Change image"}
                >
                    {loading ? (
                        <Spinner />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#0f172a" }}>
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                    )}
                </div>
            )}

            {/* error bubble below the control if present */}
            {error && (
                <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -50, zIndex: 10, minWidth: 120 }}>
                    <div className="text-center text-xs text-red-600 bg-white/90 rounded-md p-1 shadow-sm">{error}</div>
                </div>
            )}
        </div>
    );
}
