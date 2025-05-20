'use client'
import { createClient } from '@/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ItemPage() {
  const router = useRouter()
  const params = useParams()
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient();

  useEffect(() => {
    // Check authentication status - this needs to be async
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (data && data.user) {
        setUser(data.user)
      } else {
        setNotification({
          message: `Could not retriver user data`,
          type: 'errr'
        });
        setTimeout(() => setNotification(null), 5000); // Hide after 5 seconds
        console.log('Could not retriver user data: ', error)
      }
    }
    
    fetchUser()

    const fetchItem = async () => {
      // Use the already created supabase client
      const { data, error } = await supabase
        .from("Item")
        .select(`
          *,
          Books(*),
          Magazine(*),
          DigitalMedia(*)
        `)
        .eq('item_id', params.id)
        .single()

      if (error) {
        console.error('Error fetching item:', error)
        setItem(null)
      } else {
        setItem(data)
      }
      setLoading(false)
    }

    fetchItem()
  }, [params.id])

  const [processing, setProcessing] = useState<'reserve' | 'checkout' | null>(null);

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const handleReserve = async () => {
    setProcessing('reserve');

    const { data, error } = await supabase.from("Reservations").insert({
      item_id: params.id,
      client_id: user.id,
      status: "active"
    });

    if (!error) {
      setNotification({
        message: `Item "${item.title}" successfully reserved!`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 5000); // Hide after 5 seconds
    } else {
      setNotification({
        message: `${error.message}`,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    }
    setProcessing(null);
  }

  const handleCheckout = async () => {
    setProcessing('checkout');
    
    let { data, error } = await supabase
    .rpc('borrow_item', {
      p_client_id: user.id, 
      p_item_id: params.id
    })

    setProcessing(null);
    if (error) {
      setNotification({
        message: `${error.message}`,
        type: 'error'
      });
      console.log('Error borrowing item:', error)
      setTimeout(() => setNotification(null), 5000);
    } else {
      setNotification({
        message: `Item "${item.title}" successfully checked out!`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-lg dark:text-white">Loading...</p>
    </div>
  )
  
  if (!item) return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-lg text-red-500 dark:text-red-400">Item not found</p>
    </div>
  )

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      {notification && (
        <div className={`mb-6 p-4 rounded-md shadow-md ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 
          'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
        }`}>
          {notification.message}
        </div>
      )}
      
      <Button 
        variant="outline" 
        onClick={() => router.back()}
        className="mb-6"
      >
        ← Back
      </Button>

      <div className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">{item.title}</h1>
        
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="font-semibold dark:text-gray-200">Status:</p>
            <p className="dark:text-gray-300">{item.availability_status}</p>
            <p className="font-semibold dark:text-gray-200">Renewal Allowed:</p>
            <p className="dark:text-gray-300">{item.renewal_allowed ? "Yes" : "No"}</p>
          </div>
          
          {item.Books && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Book Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <p className="font-semibold dark:text-gray-200">Author:</p>
                <p className="dark:text-gray-300">{item.Books.author}</p>
                <p className="font-semibold dark:text-gray-200">ISBN:</p>
                <p className="dark:text-gray-300">{item.Books.isbn}</p>
                <p className="font-semibold dark:text-gray-200">Publication Year:</p>
                <p className="dark:text-gray-300">{item.Books.publication_year}</p>
              </div>
            </div>
          )}

          {item.Magazine && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Magazine Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <p className="font-semibold dark:text-gray-200">Issue Number:</p>
                <p className="dark:text-gray-300">{item.Magazine.issue_number}</p>
                <p className="font-semibold dark:text-gray-200">Publish Date:</p>
                <p className="dark:text-gray-300">{item.Magazine.publish_date}</p>
              </div>
            </div>
          )}

          {item.DigitalMedia && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Digital Media Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <p className="font-semibold dark:text-gray-200">Creator:</p>
                <p className="dark:text-gray-300">
                  {Array.isArray(item.DigitalMedia) 
                    ? item.DigitalMedia[0]?.creator 
                    : item.DigitalMedia.creator}
                </p>
                <p className="font-semibold dark:text-gray-200">Media Type:</p>
                <p className="dark:text-gray-300">
                  {Array.isArray(item.DigitalMedia) 
                    ? item.DigitalMedia[0]?.media_type 
                    : item.DigitalMedia.media_type}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 items-center mt-8">
          {!user ? (
            <Alert className="bg-blue-50 dark:bg-blue-900/30 mb-4">
              <AlertDescription className="text-center">
                Please{' '}
                <Button
                  variant="link"
                  className="px-1 text-blue-600 dark:text-blue-400"
                  onClick={() => router.push('/sign-in')}
                >
                  log in
                </Button>{' '}
                to reserve or check out items.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex gap-4">
              <Button 
                onClick={handleReserve}
                disabled={processing !== null}
                className="w-32"
              >
                {processing === 'reserve' ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 inline" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Reserve"
                )}
              </Button>
              <Button 
                onClick={handleCheckout}
                disabled={item.availability_status !== 'available' || processing !== null}
                className="w-32"
              >
                {processing === 'checkout' ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 inline" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Check Out"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}