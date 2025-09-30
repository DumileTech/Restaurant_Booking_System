// components/ui/menu-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMenuItems } from '@/lib/actions/restaurant.actions';
import type { Database } from '@/lib/supabase';

// Define the type for a single menu item based on your DB schema
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface MenuCardProps {
    restaurantId: string;
}

// A small, reusable component for displaying a single menu item
function MenuItemDisplay({ item }: { item: MenuItem }) {
    return (
        <div className="flex justify-between items-start gap-4 py-3">
            <div>
                <p className="font-semibold">{item.name}</p>
                {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                )}
            </div>
            <p className="font-medium text-right whitespace-nowrap">${item.price}</p>
        </div>
    );
}

// The main card component that fetches and organizes the menu
export default async function MenuCard({ restaurantId }: MenuCardProps) {
    const { success, data: menuItems } = await getMenuItems(restaurantId);

    // If the fetch fails or there are no menu items, don't render the card.
    if (!success || !menuItems || menuItems.length === 0) {
        return null;
    }

    // Group menu items by their category for structured display
    const groupedMenu = menuItems.reduce((acc, item) => {
        const category = item.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);

    // Define the desired order for categories to appear on the menu
    const categoryOrder = ['Appetizer', 'Main Course', 'Side', 'Dessert', 'Drink'];

    // Sort the actual categories from the data based on our defined order
    const sortedCategories = Object.keys(groupedMenu).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        // Handle categories that might not be in our order list
        return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {sortedCategories.map((category) => (
                    <div key={category}>
                        <h3 className="text-lg font-semibold border-b pb-2 mb-1">{category}</h3>
                        <div className="divide-y">
                            {groupedMenu[category].map((item) => (
                                <MenuItemDisplay key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}