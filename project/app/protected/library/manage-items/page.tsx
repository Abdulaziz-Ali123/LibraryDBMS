'use client'

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, Edit, Book, BookOpen, Film, Archive } from "lucide-react";

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ItemManagement() {
    const router = useRouter();
    const [hoveredCard, setHoveredCard] = useState(null);

    const handleNavigate = (path) => {
        router.push(path);
    };

    const cards = [
        {
            id: 'add',
            title: 'Add New Items',
            description: 'Add new books, magazines, or digital media to the library system.',
            icon: <PlusCircle className="h-10 w-10 text-primary" />,
            path: '/protected/library/manage-items/add-items',
            examples: [
                { icon: <Book size={16} />, text: 'Books with ISBN, author, and publication year' },
                { icon: <BookOpen size={16} />, text: 'Magazines with issue number and publish date' },
                { icon: <Film size={16} />, text: 'Digital media like CDs, DVDs, and games' }
            ]
        },
        {
            id: 'update',
            title: 'Update Existing Items',
            description: 'Search for and update details of items already in the system.',
            icon: <Edit className="h-10 w-10 text-primary" />,
            path: '/protected/library/manage-items/update-items',
            examples: [
                { icon: <Archive size={16} />, text: 'Change availability status and rarity' },
                { icon: <Book size={16} />, text: 'Update title, author, ISBN or other details' },
                { icon: <Film size={16} />, text: 'Correct information for any item type' }
            ]
        }
    ];

    return (
        <div className="container max-w-4xl py-12">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight">Library Item Management</h1>
                <p className="mt-4 text-muted-foreground text-lg">
                    Choose an operation to manage items in the library system
                </p>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {cards.map((card) => (
                    <Card 
                        key={card.id}
                        className={`${
                            hoveredCard === card.id 
                                ? 'border-primary shadow-md' 
                                : 'border-border'
                        } transition-all duration-300 cursor-pointer`}
                        onMouseEnter={() => setHoveredCard(card.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => handleNavigate(card.path)}
                    >
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                {card.icon}
                                <div>
                                    <CardTitle className="text-xl">{card.title}</CardTitle>
                                    <CardDescription className="text-sm">
                                        {card.description}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent>
                            <Separator className="mb-4" />
                            <div className="space-y-3">
                                {card.examples.map((example, index) => (
                                    <div key={index} className="flex items-center gap-2 text-muted-foreground">
                                        {example.icon}
                                        <span>{example.text}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        
                        <CardFooter>
                            <Button 
                                variant={hoveredCard === card.id ? "default" : "outline"} 
                                className="w-full"
                            >
                                {card.id === 'add' ? 'Add New Items' : 'Update Items'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="mt-12 text-center text-muted-foreground">
                <p>
                    Need help? Contact library system administrator
                </p>
            </div>
        </div>
    );
}