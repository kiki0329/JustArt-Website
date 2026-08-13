USE `justart`;

-- Seed initial paintings into the paintings table
INSERT INTO `paintings` (`id`, `title`, `artist`, `category`, `price`, `image_url`, `featured`) VALUES
(1, 'Whispers of Dawn', 'Elena Voss', 'Landscape', 85000.00, 'https://picsum.photos/seed/dawn_blue/400/500', 1),
(2, 'Eternal Silence', 'Marcus Reed', 'Portrait', 120000.00, 'https://picsum.photos/seed/silence_blue/400/500', 1),
(3, 'Crimson Horizon', 'Sophia Chen', 'Abstract', 95000.00, 'https://picsum.photos/seed/crimson_blue/400/500', 1),
(4, 'Dancing Shadows', 'Oliver Stone', 'Expressionism', 110000.00, 'https://picsum.photos/seed/shadow_blue/400/500', 1),
(5, 'Golden Afternoon', 'Clara Belle', 'Impressionism', 78000.00, 'https://picsum.photos/seed/golden_blue/400/500', 0),
(6, 'Midnight Reverie', 'Julian Cross', 'Surrealism', 130000.00, 'https://picsum.photos/seed/midnight_blue/400/500', 0),
(7, 'Ocean\'s Whisper', 'Nina Torres', 'Seascape', 92000.00, 'https://picsum.photos/seed/ocean_blue/400/500', 0),
(8, 'Autumn Melody', 'Henry Wright', 'Landscape', 68000.00, 'https://picsum.photos/seed/autumn_blue/400/500', 0),
(9, 'Celestial Dreams', 'Iris Moon', 'Abstract', 105000.00, 'https://picsum.photos/seed/celestial_blue/400/500', 0),
(10, 'Whispering Pines', 'David Grey', 'Landscape', 75000.00, 'https://picsum.photos/seed/pines_blue/400/500', 0),
(11, 'Silent Revolution', 'Zara Khan', 'Contemporary', 145000.00, 'https://picsum.photos/seed/revolution_blue/400/500', 0),
(12, 'Ethereal Bloom', 'Lily Rose', 'Floral', 82000.00, 'https://picsum.photos/seed/bloom_blue/400/500', 0),
(13, 'Urban Solitude', 'Arjun Mehta', 'Contemporary', 99000.00, 'https://picsum.photos/seed/urban_blue/400/500', 0),
(14, 'Mystic Gaze', 'Priya Sharma', 'Portrait', 135000.00, 'https://picsum.photos/seed/mystic_blue/400/500', 0),
(15, 'Rustic Charms', 'Ananya Reddy', 'Impressionism', 88000.00, 'https://picsum.photos/seed/rustic_blue/400/500', 0),
(16, 'Neon Dreams', 'Vikram Seth', 'Abstract', 150000.00, 'https://picsum.photos/seed/neon_blue/400/500', 0),
(17, 'Serene Shores', 'Meera Nair', 'Seascape', 72000.00, 'https://picsum.photos/seed/serene_blue/400/500', 0),
(18, 'Blossom Trail', 'Ravi Verma', 'Floral', 112000.00, 'https://picsum.photos/seed/blossom_blue/400/500', 0),
(19, 'Fading Echoes', 'Sana Khan', 'Expressionism', 97000.00, 'https://picsum.photos/seed/echoes_blue/400/500', 0),
(20, 'Tranquil Peaks', 'Aisha Kapoor', 'Landscape', 83000.00, 'https://picsum.photos/seed/peaks_blue/400/500', 0),
(21, 'Whimsical Forest', 'Kabir Singh', 'Surrealism', 125000.00, 'https://picsum.photos/seed/forest_blue/400/500', 0),
(22, 'Timeless Grace', 'Lakshmi Menon', 'Portrait', 140000.00, 'https://picsum.photos/seed/grace_blue/400/500', 0),
(23, 'Modern Muse', 'Rahul Khanna', 'Contemporary', 108000.00, 'https://picsum.photos/seed/muse_blue/400/500', 0),
(24, 'Golden Horizon', 'Maya Patel', 'Impressionism', 91000.00, 'https://picsum.photos/seed/horizon_blue/400/500', 0),
(25, 'Abstract Reality', 'Arnav Bose', 'Abstract', 160000.00, 'https://picsum.photos/seed/reality_blue/400/500', 0),
(26, 'Mountain Echo', 'Neha Gupta', 'Landscape', 79000.00, 'https://picsum.photos/seed/mountain_blue/400/500', 0)
ON DUPLICATE KEY UPDATE
    `title` = VALUES(`title`),
    `artist` = VALUES(`artist`),
    `category` = VALUES(`category`),
    `price` = VALUES(`price`),
    `image_url` = VALUES(`image_url`),
    `featured` = VALUES(`featured`);
