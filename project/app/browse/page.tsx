'use client'
import { createClient } from '@/supabase/client'
import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Book {
  item_id: string
  title: string
  availability_status: string
  renewal_allowed: boolean
  Books: {
    isbn: string
    author: string
    publication_year: number
  }[]
}

interface Magazine {
  item_id: string
  title: string
  availability_status: string
  renewal_allowed: boolean
  Magazine: {
    issue_number: string
    publish_date: string
  }[]
}

interface Media {
  item_id: string
  title: string
  availability_status: string
  renewal_allowed: boolean
  DigitalMedia: {
    creator: string
    media_type: string
  }[]
}

// Update the import
import { DataTablePagination, paginateData } from "@/components/ui/pagination"

export default function Page() {
  // Update state to include pageSize
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [books, setBooks] = useState<Book[] | null>(null)
  const [magazines, setMagazines] = useState<Magazine[] | null>(null)
  const [media, setMedia] = useState<Media[] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [authorFilter, setAuthorFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [issueFilter, setIssueFilter] = useState("")
  const [mediaTypeFilter, setMediaTypeFilter] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      const { data: booksData } = await supabase
        .from("Item")
        .select(`
          item_id, title, availability_status, renewal_allowed,
          Books!inner (
           isbn, author, publication_year
          )
        `)
      setBooks(booksData)

      const { data: magazinesData } = await supabase
        .from("Item")
        .select(`
          item_id, title, availability_status, renewal_allowed,
          Magazine!inner (
           issue_number, publish_date
          )
        `)
      setMagazines(magazinesData)

      const { data: mediaData } = await supabase
        .from("Item")
        .select(`
          item_id, title, availability_status, renewal_allowed,
          DigitalMedia!inner (
           creator, media_type
          )
        `)
      setMedia(mediaData)
    }

    fetchData()
  }, [])

  interface CombinedItem {
    type: 'book' | 'magazine' | 'media';
    item_id: string;
    title: string;
    availability_status: string;
    renewal_allowed: boolean;
    Books?: [{
      isbn: string;
      author: string;
      publication_year: string;
    }];
    Magazine?: [{
      issue_number: string;
      publish_date: string;
    }];
    DigitalMedia?: [{
      creator: string;
      media_type: string;
    }];
  }

  const getAllItems = (): CombinedItem[] => {
    const allItems = [
      ...(books?.map(item => ({
        ...item,
        type: 'book' as const,
        Books: Array.isArray(item.Books) ? item.Books : [item.Books]
      })) || []),
      ...(magazines?.map(item => ({
        ...item,
        type: 'magazine' as const,
        Magazine: Array.isArray(item.Magazine) ? item.Magazine : [item.Magazine]
      })) || []),
      ...(media?.map(item => ({
        ...item,
        type: 'media' as const,
        DigitalMedia: Array.isArray(item.DigitalMedia) ? item.DigitalMedia : [item.DigitalMedia]
      })) || [])
    ];

    return allItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || item.availability_status === statusFilter
      const matchesType = typeFilter === "all" || item.type === typeFilter
      
      let matchesDetails = true
      if (item.type === 'book' && item.Books?.[0]) {
        if (authorFilter && !item.Books[0].author.toLowerCase().includes(authorFilter.toLowerCase())) {
          matchesDetails = false
        }
        if (yearFilter && !item.Books[0].publication_year.toString().includes(yearFilter)) {
          matchesDetails = false
        }
      }
      if (item.type === 'magazine' && item.Magazine?.[0]) {
        if (issueFilter && !item.Magazine[0].issue_number.toString().toLowerCase().includes(issueFilter.toLowerCase())) {
          matchesDetails = false
        }
      }
      if (item.type === 'media' && item.DigitalMedia?.[0]) {
        if (mediaTypeFilter && item.DigitalMedia[0].media_type !== mediaTypeFilter) {
          matchesDetails = false
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesDetails
    });
  };
  
  // Update the paginatedItems function
  const paginatedItems = () => {
    const filteredItems = getAllItems()
    return paginateData(filteredItems, currentPage, pageSize)
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1)
          }}
          className="max-w-sm" />
        <Select 
          value={statusFilter} 
          onValueChange={(value) => {
            setStatusFilter(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="reference_only">Reference Only</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={typeFilter} 
          onValueChange={(value) => {
            setTypeFilter(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Item Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="book">Books</SelectItem>
            <SelectItem value="magazine">Magazines</SelectItem>
            <SelectItem value="media">Digital Media</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {typeFilter === 'book' && (
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Filter by author..."
            value={authorFilter}
            onChange={(e) => {
              setAuthorFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="max-w-sm" />
          <Input
            placeholder="Filter by year..."
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="max-w-sm" />
        </div>
      )}

      {typeFilter === 'magazine' && (
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Filter by issue number..."
            value={issueFilter}
            onChange={(e) => {
              setIssueFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="max-w-sm" />
        </div>
      )}

      {typeFilter === 'media' && (
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Filter by media type..."
            value={mediaTypeFilter}
            onChange={(e) => {
              setMediaTypeFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="max-w-sm" />
        </div>
      )}

      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Renewal Allowed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems().items.map((item) => (
              <TableRow key={item.item_id}>
                <TableCell className="font-medium">{item.type}</TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.availability_status}</TableCell>
                <TableCell>
                  {item.type === 'book' && item.Books?.[0] && (
                    <span>
                      Author: {item.Books[0].author}
                      <br />
                      ISBN: {item.Books[0].isbn}
                      <br />
                      Year: {item.Books[0].publication_year}
                    </span>
                  )}
                  {item.type === 'magazine' && item.Magazine?.[0] && (
                    <span>
                      Issue: {item.Magazine[0].issue_number}
                      <br />
                      Date: {item.Magazine[0].publish_date}
                    </span>
                  )}
                  {item.type === 'media' && item.DigitalMedia?.[0] && (
                    <span>
                      Creator: {item.DigitalMedia[0].creator}
                      <br />
                      Type: {item.DigitalMedia[0].media_type}
                    </span>
                  )}
                </TableCell>
                <TableCell>{item.renewal_allowed ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Button 
                    onClick={() => router.push(`/item/${item.item_id}`)}
                    variant="outline"
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Replace with the new pagination component */}
        <DataTablePagination
          currentPage={currentPage}
          totalItems={paginatedItems().totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  )
}