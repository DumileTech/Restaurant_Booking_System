/*
  # Update Restaurant Data - Cape Town, South Africa

  1. Data Updates
    - Replace existing restaurant data with Cape Town establishments
    - Update with authentic South African cuisine types
    - Use Cape Town neighborhoods and locations
    - Include local dining experiences

  2. Restaurant Features
    - Mix of fine dining and casual establishments
    - Traditional South African and international cuisines
    - Popular Cape Town dining areas
    - Realistic capacity and descriptions
*/

-- Clear existing restaurant data
DELETE FROM restaurants;

-- Insert Cape Town restaurant data
INSERT INTO restaurants (name, location, cuisine, capacity, description, image_url) VALUES
  (
    'The Test Kitchen', 
    'Woodstock, Cape Town', 
    'Contemporary South African', 
    60,
    'Award-winning restaurant offering innovative South African cuisine with global influences. Located in the trendy Woodstock area with stunning Table Mountain views.',
    'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
  ),
  (
    'La Colombe', 
    'Constantia, Cape Town', 
    'French-South African', 
    80,
    'Elegant fine dining restaurant in the heart of the Constantia wine region, serving French cuisine with South African flair and exceptional wine pairings.',
    'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg'
  ),
  (
    'Gold Restaurant', 
    'Green Point, Cape Town', 
    'African Continental', 
    120,
    'Authentic African dining experience featuring traditional dishes from across the continent, complete with cultural entertainment and communal dining.',
    'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg'
  ),
  (
    'Harbour House', 
    'V&A Waterfront, Cape Town', 
    'Seafood', 
    100,
    'Premium seafood restaurant overlooking the Atlantic Ocean at the V&A Waterfront, specializing in fresh West Coast seafood and sushi.',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
  ),
  (
    'Mama Africa', 
    'Long Street, Cape Town', 
    'Traditional African', 
    90,
    'Vibrant restaurant on historic Long Street serving traditional African cuisine including bobotie, potjiekos, and game meats with live African music.',
    'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg'
  ),
  (
    'Kloof Street House', 
    'Gardens, Cape Town', 
    'Modern South African', 
    70,
    'Charming Victorian house restaurant in Gardens serving modern South African cuisine with a focus on local ingredients and craft cocktails.',
    'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg'
  ),
  (
    'The Pot Luck Club', 
    'Woodstock, Cape Town', 
    'Contemporary Tapas', 
    50,
    'Trendy rooftop restaurant in the Old Biscuit Mill offering contemporary small plates with panoramic views of Table Mountain and the city.',
    'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
  ),
  (
    'Bokaap Kombuis', 
    'Bo-Kaap, Cape Town', 
    'Cape Malay', 
    40,
    'Authentic Cape Malay restaurant in the colorful Bo-Kaap quarter, serving traditional curries, bredie, and koeksisters in a historic setting.',
    'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg'
  ),
  (
    'Codfather Seafood', 
    'Camps Bay, Cape Town', 
    'Seafood', 
    85,
    'Popular seafood restaurant on the Camps Bay strip with ocean views, famous for fresh fish, calamari, and traditional fish and chips.',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
  ),
  (
    'Societi Bistro', 
    'Kalk Bay, Cape Town', 
    'Mediterranean-South African', 
    65,
    'Charming bistro in the fishing village of Kalk Bay, offering Mediterranean-inspired dishes with South African influences and fresh local seafood.',
    'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg'
  );

-- Update any existing bookings to use new restaurant IDs (if any exist)
-- This ensures data consistency after restaurant data update
UPDATE bookings SET restaurant_id = (
  SELECT id FROM restaurants ORDER BY created_at LIMIT 1
) WHERE restaurant_id NOT IN (
  SELECT id FROM restaurants
);

-- Log the update
INSERT INTO email_notifications (
  recipient_email,
  subject,
  body,
  created_at
) VALUES (
  'admin@tablerewards.co.za',
  'Restaurant Data Updated',
  'Restaurant data has been successfully updated with Cape Town establishments. The system now features authentic South African restaurants from various Cape Town neighborhoods including Woodstock, Constantia, V&A Waterfront, Long Street, Gardens, Bo-Kaap, Camps Bay, and Kalk Bay.',
  now()
);