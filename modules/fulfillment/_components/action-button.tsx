import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ElementType } from "react";

export function ActionButton({
    href,
    icon: Icon,
    label,
    colorClass,
    onClick,
}: {
    href?: string;
    icon: ElementType;
    label: string;
    colorClass: string;
    onClick?: () => void;
}) {
    const content = (
        <>
            <Icon className="h-4 w-4 mr-0 sm:mr-1 md:mr-2" />
            <span className="hidden sm:inline">{label}</span>
        </>
    );

    if (href) {
        return (
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "h-8 px-2 lg:px-3 text-xs lg:text-sm font-medium transition-colors border",
                    colorClass
                )}
                asChild
            >
                <Link href={href}>{content}</Link>
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className={cn(
                "h-8 px-2 lg:px-3 text-xs lg:text-sm font-medium transition-colors border",
                colorClass
            )}
            onClick={onClick}
        >
            {content}
        </Button>
    );
}
