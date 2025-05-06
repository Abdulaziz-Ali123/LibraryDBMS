"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const router = useRouter();
  const supabase = createClient();
  
  // Function to fetch client details
  const fetchClientDetails = async (userId) => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('Client')
      .select(`
        client_id,
        client_name,
        phone_number,
        membership_type
      `)
      .eq('client_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching client details:', error);
      setNotification({
        message: `Failed to load account details: ${error.message}`,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    } else {
      setClientDetails(data);
    }
  };

  // Initial data loading
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      // Fetch client details
      await fetchClientDetails(user.id);
      setLoading(false);
    };

    getUser();
  }, [router]);
  
  // Set up real-time subscription for client changes
  useEffect(() => {
    if (!user) return;
    
    const clientSubscription = supabase
      .channel('client-changes')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'Client',
        filter: `client_id=eq.${user.id}`
      }, () => {
        fetchClientDetails(user.id);
      })
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      clientSubscription.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading your account details...</p>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8">
      {notification && (
        <div className={`mb-6 p-4 rounded-md shadow-md ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 
          'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
        }`}>
          {notification.message}
        </div>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>My Account</CardTitle>
        </CardHeader>
        <CardContent>
          {clientDetails ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Personal Information</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="font-medium">{clientDetails.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                    <p className="font-medium">{clientDetails.phone_number || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Membership Details</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Membership Type</p>
                    <p className="font-medium capitalize">{clientDetails.membership_type || 'Standard'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Membership Start Date</p>
                    <p className="font-medium capitalize">{formatDate(user?.created_at) || 'Not Provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>Unable to load account details. Please try again later.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}