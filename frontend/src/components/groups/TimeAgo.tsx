"use client";
import { useState, useEffect } from "react";

export function formatTimeAgo(dateStr: string) {
    const date = new Date(dateStr);

    // Shift date back by 2 hours, trusting client clock
    date.setHours(date.getHours() - 2);

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

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
