/**
 * MASTERPLAN DATA: 8K DAY & NIGHT BASEMAPS + DUAL CALIBRATED COORDINATES & GALLERIES
 * Optimized WebP 8K Basemaps & High-Speed Media Assets
 */

const MASTERPLAN_CONFIG = {
  dayImageUrl: 'assets/8K.webp',
  nightImageUrl: 'assets/night_8k.webp',
  width: 5504,
  height: 3072
};

// Exact Calibrated Road Waypoints (Day & Night)
const ROAD_WAYPOINTS_DAY = [
  { id: 'pin-1', coords: [337, 832] },   // Culture & Heritage
  { id: 'pin-2', coords: [875, 1744] },  // Knowledge
  { id: 'pin-3', coords: [1281, 2438] }, // Entertainment
  { id: 'pin-4', coords: [1733, 3218] }, // Commercial
  { id: 'pin-5', coords: [2245, 4137] }  // Performance
];

const ROAD_WAYPOINTS_NIGHT = [
  { id: 'pin-1', coords: [226, 930] },   // Culture & Heritage
  { id: 'pin-2', coords: [751, 1756] },  // Knowledge
  { id: 'pin-3', coords: [1238, 2504] }, // Entertainment
  { id: 'pin-4', coords: [1713, 3285] }, // Commercial
  { id: 'pin-5', coords: [2263, 4183] }  // Performance
];

