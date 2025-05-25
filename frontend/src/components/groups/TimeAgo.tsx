"use client";

import { useState, useEffect } from "react";

export default function TimeAgo({ dateStr }: { dateStr: string }) {
    const [label, setLabel] = useState(() => formatTimeAgo(dateStr));

    useEffect(() => {
        const update = () => setLabel(formatTimeAgo(dateStr));
        const interval = setInterval(update, 60000); // update every minute
        update(); // immediate initial update

        return () => clearInterval(interval); // cleanup on unmount
    }, [dateStr]);

    return <time dateTime={dateStr}>• {label}</time>;
}

// Input date in local time (but ends with Z)
export function formatTimeAgo(dateStr: string) {
    const dStr = dateStr.endsWith('Z') ? dateStr.slice(0, -1) : dateStr;
    const date = new Date(dStr); // if UTC converts to local time, if local time keeps it

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000); // getTime() references UTC time

    if (seconds < 1) return 'just now';
    if (seconds < 60) return 'seconds ago';

    const units = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
    ];

    for (const unit of units) {
        const value = Math.floor(seconds / unit.seconds);
        if (value >= 1) {
            return `${value} ${unit.label}${value > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
}
