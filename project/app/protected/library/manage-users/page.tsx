'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Edit, Users, UserPlus, UserCog } from "lucide-react";

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function UserManagement() {
    const router = useRouter();
    const [hoveredCard, setHoveredCard] = useState(null);

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    const cards = [
        {
            id: 'add',
            title: 'Add New User',
            description: 'Register a new user account in the library system.',
            icon: <UserPlus className="h-10 w-10 text-primary" />,
            path: '/protected/library/manage-users/add-user',
            examples: [
                { icon: <Users size={16} />, text: 'Client or staff' },
                { icon: <UserPlus size={16} />, text: 'Assign membership type' },
                { icon: <UserCog size={16} />, text: 'Set initial permissions' }
            ]
        }
    ];

    return (
        <div className="container max-w-4xl py-12">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="mt-4 text-muted-foreground text-lg">
                    Choose an operation to manage users in the library system
                </p>
            </div>

            <Separator className="my-6" />

            <div className="flex justify-center">
                {cards.map((card) => (
                    <Card 
                        key={card.id}
                        className={`${
                            hoveredCard === card.id 
                                ? 'border-primary shadow-md' 
                                : 'border-border'
                        } transition-all duration-300 cursor-pointer max-w-md w-full`}
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
                                {card.id === 'add' ? 'Add New User' : 'Update User'}
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