// 5 Interactive Sequential Pins with AI images in circles + Zone Folders for Galleries
const PINS_DATA = [
  {
    id: 'pin-1',
    step: 1,
    number: '01',
    title: 'Culture & Heritage',
    tag: 'ZONE 01 · HERITAGE AXIS',
    coords: [337, 832],
    dayCoords: [337, 832],
    nightCoords: [226, 930],
    scale: 1.1,
    overlayUrl: 'assets/01.png',
    previewImg: 'assets/zone_01_ai.png',
    status: 'Unlocked',
    description: 'A celebration of cultural identity, monumental architectural heritage, and historical storytelling welcoming visitors to El Ahram Street.',
    gallery: [
      'assets/CULTURE ZONE/03.webp',
      'assets/CULTURE ZONE/04.webp',
      'assets/CULTURE ZONE/05.webp',
      'assets/CULTURE ZONE/08.webp',
      'assets/CULTURE ZONE/09.webp',
      'assets/CULTURE ZONE/10.webp',
      'assets/CULTURE ZONE/11.webp',
      'assets/CULTURE ZONE/12.webp',
      'assets/CULTURE ZONE/13.webp'
    ]
  },
  {
    id: 'pin-2',
    step: 2,
    number: '02',
    title: 'Knowledge',
    tag: 'ZONE 02 · INNOVATION & DISCOVERY',
    coords: [875, 1744],
    dayCoords: [875, 1744],
    nightCoords: [751, 1756],
    scale: 1.1,
    overlayUrl: 'assets/02.png',
    previewImg: 'assets/zone_02_ai.png',
    status: 'Active Zone',
    description: 'An intellectual and educational district featuring interactive public exhibits, monumental libraries, and innovation showcases.',
    gallery: [
      'assets/KNOWLEDGE ZONE/01.webp',
      'assets/KNOWLEDGE ZONE/02.webp',
      'assets/KNOWLEDGE ZONE/03.webp',
      'assets/KNOWLEDGE ZONE/04.webp',
      'assets/KNOWLEDGE ZONE/05.webp',
      'assets/KNOWLEDGE ZONE/06.webp'
    ]
  },
  {
    id: 'pin-3',
    step: 3,
    number: '03',
    title: 'Entertainment',
    tag: 'ZONE 03 · LEISURE & PLAZA',
    coords: [1281, 2438],
    dayCoords: [1281, 2438],
    nightCoords: [1238, 2504],
    scale: 1.1,
    overlayUrl: 'assets/03.png',
    previewImg: 'assets/zone_03_ai.png',
    status: 'Main Landmark',
    description: 'The monumental central plaza with kinetic water fountains, gathering spaces, open-air art installations, and social attractions.',
    gallery: [
      'assets/Entertainment Division/magnific_use-the-original-architec_IfCVdPQtvE.webp',
      'assets/Entertainment Division/magnific_use-the-original-architec_aFHdI4PfSh.webp',
      'assets/Entertainment Division/magnific_use-the-original-architec_kslCHYr16B.webp',
      'assets/Entertainment Division/magnific_use-the-original-architec_lJObrpCgv9.webp',
      'assets/Entertainment Division/magnific_use-the-original-architec_s7Jq1pcl8e.webp',
      'assets/Entertainment Division/magnific_use-the-original-architec_yi3LUIvPW9.webp'
    ]
  },
  {
    id: 'pin-4',
    step: 4,
    number: '04',
    title: 'Commercial',
    tag: 'ZONE 04 · RETAIL & DINING',
    coords: [1733, 3218],
    dayCoords: [1733, 3218],
    nightCoords: [1713, 3285],
    scale: 1.1,
    overlayUrl: 'assets/04.png',
    previewImg: 'assets/zone_04_ai.png',
    status: 'Commercial Spine',
    description: 'A premium lifestyle boulevard offering boutique retail stores, shaded outdoor cafes, gourmet restaurants, and active street fronts.',
    gallery: [
      'assets/Commercial Division/magnific_create-a-premium-humaneye_bxjhRLb5Y2.webp',
      'assets/Commercial Division/magnific_create-a-premium-humaneye_s7JHZfil8e.webp',
      'assets/Commercial Division/magnific_use-the-original-architec_jUwFelJLD0.webp',
      'assets/Commercial Division/magnific_use-the-original-architec_u5K8Gq8QLD.webp'
    ]
  },
  {
    id: 'pin-5',
    step: 5,
    number: '05',
    title: 'Performance',
    tag: 'ZONE 05 · GRAND SANCTUARY',
    coords: [2245, 4137],
    dayCoords: [2245, 4137],
    nightCoords: [2263, 4183],
    scale: 1.1,
    overlayUrl: 'assets/05.png',
    previewImg: 'assets/zone_05_ai.png',
    status: 'Grand Stage',
    description: 'The monumental civic plaza and amphitheater in front of the Grand Dome designed for grand spectacles, theatrical shows, and civic ceremonies.',
    gallery: [
      'assets/Performance Division/Fav 02.webp',
      'assets/Performance Division/magnific_create-a-dynamic-premium-_eItGvIrdqL.webp',
      'assets/Performance Division/magnific_create-a-highend-humaneye_mEuVHHVhJQ.webp',
      'assets/Performance Division/magnific_create-a-highly-atmospher_gOyHNMASXO.webp',
      'assets/Performance Division/magnific_create-a-premium-cinemati_gOyq93FSXO.webp',
      'assets/Performance Division/magnific_create-a-premium-humaneye_Do8Zha5pcl.webp',
      'assets/Performance Division/magnific_create-a-premium-humaneye_jUwuO6vLD0.webp',
      'assets/Performance Division/magnific_create-a-premium-humaneye_nVM4epvYQD.webp',
      'assets/Performance Division/magnific_create-a-premium-humaneye_s7JQPaAl8e.webp',
      'assets/Performance Division/magnific_create-a-premium-photorea_dtmGfIrXSL.webp',
      'assets/Performance Division/magnific_create-a-premium-photorea_mEuTqNHhJQ.webp',
      'assets/Performance Division/magnific_create-a-premium-photorea_ovaWE5z829.webp',
      'assets/Performance Division/magnific_create-a-premium-photorea_xSUEJOxjfW.webp',
      'assets/Performance Division/magnific_create-a-quiet-intimate-h_6AGgYY0iJO.webp'
    ]
  }
];
