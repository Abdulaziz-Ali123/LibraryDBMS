'use client'

import { createClient } from "@/supabase/client";
import { useEffect, useState } from "react";
import Link from 'next/link';

const AdminNavigation = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:from-inherit lg:static">
      <nav className="max-w-4xl mx-auto p-8">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-b from-zinc-200 to-neutral-900 bg-clip-text text-transparent">Admin Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/protected/library/manage-items" 
            className="group rounded-xl border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h3 className="mb-3 text-2xl font-semibold">
              Manage Books{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h3>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Add, edit, and manage library books
            </p>
          </Link>

          <Link 
            href="/protected/library/manage-users" 
            className="group rounded-xl border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h3 className="mb-3 text-2xl font-semibold">
              Manage Users{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h3>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Handle user accounts and permissions
            </p>
          </Link>

          <Link 
            href="/protected/library/reports" 
            className="group rounded-xl border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h3 className="mb-3 text-2xl font-semibold">
              View Reports{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h3>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Access library statistics and reports
            </p>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default AdminNavigation;
