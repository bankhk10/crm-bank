import React from "react";

export function TruncatedCell({ value }: { value: string }) {
    return (
        <div className="truncate" title={value}>
            {value}
        </div>
    );
}
