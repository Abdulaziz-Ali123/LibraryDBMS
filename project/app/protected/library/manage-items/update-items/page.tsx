'use client'

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

export default function UpdateItems() {
    // Search and selection states
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // Form states
    const [title, setTitle] = useState("");
    const [isbn, setISBN] = useState("");
    const [author, setAuthor] = useState("");
    const [publish, setPublish] = useState("");
    const [isReferenceOnly, setIsReferenceOnly] = useState(false);
    const [itemType, setItemType] = useState("");
    const [rarity, setRarity] = useState("");
    const [mediaType, setMediaType] = useState("");
    const [creator, setCreator] = useState("");
    const [issueNumber, setIssueNumber] = useState(1);
    
    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const supabase = createClient();

    // Search for items
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setError("Please enter a search term");
            return;
        }

        try {
            setIsSearching(true);
            setError('');
            
            // Search in the Item table
            const { data, error } = await supabase
                .from("Item")
                .select("*")
                .ilike('title', `%${searchTerm}%`);
                
            if (error) throw error;
            
            setSearchResults(data || []);
            if (data.length === 0) {
                setError("No items found matching your search");
            }
        } catch (err) {
            console.error("Search error:", err);
            setError(err instanceof Error ? err.message : "Error searching for items");
        } finally {
            setIsSearching(false);
        }
    };

    // Select an item and load its details
    const handleSelectItem = async (item) => {
        setSelectedItem(item);
        setTitle(item.title);
        setItemType(item.item_type);
        setRarity(item.rarity);
        setIsReferenceOnly(item.availability_status === "reference_only");
        
        // Reset specific fields
        setISBN("");
        setAuthor("");
        setPublish("");
        setMediaType("");
        setCreator("");
        setIssueNumber(1);
        
        // Fetch type-specific details
        try {
            let detailsData = null;
            let error = null;
            
            switch(item.item_type) {
                case 'book':
                    const bookResult = await supabase
                        .from("Books")
                        .select("*")
                        .eq('item_id', item.item_id)
                        .single();
                    
                    detailsData = bookResult.data;
                    error = bookResult.error;
                    
                    if (detailsData) {
                        setISBN(detailsData.isbn || "");
                        setAuthor(detailsData.author || "");
                        setPublish(detailsData.publication_year || "");
                    }
                    break;
                    
                case 'magazine':
                    const magazineResult = await supabase
                        .from("Magazine")
                        .select("*")
                        .eq('item_id', item.item_id)
                        .single();
                    
                    detailsData = magazineResult.data;
                    error = magazineResult.error;
                    
                    if (detailsData) {
                        setIssueNumber(detailsData.issue_number || 1);
                        setPublish(detailsData.publish_date || "");
                    }
                    break;
                    
                case 'media':
                    const mediaResult = await supabase
                        .from("DigitalMedia")
                        .select("*")
                        .eq('item_id', item.item_id)
                        .single();
                    
                    detailsData = mediaResult.data;
                    error = mediaResult.error;
                    
                    if (detailsData) {
                        setMediaType(detailsData.media_type || "CD");
                        setCreator(detailsData.creator || "");
                    }
                    break;
            }
            
            if (error) throw error;
            
        } catch (err) {
            console.error("Error fetching item details:", err);
            setError(err instanceof Error ? err.message : "Unable to fetch item details");
        }
    };

    // Handle form submission to update the item
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        
        if (!selectedItem) {
            setError("No item selected for update");
            return;
        }

        // Form validation
        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        // Type-specific validation
        switch(itemType) {
            case 'book':
                if (!author.trim()) {
                    setError("Author is required");
                    return;
                }
                if (!isbn.trim()) {
                    setError("ISBN is required");
                    return;
                }
                if (!publish.trim()) {
                    setError("Publication date is required");
                    return;
                }
                break;
            case 'magazine':
                if (issueNumber < 1) {
                    setError("Valid issue number is required");
                    return;
                }
                if (!publish.trim()) {
                    setError("Publication date is required");
                    return;
                }
                break;
            case 'media':
                if (!creator.trim()) {
                    setError("Creator is required");
                    return;
                }
                break;
        }

        try {
            setLoading(true);
            
            // Update main item info
            const { error: mainUpdateError } = await supabase
                .from("Item")
                .update({ 
                    title: title,
                    rarity: rarity,
                    availability_status: isReferenceOnly ? "reference_only" : "available"
                })
                .eq('item_id', selectedItem.item_id);
            
            if (mainUpdateError) throw mainUpdateError;

            // Update type-specific info
            switch(itemType) {
                case 'book':
                    const { error: bookError } = await supabase
                        .from("Books")
                        .update({ 
                            isbn: isbn,
                            author: author,
                            publication_year: publish
                        })
                        .eq('item_id', selectedItem.item_id);
                    
                    if (bookError) throw bookError;
                    break;

                case 'magazine':
                    const { error: magazineError } = await supabase
                        .from("Magazine")
                        .update({
                            issue_number: issueNumber,
                            publish_date: publish
                        })
                        .eq('item_id', selectedItem.item_id);
                    
                    if (magazineError) throw magazineError;
                    break;

                case 'media':
                    const { error: digitalError } = await supabase
                        .from("DigitalMedia")
                        .update({
                            media_type: mediaType,
                            creator: creator
                        })
                        .eq('item_id', selectedItem.item_id);
                    
                    if (digitalError) throw digitalError;
                    break;
            }
            
            setSuccess(true);
            
            // Also update search results to show the updated title
            setSearchResults(searchResults.map(item => 
                item.item_id === selectedItem.item_id ? {...item, title} : item
            ));
            
        } catch (err) {
            console.error("Update error:", err);
            setError(err instanceof Error ? err.message : "Unable to update item due to an unknown error");
        } finally {
            setLoading(false);
        }
    };

    const renderTypeSpecificFields = () => {
        switch(itemType) {
            case 'book':
                return (
                    <>
                        <div>
                            <Label htmlFor="author">Author</Label>
                            <Input 
                                id="author" 
                                value={author} 
                                onChange={(e) => setAuthor(e.target.value)} 
                            />
                        </div>
                        <div>
                            <Label htmlFor="isbn">ISBN</Label>
                            <Input 
                                id="isbn" 
                                value={isbn} 
                                onChange={(e) => setISBN(e.target.value)} 
                            />
                        </div>
                        <div>
                            <Label htmlFor="publish">Publication Year</Label>
                            <Input 
                                id="publish" 
                                type="date"
                                value={publish} 
                                onChange={(e) => setPublish(e.target.value)}
                            />
                        </div>
                    </>
                );
            case 'magazine':
                return (
                    <>
                        <div>
                            <Label htmlFor="issueNumber">Issue Number</Label>
                            <Input 
                                id="issueNumber" 
                                type="number"
                                value={issueNumber} 
                                onChange={(e) => setIssueNumber(parseInt(e.target.value))} 
                            />
                        </div>
                        <div>
                            <Label htmlFor="publish">Publish Date</Label>
                            <Input 
                                id="publish" 
                                type="date"
                                value={publish} 
                                onChange={(e) => setPublish(e.target.value)}
                            />
                        </div>
                    </>
                );
            case 'media':
                return (
                    <>
                        <div>
                            <Label htmlFor="mediaType">Media Type</Label>
                            <Select value={mediaType} onValueChange={setMediaType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select media type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CD">CD</SelectItem>
                                    <SelectItem value="AudioBook">AudioBook</SelectItem>
                                    <SelectItem value="Game">Game</SelectItem>
                                    <SelectItem value="DVD">DVD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="creator">Creator</Label>
                            <Input 
                                id="creator" 
                                value={creator} 
                                onChange={(e) => setCreator(e.target.value)} 
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <h2 className="text-2xl font-bold mb-4">Update Library Items</h2>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                    Item updated successfully!
                </div>
            )}
            
            {/* Search section */}
            <div className="flex gap-2">
                <Input
                    placeholder="Search for items by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow"
                />
                <Button 
                    onClick={handleSearch} 
                    disabled={isSearching}
                >
                    {isSearching ? "Searching..." : "Search"}
                </Button>
            </div>
            
            {/* Results section */}
            {searchResults.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">Search Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.map((item) => (
                            <Card key={item.item_id} className="cursor-pointer hover:bg-slate-50 transition-colors">
                                <CardContent className="p-4" onClick={() => handleSelectItem(item)}>
                                    <h4 className="font-medium">{item.title}</h4>
                                    <p className="text-sm text-gray-500">
                                        Type: {item.item_type}
                                        <br />
                                        Status: {item.availability_status}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Update form section */}
            {selectedItem && (
                <div className="border p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Update Item</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="title">Item Title</Label>
                            <Input 
                                id="title" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="itemType">Item Type</Label>
                            <Input 
                                id="itemType" 
                                value={itemType} 
                                disabled 
                                className="bg-gray-100"
                            />
                            <p className="text-sm text-gray-500 mt-1">Item type cannot be changed</p>
                        </div>

                        <div>
                            <Label htmlFor="isReferenceOnly">Reference Only</Label>
                            <Select value={isReferenceOnly ? "true" : "false"} onValueChange={(value) => setIsReferenceOnly(value === "true")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Is this item reference only?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="rarity">Rarity</Label>
                            <Select value={rarity} onValueChange={setRarity}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select rarity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="regular">regular</SelectItem>
                                    <SelectItem value="rare">rare</SelectItem>
                                    <SelectItem value="latest_issue">latest</SelectItem>
                                    <SelectItem value="high_demand">high_demand</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {renderTypeSpecificFields()}
                        
                        <div className="flex gap-2">
                            <Button 
                                type="submit" 
                                className="flex-grow" 
                                disabled={loading}
                            >
                                {loading ? "Updating..." : "Update Item"}
                            </Button>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setSelectedItem(null)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}