// Legendary Card Artwork URLs
// Add custom artwork paths here for each legendary bird
// Upload images to /public/ folder and reference them here

export const LEGENDARY_ARTWORKS: Record<string, string> = {
    'uhu': '/legendary-cards/uhu.jpeg',
    'seeadler': '/legendary-seeadler.jpg',
    'grosstrappe': '/legendary-grosstrappe.jpg',
    'auerhuhn': '/legendary-auerhuhn.jpg',
    'schwarzstorch': '/legendary-schwarzstorch.jpg',
    'schreiadler': '/legendary-schreiadler.jpg',
    'kornweihe': '/legendary-kornweihe.jpg',
    'sumpfohreule': '/legendary-sumpfohreule.jpg',
    'raubwuerger': '/legendary-raubwuerger.jpg',
    'goldregenpfeifer': '/legendary-goldregenpfeifer.jpg',
};

// Helper function to get artwork URL for a bird
export const getLegendaryArtwork = (birdId: string): string | null => {
    return LEGENDARY_ARTWORKS[birdId] || null;
};
