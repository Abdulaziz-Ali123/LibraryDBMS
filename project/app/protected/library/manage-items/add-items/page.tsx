'use client'

import { useState } from "react";
import { createClient } from "@/supabase/client";  // Change this line
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddItems() {
    const [title, setTitle] = useState("");
    const [isbn, setISBN] = useState("");
    const [author, setAuthor] = useState("");
    const [publish, setPublish] = useState("mm/dd/yyyy");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [isReferenceOnly, setIsReferenceOnly] = useState(false);
    const [itemType, setItemType] = useState("book");
    const [rarity, setRarity] = useState("regular");
    const [mediaType, setMediaType] = useState("CD");
    const [creator, setCreator] = useState("");
    const [issueNumber, setIssueNumber] = useState(1);
    
    const supabase = createClient(); 
    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

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
                if (!publish.trim() || publish === "mm/dd/yyyy") {
                    setError("Publication date is required");
                    return;
                }
                break;
            case 'magazine':
                if (issueNumber < 1) {
                    setError("Valid issue number is required");
                    return;
                }
                if (!publish.trim() || publish === "mm/dd/yyyy") {
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
            
            const { data: firstInsertData, error: firstInsertError } = await supabase
                .from("Item")
                .insert([{ 
                    title: title,
                    item_type: itemType,
                    availability_status: isReferenceOnly ? "reference_only" : "available",
                    rarity: rarity
                }])
                .select();
            
            if (firstInsertError) throw firstInsertError;
            const itemId = firstInsertData![0].item_id;

            try {
                // Insert into specific table based on item type
                switch(itemType) {
                    case 'book':
                        const { error: bookError } = await supabase
                            .from("Books")
                            .insert([{ 
                                item_id: itemId,
                                isbn: isbn,
                                author: author,
                                publication_year: publish
                            }]);
                        if (bookError) throw bookError;
                        break;

                    case 'magazine':
                        const { error: magazineError } = await supabase
                            .from("Magazine")
                            .insert([{
                                item_id: itemId,
                                issue_number: issueNumber,
                                publish_date: publish
                            }]);
                        if (magazineError) throw magazineError;
                        break;

                    case 'media':
                        const { error: digitalError } = await supabase
                            .from("DigitalMedia")
                            .insert([{
                                item_id: itemId,
                                media_type: mediaType,
                                creator: creator
                            }]);
                        if (digitalError) throw digitalError;
                        break;
                }
            } catch (typeError) {
                // If type-specific insert fails, delete the main item
                const { error: deleteError } = await supabase
                    .from("Item")
                    .delete()
                    .eq('id', itemId);
                
                throw deleteError; // Re-throw the error to be caught by outer catch
            }
            
            setSuccess(true);
            // Reset form fields based on type
            setTitle("");
            setItemType(itemType);
            resetTypeSpecificFields();
            
        } catch (err) {
            console.error("Submit error:", err);
            setError(err instanceof Error ? err.message : "Unable to add item do to an unknown error");
        } finally {
            setLoading(false);
        }
    };

    const resetTypeSpecificFields = () => {
        setISBN("");
        setAuthor("");
        setPublish("mm/dd/yyyy");
        setMediaType("CD");
        setCreator("");
        setIssueNumber(1);
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
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}
            
            {success && (
                <>
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                        {itemType.charAt(0).toUpperCase() + itemType.slice(1)} added successfully!
                    </div>
                    {setTimeout(() => {
                        setSuccess(false);
                    }, 3000)}
                </>
            )}
            
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
                    <Select value={itemType} onValueChange={setItemType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="book">Book</SelectItem>
                            <SelectItem value="magazine">Magazine</SelectItem>
                            <SelectItem value="media">Digital Media</SelectItem>
                        </SelectContent>
                    </Select>
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
                
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Adding..." : `Add ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
                </Button>
            </form>
        </div>
    );
}
