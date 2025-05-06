"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      
      try {
        // Call the function
        const { data, error } = await supabase.rpc("get_peak_borrowing_stats");
        
        
        if (error) {
          setError(error.message || "Failed to fetch report data.");
          console.error("Error fetching data:", error);
        }
        
        if (data) {
          setData(data);
          setTotalItems(data.length);
        } else {
          console.log("No data received");
          setData([]);
          setTotalItems(0);
        }
      } catch (err) {
        console.error("Exception caught:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page changes
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-10">
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-white">Peak Borrowing Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-8 dark:text-gray-300">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No data available. The report may be empty.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 border dark:border-gray-600 text-left dark:text-gray-200">Borrow Date</th>
                    <th className="px-4 py-2 border dark:border-gray-600 text-left dark:text-gray-200">Borrow Hour</th>
                    <th className="px-4 py-2 border dark:border-gray-600 text-left dark:text-gray-200">Avg Borrowing Time (days)</th>
                    <th className="px-4 py-2 border dark:border-gray-600 text-left dark:text-gray-200">Overdue Book Rate (%)</th>
                    <th className="px-4 py-2 border dark:border-gray-600 text-left dark:text-gray-200">Total Collected Fines</th>
                    <th className="px-4 py-2 border dark:border-gray-600 text-left dark:text-gray-200">Peak Borrowing Count</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}>
                      <td className="px-4 py-2 border dark:border-gray-600 dark:text-gray-300">{row.borrow_date}</td>
                      <td className="px-4 py-2 border dark:border-gray-600 dark:text-gray-300">{row.borrow_hour}</td>
                      <td className="px-4 py-2 border dark:border-gray-600 dark:text-gray-300">{row.average_borrowing_time}</td>
                      <td className="px-4 py-2 border dark:border-gray-600 dark:text-gray-300">{row.overdue_book_rate}</td>
                      <td className="px-4 py-2 border dark:border-gray-600 dark:text-gray-300">{row.total_collected_fines}</td>
                      <td className="px-4 py-2 border dark:border-gray-600 dark:text-gray-300">{row.peak_borrowing_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {data.length > 0 && (
          <CardFooter className="flex justify-between items-center border-t dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} items
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousPage} 
                disabled={currentPage === 1}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}