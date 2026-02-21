"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip check for login page
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    const token = Cookies.get("admin_token");
    if (!token) {
      router.push("/admin/login");
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
