"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/hooks/useNotification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CheckoutsPage() {
  const [user, setUser] = useState(null);
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const router = useRouter();
  const supabase = createClient();
  
  // Add a refresh function to fetch latest data
  const refreshCheckouts = async (userId) => {
    if (!userId) return;
    
    const { data, error } = await supabase.rpc('get_client_checkouts', { 
      p_client_id: userId, 
    });
    
    if (error) {
      console.error('Error fetching checkouts:', error);
      setNotification({
        message: `Failed to refresh data: ${error.message}`,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    } else {
      setCheckouts(data || []);
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
      await refreshCheckouts(user.id);
      setLoading(false);
    };

    getUser();
  }, [router]);
  
  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('checkouts-changes')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'Borrowing', // Adjust to your actual table name
      }, () => {
        // Refresh data when changes occur
        refreshCheckouts(user.id);
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
        <p className="text-lg">Loading your checkout history...</p>
      </div>
    );
  }

  const handleReturn = async (itm, userid) => {
    try {
      // Close dialog first to prevent UI lag
      setDialogOpen(false);
      
      const {data, error} = await supabase.rpc('return_item', {
        p_transaction_id: itm.transaction_id,
        p_item_id: itm.item_id,
        p_client_id: userid
      });
      
      if (error) {
        console.error('Error returning item:', error);
        setNotification({
          message: `${error.message}`,
          type: 'error'
        });
        setTimeout(() => setNotification(null), 5000);
      } else {
        // Refresh data immediately after successful operation
        await refreshCheckouts(userid);
        
        setNotification({
          message: `Item "${itm.title}" successfully returned!`,
          type: 'success'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error('Error processing return:', err);
      setNotification({
        message: `${err.message}`,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleRenew = async (itm, userid) => {
    try {
      // Close dialog first to prevent UI lag
      setDialogOpen(false);
      
      const { error } = await supabase.rpc('renew_item', {
        p_client_id: userid,
        p_item_id: itm.item_id,
        p_transaction_id: itm.transaction_id,
      });
      
      if (error) {
        console.error('Error renewing item:', error);
        setNotification({
          message: `Failed to renew: ${error.message}`,
          type: 'error'
        });
        setTimeout(() => setNotification(null), 5000);
      } else {
        // Refresh data immediately after successful operation
        await refreshCheckouts(userid);
        
        setNotification({
          message: `Item "${itm.title}" successfully renewed!`,
          type: 'success'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error('Error processing renewal:', err);
      setNotification({
        message: `${err.message}`,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const openDialog = (checkout) => {
    setSelectedCheckout(checkout);
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
          <CardTitle>My Checkout History</CardTitle>
        </CardHeader>
        <CardContent>
          {checkouts.length === 0 ? (
            <p>You haven't checked out any items yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Checkout Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkouts.map((checkout, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{checkout.title}</TableCell>
                    <TableCell>{new Date(checkout.borrow_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(checkout.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {checkout.return_date 
                        ? new Date(checkout.return_date).toLocaleDateString() 
                        : 'Not returned'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={!checkout.return_date ? 'destructive' : 'default'}
                      >
                        {!checkout.return_date ? 'Checked Out' : 'Returned'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!checkout.return_date && (
                        <Button 
                          size="sm" 
                          onClick={() => openDialog(checkout)}
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
            <DialogTitle>Manage Checkout</DialogTitle>
            <DialogDescription>
              <p>Would you like to return or renew this item?</p>
              {selectedCheckout && (
                <i className="mt-2 font-medium">{selectedCheckout.title}</i>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <div className="space-x-2">
              <Button 
                variant="default" 
                onClick={() => selectedCheckout && user && handleRenew(selectedCheckout, user.id)}
              >
                Renew
              </Button>
            </div>
            <div className="space-x-2">
              <Button 
                variant="destructive" 
                onClick={() => selectedCheckout && user && handleReturn(selectedCheckout, user.id)}
              >
                Return
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}