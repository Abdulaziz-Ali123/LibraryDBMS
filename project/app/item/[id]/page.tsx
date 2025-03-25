'use client'
import { createClient } from '@/utils/supabase/client'
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

  useEffect(() => {
    const supabase = createClient()
    
    // Check authentication status 
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const fetchItem = async () => {
      const supabase = createClient()
      
      // Try to fetch digital media
      const { data: mediaData, error: mediaError } = await supabase
        .from("Item")
        .select(`*, DigitalMedia(*)`)  // Removed inner join
        .eq('item_id', params.id)
        .single()

      if (mediaData && mediaData.DigitalMedia) {
        console.log('Digital Media Data:', mediaData)  // Add logging
        setItem(mediaData)
        setLoading(false)
        return
      }

      // Try other types if not digital media
      const { data: magazineData, error: magazineError } = await supabase
        .from("Item")
        .select(`*, Magazine!inner(*)`)  // Changed to inner join
        .eq('item_id', params.id)
        .single()

      if (magazineData) {
        console.log('Magazine Data:', magazineData)  // Add logging
        setItem(magazineData)
        setLoading(false)
        return
      }

      // If not a magazine, try other types
      const { data: bookData } = await supabase
        .from("Item")
        .select(`*, Books!inner(*)`)
        .eq('item_id', params.id)
        .single()

      const { data: digitalMediaData } = await supabase
        .from("Item")
        .select(`*, DigitalMedia!inner(*)`)
        .eq('item_id', params.id)
        .single()

      setItem(bookData || mediaData)
      setLoading(false)
    }

    fetchItem()
  }, [params.id])

  const handleReserve = async () => {
    // Implement reserve logic
    console.log('Reserve item:', item.item_id)
  }

  const handleCheckout = async () => {
    // Implement checkout logic
    console.log('Checkout item:', item.item_id)
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
                disabled={item.availability_status !== 'available'}
                className="w-32"
              >
                Reserve
              </Button>
              <Button 
                onClick={handleCheckout}
                disabled={item.availability_status !== 'available'}
                className="w-32"
              >
                Check Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}