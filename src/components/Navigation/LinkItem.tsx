"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tooltip } from "primereact/tooltip";
import { DivideIcon as LucideIcon } from "lucide-react";
import type { FC } from "react";

interface LinkItemProps {
    item: {
        href: string;
        icon: typeof LucideIcon;
        label: string;
    };
    isCollapsed?: boolean;
    onMobileClick?: () => void;
}

// sanitize label into a valid class suffix
const slugify = (str: string) =>
    str
        .toLowerCase()
        .replace(/\s+/g, "-")        // spaces → hyphens
        .replace(/[^a-z0-9-]/g, ""); // drop anything not a–z, 0–9 or hyphen

const LinkItem: FC<LinkItemProps> = ({
    item,
    isCollapsed = false,
    onMobileClick,
}) => {
    const pathname = usePathname();

    const isActive = pathname === item.href;

    /*  const isActive =
         pathname === item.href || pathname?.startsWith(item.href + "/"); */
    const Icon = item.icon;

    // build a safe tooltip class
    const tooltipClass = `tooltip-${slugify(item.label)}`;

    const handleClick = () => {
        if (onMobileClick) onMobileClick();
    };

    return (
        <>
            {isCollapsed && <Tooltip target={`.${tooltipClass}`} position="right" />}

            <Link
                href={item.href}
                onClick={handleClick}
                className={`
          flex items-center gap-3 px-3 py-3 rounded-xl text-gray-200 
          hover:bg-gray-700/50 hover:text-white transition-all duration-300 
          group relative overflow-hidden
          ${isActive
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                        : ""}
          ${isCollapsed ? "justify-center" : ""}
        `}
            >
                {/* Active indicator */}
                {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                )}

                {/* Hover effect background */}
                <div
                    className={`
            absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 
            rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
            ${isActive ? "opacity-100" : ""}
          `}
                />

                {/* Icon with optional tooltip attributes */}
                <div
                    className={`
            ${isCollapsed ? tooltipClass : ""}
            flex items-center justify-center w-5 h-5 flex-shrink-0 relative z-10
            ${isActive ? "scale-110" : "group-hover:scale-105"}
            transition-transform duration-300
          `}
                    {...(isCollapsed
                        ? {
                            "data-pr-tooltip": item.label,
                            "data-pr-position": "right",
                        }
                        : {})}
                >
                    <Icon
                        size={20}
                        className={`
              ${isActive
                                ? "text-white"
                                : "text-gray-300 group-hover:text-white"}
              transition-colors duration-300
            `}
                    />
                </div>

                {/* Label when not collapsed */}
                {!isCollapsed && (
                    <span
                        className={`
              font-medium truncate relative z-10
              ${isActive
                                ? "text-white"
                                : "text-gray-300 group-hover:text-white"}
              transition-colors duration-300
            `}
                    >
                        {item.label}
                    </span>
                )}

                {/* Shine effect on hover */}
                <div
                    className={`
            absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
            transform -skew-x-12 -translate-x-full group-hover:translate-x-full
            transition-transform duration-700 ease-out
          `}
                />
            </Link>
        </>
    );
};

export default LinkItem;
