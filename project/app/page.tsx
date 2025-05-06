import { createClient } from "@/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:from-inherit lg:static">
        <div className="max-w-4xl w-full mx-auto p-8 text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-b from-zinc-200 to-neutral-900 bg-clip-text text-transparent">
            Welcome to the Library
          </h1>
          <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
            Access our comprehensive library system to browse, reserve, and check out items.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <a 
              href="/sign-in" 
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Sign In
            </a>
            <a 
              href="/sign-up" 
              className="px-6 py-3 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-lg font-medium"
            >
              Create Account
            </a>
          </div>
          
          <div className="mt-12 text-gray-500 dark:text-gray-400">
            <p>Need help? Contact library support at support@library.com</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:from-inherit lg:static">
      <nav className="max-w-4xl mx-auto p-8">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-b from-zinc-200 to-neutral-900 bg-clip-text text-transparent">My Library Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link 
            href="/protected/user/checkouts" 
            className="group rounded-xl border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h3 className="mb-3 text-2xl font-semibold">
              My Checkouts{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h3>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              View and manage your currently checked out items
            </p>
          </Link>

          <Link 
            href="/protected/user/holds" 
            className="group rounded-xl border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h3 className="mb-3 text-2xl font-semibold">
              My Holds{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h3>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Check your current holds and reservations
            </p>
          </Link>

          <Link 
            href="/protected/user/fees" 
            className="group rounded-xl border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h3 className="mb-3 text-2xl font-semibold">
              My Fees{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h3>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              View and pay any outstanding fees or fines
            </p>
          </Link>

          <Link 
            href="/protected/user/account" 
            className="group rounded-xl border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h3 className="mb-3 text-2xl font-semibold">
              My Account{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h3>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Manage your account settings and preferences
            </p>
          </Link>
        </div>
      </nav>
    </div>
  );
}
