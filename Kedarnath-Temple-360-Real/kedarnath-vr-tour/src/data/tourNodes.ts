export interface GroundTransition {
  targetNodeId: string;
  yaw: number; // Azimuth angle in degrees (0 = North/Forward, 90 = East/Right, etc.)
  distance: number;
  label: string;
}

export interface InfoHotspot {
  id: string;
  yaw: number; // in degrees
  pitch: number; // in degrees (-90 to +90)
  title: string;
  badge: string;
  description: string;
  image?: string;
}

export interface TourNode {
  id: string;
  title: string;
  subtitle: string;
  panorama: string;
  initialYaw: number;
  initialPitch: number;
  mapCoords: { x: number; y: number }; // Percentage 0-100 on radar minimap
  transitions: GroundTransition[];
  hotspots: InfoHotspot[];
}

export const TOUR_NODES: Record<string, TourNode> = {
  "approach-walkway": {
    id: "approach-walkway",
    title: "Grand Pilgrim Walkway",
    subtitle: "Snowy Yatra Approach toward Kedarnath Dham",
    panorama: "/assets/drone_sec_20.jpg",
    initialYaw: 0,
    initialPitch: 0,
    mapCoords: { x: 50, y: 88 },
    transitions: [
      {
        targetNodeId: "nandi-approach",
        yaw: 0,
        distance: 14,
        label: "Walk to Nandi Plaza"
      }
    ],
    hotspots: [
      {
        id: "peaks-overview",
        yaw: 2,
        pitch: 24,
        title: "Kedar Massif and Snow Wall",
        badge: "6,831 m Summit",
        description: "The colossal north face of Mount Kedarnath and Kedar Dome towering majestically over the valley."
      },
      {
        id: "ashram-township",
        yaw: 65,
        pitch: -2,
        title: "Kedarnath Township and Ashrams",
        badge: "Pilgrim Lodges",
        description: "Multi-storey guest houses, GMVN lodges, and dharamshalas with distinctive red, blue, and silver roofs.",
        image: "/assets/drone_sec_1.jpg"
      },
      {
        id: "snow-banks",
        yaw: -45,
        pitch: -12,
        title: "High Himalayan Snowbanks",
        badge: "11,755 ft Altitude",
        description: "Pristine white snow blankets cleared on both sides of the central pilgrimage path where thousands of yatris walk."
      }
    ]
  },

  "nandi-approach": {
    id: "nandi-approach",
    title: "Shri Nandi Maharaj Plaza",
    subtitle: "Sacred Courtyard and Devotee Gathering",
    panorama: "/assets/kedarnath_360_day_courtyard.jpg",
    initialYaw: 0,
    initialPitch: 0,
    mapCoords: { x: 50, y: 68 },
    transitions: [
      {
        targetNodeId: "mandapa-steps",
        yaw: 0,
        distance: 10,
        label: "Climb Temple Steps"
      },
      {
        targetNodeId: "approach-walkway",
        yaw: 180,
        distance: 14,
        label: "Return to Approach Path"
      },
      {
        targetNodeId: "eastern-courtyard",
        yaw: 85,
        distance: 14,
        label: "Eastern Courtyard"
      }
    ],
    hotspots: [
      {
        id: "nandi-bull",
        yaw: -178,
        pitch: -18,
        title: "Shri Nandi Maharaj",
        badge: "Sacred Vahana",
        description: "Ancient monolithic black granite bull seated in prayer facing the Swayambhu Jyotirlinga. Pilgrims whisper their deepest prayers into his ear.",
        image: "/assets/nandi_real_side_om.png"
      },
      {
        id: "mandir-facade",
        yaw: 0,
        pitch: 12,
        title: "Kedarnath Mandir Facade",
        badge: "8th-Century Katyuri Architecture",
        description: "Built with colossal interlocking ashlar granite blocks without mortar, standing resilient for over a millennium against avalanches and floods.",
        image: "/assets/temple_real_exterior.jpg"
      },
      {
        id: "devotee-queue",
        yaw: 115,
        pitch: -6,
        title: "Devotee Darshan Queue",
        badge: "Holy Pilgrimage",
        description: "Pilgrims from every corner of India gathering with folded hands, chanting 'Har Har Mahadev' in reverent devotion."
      }
    ]
  },

  "mandapa-steps": {
    id: "mandapa-steps",
    title: "Mandapa Entrance Steps",
    subtitle: "Sacred Stone Steps and Brass Bells",
    panorama: "/assets/kedarnath_360_temple_close.jpg",
    initialYaw: 0,
    initialPitch: 6,
    mapCoords: { x: 50, y: 52 },
    transitions: [
      {
        targetNodeId: "nandi-approach",
        yaw: 180,
        distance: 10,
        label: "Step down to Plaza"
      },
      {
        targetNodeId: "eastern-courtyard",
        yaw: 85,
        distance: 12,
        label: "Eastern Parikrama Terrace"
      },
      {
        targetNodeId: "bhim-shila",
        yaw: -45,
        distance: 20,
        label: "Walk to Bhim Shila (Back)"
      }
    ],
    hotspots: [
      {
        id: "temple-portal",
        yaw: 0,
        pitch: 8,
        title: "Sanctum Portal (Toran)",
        badge: "Inner Garbhagriha",
        description: "Vibrant marigold floral toran framing the stone door, leading to the inner Sabha Mandapa and the sacred rock hump of Lord Shiva."
      },
      {
        id: "brass-bells",
        yaw: -32,
        pitch: 18,
        title: "Sacred Temple Bells (Ghanti)",
        badge: "Acoustic Resonance",
        description: "Multi-harmonic bronze bells rung by devotees before stepping inside the Mandapa to invoke divine awareness and peace."
      },
      {
        id: "shikhara-tower",
        yaw: 0,
        pitch: 42,
        title: "Ancient Shikhara and Golden Kalash",
        badge: "Sacred Pinnacle",
        description: "The Nagara-style stone spire crowned by an Amalaka and gilded copper-gold Kalash finial reflecting the morning Himalayan sun."
      }
    ]
  },

  "eastern-courtyard": {
    id: "eastern-courtyard",
    title: "Eastern Plinth and Evening Aarti",
    subtitle: "Side Terrace overlooking Valley and Shrines",
    panorama: "/assets/kedarnath_360_aarti_night.jpg",
    initialYaw: -80,
    initialPitch: 0,
    mapCoords: { x: 72, y: 46 },
    transitions: [
      {
        targetNodeId: "mandapa-steps",
        yaw: -85,
        distance: 12,
        label: "Temple Steps"
      },
      {
        targetNodeId: "bhim-shila",
        yaw: -28,
        distance: 18,
        label: "Walk around to Bhim Shila"
      },
      {
        targetNodeId: "nandi-approach",
        yaw: -150,
        distance: 14,
        label: "Nandi Plaza"
      }
    ],
    hotspots: [
      {
        id: "evening-aarti",
        yaw: -82,
        pitch: 6,
        title: "Evening Sandhya Aarti",
        badge: "Sacred Ritual",
        description: "As dusk falls, golden fairy lights illuminate the eaves while Vedic chanting, dhol drums, and shankh naad resonate across the mountains."
      },
      {
        id: "prayer-flags",
        yaw: 78,
        pitch: 15,
        title: "Himalayan Prayer Flags (Lungta)",
        badge: "Sacred Elements",
        description: "Fluttering 5-color flags representing Fire, Water, Earth, Air, and Space, carrying mantras of peace across the Himalayan wind."
      }
    ]
  },

  "bhim-shila": {
    id: "bhim-shila",
    title: "Miraculous Bhim Shila",
    subtitle: "Sacred Protector Megalith directly behind Sanctum",
    panorama: "/assets/kedarnath_360_bhim_shila.jpg",
    initialYaw: 0,
    initialPitch: 0,
    mapCoords: { x: 50, y: 24 },
    transitions: [
      {
        targetNodeId: "mandapa-steps",
        yaw: 180,
        distance: 18,
        label: "Return to Temple Front"
      },
      {
        targetNodeId: "eastern-courtyard",
        yaw: 135,
        distance: 18,
        label: "Eastern Terrace"
      },
      {
        targetNodeId: "bhairavnath-lookout",
        yaw: -45,
        distance: 22,
        label: "Ascend to Valley Lookout"
      }
    ],
    hotspots: [
      {
        id: "bhim-shila-rock",
        yaw: -4,
        pitch: -8,
        title: "Shri Bhim Shila",
        badge: "2013 Flood Miracle",
        description: "During the catastrophic June 2013 Himalayan deluge, this enormous monolithic granite boulder came tumbling down the glacial slope and stopped right behind the temple sanctum, diverting the flood waters around both sides and saving the temple.",
        image: "/assets/bhim_shila_darshan.jpg"
      },
      {
        id: "kedar-dome",
        yaw: 0,
        pitch: 28,
        title: "Mount Kedarnath and Glacier Wall",
        badge: "6,831 m Peak",
        description: "The immense snow and ice wall towering directly behind the temple, where the Chorabari and Companion glaciers originate."
      },
      {
        id: "rear-shikhara",
        yaw: 180,
        pitch: 22,
        title: "Back of Katyuri Shikhara",
        badge: "Ancient Masonry",
        description: "Looking back at the monolithic rear facade of the sanctum sanctorum showing chiseled stone block banding and floral motifs."
      }
    ]
  },

  "bhairavnath-lookout": {
    id: "bhairavnath-lookout",
    title: "Bhairavnath Valley Lookout",
    subtitle: "High-Angle Aerial Darshan of Kedarnath Dham",
    panorama: "/assets/drone_sec_10.jpg",
    initialYaw: 160,
    initialPitch: -10,
    mapCoords: { x: 30, y: 15 },
    transitions: [
      {
        targetNodeId: "bhim-shila",
        yaw: 135,
        distance: 22,
        label: "Descend to Bhim Shila"
      },
      {
        targetNodeId: "nandi-approach",
        yaw: 165,
        distance: 30,
        label: "Descend to Temple Plaza"
      }
    ],
    hotspots: [
      {
        id: "valley-basin",
        yaw: 162,
        pitch: -14,
        title: "Kedarnath Valley Basin",
        badge: "Glacial Amphitheatre",
        description: "A wide panoramic view of the entire temple complex nestled in the sacred basin at 3,583 meters above sea level."
      },
      {
        id: "flood-wall",
        yaw: -138,
        pitch: -15,
        title: "Curved Flood Diversion Wall",
        badge: "Modern Defense",
        description: "The heavy reinforced concrete retaining wall built along the Mandakini riverbed to safeguard the shrine from future glacial floods.",
        image: "/assets/drone_sec_1.jpg"
      }
    ]
  }
};