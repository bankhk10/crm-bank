"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
    href?: string;
    icon: LucideIcon;
    label: string;
    colorClass: string;
    onClick?: () => void;
}

export function ActionButton({
    href,
    icon: Icon,
    label,
    colorClass,
    onClick,
}: ActionButtonProps) {
    const button = (
        <Button
            asChild={!!href}
            size="icon-sm"
            variant={onClick ? "destructive" : "outline"}
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
