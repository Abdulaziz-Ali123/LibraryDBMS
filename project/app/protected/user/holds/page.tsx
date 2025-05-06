"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function HoldsPage() {
  const [user, setUser] = useState(null);
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHold, setSelectedHold] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const router = useRouter();
  const supabase = createClient();
  
  // Add a refresh function to fetch latest data
  const refreshHolds = async (userId) => {
    if (!userId) return;
    
    const { data, error } = await supabase.rpc('get_client_reservations', { 
      p_client_id: userId 
    });
    
    if (error) {
      console.error('Error fetching holds:', error);
      setNotification({
        message: `Failed to refresh data: ${error.message}`,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    } else {
      setHolds(data || []);
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
      
      // Use the refresh function
      await refreshHolds(user.id);
      setLoading(false);
    };

    getUser();
  }, [router]);
  
  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('holds-changes')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'Reservations', // Using your actual table name
      }, () => {
        // Refresh data when changes occur
        refreshHolds(user.id);
      })
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading your holds...</p>
      </div>
    );
  }

  const handleCancelHold = async (hold, userid) => {
    try {
      // Close dialog first to prevent UI lag
      setDialogOpen(false);
      
      const { error } = await supabase.rpc('reserve_item', {
        p_item_id: hold.item_id,
        p_client_id: userid,
        p_cancel: true
      });
      
      if (error) {
        console.error('Error canceling hold:', error);
        setNotification({
          message: `${error.message}`,
          type: 'error'
        });
        setTimeout(() => setNotification(null), 5000);
      } else {
        // Refresh data immediately after successful operation
        await refreshHolds(userid);
        
        setNotification({
          message: `Hold for "${hold.title}" successfully canceled!`,
          type: 'success'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error('Error processing hold cancellation:', err);
      setNotification({
        message: `${err.message}`,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const openDialog = (hold) => {
    setSelectedHold(hold);
    setDialogOpen(true);
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
      <Card>
        <CardHeader>
          <CardTitle>My Holds</CardTitle>
        </CardHeader>
        <CardContent>
          {holds.length === 0 ? (
            <p>You don't have any holds placed.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Reserved Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holds.map((hold, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{hold.title}</TableCell>
                    <TableCell>
                      {hold.reserved_at && !isNaN(new Date(hold.reserved_at).getTime())
                        ? new Date(hold.reserved_at).toLocaleDateString()
                        : 'No date available'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={hold.status === 'active' ? 'default' : 'secondary'}
                      >
                        {hold.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hold.status === 'active' && (
                        <Button 
                          size="sm" 
                          onClick={() => openDialog(hold)}
                        >
                          Manage
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Hold</DialogTitle>
            <DialogDescription>
              <p>Would you like to cancel this hold?</p>
              {selectedHold && (
                <i className="mt-2 font-medium">{selectedHold.title}</i>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Close
            </Button>
            <div className="space-x-2">
              <Button 
                variant="destructive" 
                onClick={() => selectedHold && user && handleCancelHold(selectedHold, user.id)}
              >
                Cancel Hold
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}