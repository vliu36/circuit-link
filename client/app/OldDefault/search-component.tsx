'use client'; // This component must be a client component

import { useSearchParams } from 'next/navigation';

export default function SearchComponent() {
  const searchParams = useSearchParams();

  // Your code that uses searchParams goes here
  const someValue = searchParams.get('key');

  return (
    <div>
      {/* Your JSX that depends on searchParams */}
    </div>
  );
}