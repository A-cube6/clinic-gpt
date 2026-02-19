export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Public wrapper for /admin/* routes.
  // Protected pages live under /admin/(protected) so /admin/login stays accessible.
  return children;
}
