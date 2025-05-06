"use client";

import { useState } from "react";
import { createClient } from "@/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AddUserPage() {
  const [userType, setUserType] = useState<"client" | "staff">("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [membershipType, setMembershipType] = useState("Standard");
  const [accountStatus, setAccountStatus] = useState("Verified");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      // 1. Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error || !data.user) {
        setNotification({ message: error?.message || "Failed to create auth user", type: "error" });
        setLoading(false);
        return;
      }

      const userId = data.user.id;

      // 2. Insert into correct table
      if (userType === "client") {
        const { error: clientError } = await supabase.from("Client").insert([
          {
            client_id: userId,
            client_name: name,
            phone_number: phone,
            membership_type: membershipType,
            account_status: accountStatus,
          },
        ]);
        if (clientError) {
          setNotification({ message: clientError.message, type: "error" });
          setLoading(false);
          return;
        }
      } else {
        // staff
        console.log(accountStatus);
        const { error: staffError } = await supabase.from("LibraryAdmin").insert([
          {
            admin_id: userId,
            name: name,
            phone_number: phone,
            account_status: accountStatus,
          },
        ]);
        if (staffError) {
          setNotification({ message: staffError.message, type: "error" });
          setLoading(false);
          return;
        }
      }

      setNotification({ message: "User created successfully!", type: "success" });
      setEmail("");
      setPassword("");
      setName("");
      setPhone("");
      setMembershipType("Standard");
      setAccountStatus("Verified");
    } catch (err: any) {
      setNotification({ message: err.message || "Unknown error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button
              variant={userType === "client" ? "default" : "outline"}
              onClick={() => {
                setUserType("client");
                setAccountStatus("Verified");
              }}
            >
              Create Client
            </Button>
            <Button
              variant={userType === "staff" ? "default" : "outline"}
              onClick={() => {
                setUserType("staff");
                setAccountStatus("active");
              }}
            >
              Create Staff
            </Button>
          </div>
          <Separator className="mb-6" />
          {notification && (
            <div
              className={`mb-4 p-3 rounded ${
                notification.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {notification.message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="block mb-1">Phone Number</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {userType === "client" && (
              <div>
                <label className="block mb-1">Membership Type</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={membershipType}
                  onChange={(e) => setMembershipType(e.target.value)}
                >
                  <option value="Standard">Standard</option>
                  <option value="Student">Student</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
            )}
            <div>
              <label className="block mb-1">Account Status</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={accountStatus}
                onChange={(e) => setAccountStatus(e.target.value)}
              >
                {userType === "client" ? (
                  <>
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </>
                ) : (
                  <>
                    <option value="active">active</option>
                    <option value="pending">pending</option>
                    <option value="suspended">suspended</option>
                  </>
                )}
              </select>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create User"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}