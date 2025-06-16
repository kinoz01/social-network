import Link from 'next/link';
import React from 'react';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <Link href="/home">
        <div className="go-home">Go Home</div>
      </Link>
    </div>
  );
}
