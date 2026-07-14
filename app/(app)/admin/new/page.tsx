'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewAdminEntryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin?tab=entry');
  }, [router]);

  return null;
}
