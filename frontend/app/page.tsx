// FILE: precci/frontend/app/page.tsx
// Root page — redirects to PWA welcome screen.
// Grace activates on the welcome screen.

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/welcome');
}