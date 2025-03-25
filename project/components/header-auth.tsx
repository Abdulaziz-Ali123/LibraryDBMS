'use client'

import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import { ThemeSwitcher } from "./theme-switcher";
import { useEffect, useState } from "react";

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsAdmin(document.cookie.includes('isAdmin=true'));
    };

    getUser();
  }, []);

  return (
    <div className="flex justify-end w-full">
      {/* Navigation Links */}
      <div className="pl-5 flex gap-4">
        <Button asChild variant="ghost" className="hover:underline">
          <Link href="/">Dashboard</Link>
        </Button>
        { (
          <Button asChild variant="ghost" className="hover:underline">
            <Link href="/browse">Browse</Link>
          </Button>
        )}
        {isAdmin && (
          <Button asChild variant="ghost" className="hover:underline">
            <Link href="/protected/library">Library Management</Link>
          </Button>
        )}
      </div>

      {/* User Info & Auth */}
      <div className="pr-5 flex items-center gap-4">
        {user ? (
          <>
            <span>Hey, {user.email}!</span>
            <ThemeSwitcher />
            <form action={signOutAction}>
              <Button type="submit" variant={"outline"}>
                Sign out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Button asChild size="sm" variant={"outline"}>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm" variant={"default"}>
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
