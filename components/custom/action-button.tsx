import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip";

export function ActionButton({
    href,
    icon: Icon,
    label,
    colorClass,
    onClick,
    variant,
}: {
    href?: string;
    icon: React.ElementType;
    label: string;
    colorClass: string;
    onClick?: () => void;
    variant?: "outline" | "destructive" | "ghost" | "secondary" | "default";
}) {
    const button = (
        <Button
            asChild={!!href}
            size="icon-sm"
            variant={variant || "outline"}
            className={colorClass}
            onClick={onClick}
            aria-label={label}
        >
            {href ? (
                <Link href={href}>
                    <Icon className="size-4" />
                </Link>
            ) : (
                <Icon className="size-4" />
            )}
        </Button>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
    );
}
