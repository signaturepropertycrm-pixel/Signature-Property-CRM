'use client'; // <-- Ye line sab se zaroori hai

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-xl font-bold text-red-600">Something went wrong!</h2>
      <p className="text-gray-600 max-w-md bg-gray-100 p-2 rounded">
        {error.message || "Unknown error occurred"}
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
