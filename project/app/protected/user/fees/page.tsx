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

export default function FeesPage() {
  const [user, setUser] = useState(null);
  const [borrowingDetails, setBorrowingDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [notification, setNotification] = useState(null);
  const router = useRouter();
  const supabase = createClient();
  
  // Add a refresh function to fetch latest data using the new RPC function
  const refreshFees = async (userId) => {
    if (!userId) return;
    
    // Get borrowing details using the RPC function
    const { data, error } = await supabase.rpc('get_borrowing_details', {
      p_client_id: userId
    });
    
    if (error) {
      console.error('Error fetching borrowing details:', error);
      setNotification({
        message: `Failed to refresh data: ${error.message}`,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    } else {
      // Filter out items with no fees
      const itemsWithFees = data.filter(item => item.remaining_fee_amount !== null);
      setBorrowingDetails(itemsWithFees || []);
    }
  };

  // Initial data loading
  useEffect(() => {9
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      // Use the refresh function
      await refreshFees(user.id);
      setLoading(false);
    };

    getUser();
  }, [router]);
  
  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;
    
    // Set up real-time subscription for borrowing changes
    const borrowingSubscription = supabase
      .channel('borrowing-changes')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'Borrowing',
      }, () => {
        refreshFees(user.id);
      })
      .subscribe();
    
    // Set up real-time subscription for payment changes
    const paymentSubscription = supabase
      .channel('payment-changes')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'Payment',
      }, () => {
        refreshFees(user.id);
      })
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      borrowingSubscription.unsubscribe();
      paymentSubscription.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading your fees...</p>
      </div>
    );
  }

  const handleMakePayment = async () => {
    try {
      // Close dialog first to prevent UI lag
      setDialogOpen(false);
      
      if (!selectedItem) return;
      
      // Format payment amount to exactly 2 decimal places to ensure consistent precision
      const adjustedAmount = parseFloat(paymentAmount.toFixed(2));
      
      const { error } = await supabase.rpc('insert_payment', {
        p_client_id: user.id,
        p_item_id: selectedItem.item_id,
        p_payment_amount: adjustedAmount,
        p_transaction_id: selectedItem.borrowing_transaction_id,
      });
      
      if (error) {
        console.error('Error making payment:', error);
        setNotification({
          message: `${error.message}`,
          type: 'error'
        });
        setTimeout(() => setNotification(null), 5000);
      } else {
        // Refresh data immediately after successful operation
        await refreshFees(user.id);
        
        setNotification({
          message: `Payment of $${adjustedAmount.toFixed(2)} successfully processed!`,
          type: 'success'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setNotification({
        message: `${err.message}`,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const openPaymentDialog = (item) => {
    // Format the payment amount to exactly 2 decimal places when opening the dialog
    setSelectedItem(item);
    setPaymentAmount(parseFloat(parseFloat(item.remaining_fee_amount).toFixed(2)));
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
          <CardTitle>My Fees</CardTitle>
        </CardHeader>
        <CardContent>
          {borrowingDetails.length === 0 ? (
            <p>You don't have any late items or outstanding fees.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Remaining Fee Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Fee Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {borrowingDetails.map((item, index) => {
                  const isPaid = item.fee_status === 'paid';
                  const remainingAmount = parseFloat(item.remaining_fee_amount);
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell>{new Date(item.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>${remainingAmount.toFixed(2)}</TableCell>
                      <TableCell>${parseFloat(item.paid_amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {isPaid ? (
                          <Badge variant="success">Paid</Badge>
                        ) : (
                          <Badge variant="destructive">Unpaid</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!isPaid && (
                          <Button 
                            size="sm" 
                            onClick={() => openPaymentDialog(item)}
                          >
                            Make Payment
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              <p>Please confirm payment for the late item:</p>
              {selectedItem && (
                <div className="mt-2">
                  <p className="font-medium">{selectedItem.item}</p>
                  <p className="text-sm text-gray-500">
                    Due date: {new Date(selectedItem.due_date).toLocaleDateString()}
                  </p>
                  <div className="mt-4">
                    <label htmlFor="amount" className="block text-sm font-medium">
                      Payment Amount ($)
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={paymentAmount}
                      onChange={(e) => {
                        // Ensure consistent precision when user changes the value
                        const value = parseFloat(parseFloat(e.target.value).toFixed(2));
                        setPaymentAmount(isNaN(value) ? 0 : value);
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      step="0.01"
                      min="0"
                      max={selectedItem ? parseFloat(parseFloat(selectedItem.remaining_fee_amount).toFixed(2)) : 0}
                    />
                  </div>
                </div>
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
            <Button 
              variant="default" 
              onClick={handleMakePayment}
            >
              Process Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}