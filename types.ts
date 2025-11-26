export enum AudioStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR',
}

export enum Tab {
  LIVE = 'LIVE',
  PODCAST = 'PODCAST',
}

export interface PodcastConfig {
  voiceName: string;
  speed: number;
}

export interface Voice {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  description: string;
}

export interface MusicStyle {
  id: string;
  name: string;
  description: string;
}

export const VOICE_OPTIONS: Voice[] = [
  { id: 'Puck', name: 'Puck', gender: 'Male', description: 'Energetic & Clear' },
  { id: 'Charon', name: 'Charon', gender: 'Male', description: 'Deep & Authoritative' },
  { id: 'Kore', name: 'Kore', gender: 'Female', description: 'Soothing & Calm' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male', description: 'Strong & Resonant' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Female', description: 'Gentle & Warm' },
];

export const ACCENT_OPTIONS = [
  "Neutral / International",
  "East African (Kenyan/Tanzanian)",
  "West African (Nigerian/Ghanaian)",
  "Southern African",
  "Black American",
  "British Received Pronunciation",
  "American (General)",
  "Indian / South Asian",
  "East Asian",
  "Australian",
  "French African"
];

export const MUSIC_STYLES: MusicStyle[] = [
  { id: 'none', name: 'No Background Music', description: 'Clean vocal recording only.' },
  { id: 'tribal', name: 'Tribal Percussion', description: 'Rhythmic drums, kalimba, and energetic beats.' },
  { id: 'cinematic', name: 'Cinematic Safari', description: 'Sweeping orchestral swells and adventurous tones.' },
  { id: 'nature', name: 'Wild Nature', description: 'Ambient savannah sounds, birds, and wind.' },
  { id: 'jazz', name: 'Lounge Jazz', description: 'Soft, sophisticated piano and bass background.' },
  { id: 'lofi', name: 'Lo-Fi Chill', description: 'Relaxed, modern beats for a casual vibe.' },
  { id: 'ambient', name: 'Ethereal Ambient', description: 'Dreamy, floating textures and pads.' },
];

export const MANUSCRIPT_DEFAULT = `Welcome back to Travel Diaries podcast: Experience Wild Africa—the podcast that takes you 
deep into the heart of the continent, where breathtaking beauty and raw, untamed nature await. 
I’m your Holly Rubenstein, and today, we’re peeling back the curtain on the incredible, expertly
curated safari packages from Jackal Wild Adventures. 
If you’ve ever dreamt of standing face-to-face with a mountain gorilla, witnessing the Great 
Migration, or relaxing on a spice-scented beach after a thrilling game drive, then grab your 
imaginary passport. Jackal Wild Adventures specializes in crafting transformative journeys 
across Uganda, Rwanda, Kenya, and Tanzania. Jackal Wild Adventures doesn't just offer 
trips; they offer immersion. Let’s dive into four packages that showcase the depth and diversity 
of the Jackal Wild Adventures experience. 

SEGMENT 1: THE PRIMEVAL FOREST CALL 
HOST: We start where the dense emerald canopy reigns supreme: the ancient, misty jungles of 
Rwanda and Uganda. Jackal Wild Adventures features the 4-Day Private Rwanda Gorilla 
Trekking Experience. This package from Jackal Wild Adventures is the definition of 
exclusive, intimate adventure. Your adventure unfolds in Volcanoes National Park, where you 
hike through a misty, primeval jungle. The focus of this journey from Jackal Wild Adventures is 
purely on the primates: the awe-inspiring Mountain Gorillas, and often, tracking the playful 
Golden Monkeys. The private nature of this tour from Jackal Wild Adventures ensures a level 
of luxury and exclusivity, with handpicked lodges offering impeccable service. If your heart beats 
for unparalleled rainforest beauty, this focused, high-end experience from Jackal Wild 
Adventures is your journey. 

SEGMENT 2: THE SAVANNAH TITANS & SANDY BEACHES 
HOST: Next, we shift to the vast, golden plains, showcasing the classic African safari provided 
by Jackal Wild Adventures. 
First, consider the 8-Day Luxury Kenya Safari. This tour, arranged by Jackal Wild 
Adventures, is for the traveler who wants the Big Five spectacle paired with a rich cultural 
experience and pure luxury. The itinerary from Jackal Wild Adventures typically includes 
iconic locations like Amboseli National Park and the legendary Maasai Mara National Reserve. 
What makes this exceptional is that Jackal Wild Adventures ensures you engage with the 
local Maasai culture, transforming the trip into a truly "unrivalled cultural adventure". As a 
luxury package from Jackal Wild Adventures, the accommodations are superb, featuring 
exclusive tented camps or opulent lodges. 
Second, there is the 10-Day Tanzania Wildlife Safari and Zanzibar Getaway. This package 
solves the age-old dilemma: bush or beach? This is Jackal Wild Adventures' signature "Bush 
and Beach" combination. You visit the Serengeti National Park (the epicenter of the Great 
Migration) and the wildlife haven of the Ngorongoro Crater. The grand finale, perfectly planned 
by Jackal Wild Adventures, is a flight to Zanzibar, the Spice Island. The transition itself, from 
the exhilarating dust of the game vehicle to the tranquil white sand and turquoise waters, is the 
highlight of this itinerary from Jackal Wild Adventures. This package from Jackal Wild 
Adventures maximizes East African diversity in one perfect holiday. 

SEGMENT 3: THE GRAND TOUR 
HOST: Finally, for the ultimate adventurer, Jackal Wild Adventures offers journeys that 
seamlessly cross borders, linking the best of East Africa. 
The 8-Day African Safari Holiday Visiting Rwanda and Uganda is a masterclass in regional 
connectivity. This package, expertly arranged by Jackal Wild Adventures, is strictly primate
focused, combining the high-altitude Mountain Gorilla trek in Rwanda with the broader wildlife 
and chimpanzee trekking opportunities Uganda is famous for. Jackal Wild Adventures 
manages the logistical challenge of a two-country, eight-day itinerary flawlessly, delivering 
maximum adventure in a compact time frame. This journey, created by Jackal Wild 
Adventures, offers a comparative view of primate trekking in different environments. 

CONCLUSION 
HOST: From the luxurious, intimate experience of tracking gorillas, to the colossal wildlife 
spectacles of the Serengeti, Jackal Wild Adventures truly delivers an "Experience Wild 
Africa". 
Whether you seek the rush of the Great Migration, the tranquility of a Zanzibar beach, or the life
changing gaze of a Mountain Gorilla, your next adventure starts here with Jackal Wild 
Adventures. 
To view these specific packages, customize your own tour, or request a quote for your ultimate 
safari, visit JackalWildAdventures.com/jackal-tour-holidays. Don't just dream about Africa— 
experience it with Jackal Wild Adventures.`;