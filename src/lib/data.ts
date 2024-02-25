import { colors } from "./colors";

export interface Playlist {
  id: string;
  albumId: number;
  title: string;
  color: (typeof colors)[keyof typeof colors];
  cover: string;
  artists: string[];
}

export const playlists: Playlist[] = [
  {
    id: '1',
    albumId: 1,
    title: "Chill Lo-Fi Music",
    color: colors.yellow,
    cover:
      "https://vinyl.lofirecords.com/cdn/shop/products/VINYL_MORNING_COFFEE_4-min.png?v=1680526353",
    artists: ["NoSpirit", "Casiio"],
  },
  {
    id: '2',
    albumId: 2,
    title: "Lo-Fi Chill Session",
    color: colors.green,
    cover:
      "https://vinyl.lofirecords.com/cdn/shop/files/2amsynth-vinyl.png?v=1693312187",
    artists: ["Kupla", "Blue Fox"],
  },
  {
    id: '3',
    albumId: 3,
    title: "Study Session",
    color: colors.rose,
    cover:
      "https://f4.bcbits.com/img/a1435058381_65.jpg",
    artists: ["Tenno", "xander", "Team Astro"],
  },
  {
    id: '4',
    albumId: 4,
    title: "Blue Note Study Time",
    color: colors.blue,
    cover:
      "https://f4.bcbits.com/img/a1962013209_16.jpg",
    artists: ["Raimu", "Yasumu"],
  },
  {
    id: '5',
    albumId: 5,
    title: "Chau Saura Session",
    color: colors.purple,
    cover:
      "https://f4.bcbits.com/img/a2793859494_16.jpg",
    artists: ["Chau Saura", "amies", "kyu"],
  },
  {
    id: '6',
    albumId: 6,
    title: "Like a Necessity",
    color: colors.orange,
    cover:
      "https://f4.bcbits.com/img/a0363730459_16.jpg",
    artists: ["WFS", "Nadav Cohen"],
  },
];

export const favourites: Playlist[] = [
  {
    id: '7',
    albumId: 7,
    title: "Spanish Pop",
    color: colors.red,
    cover:
      "https://i.scdn.co/image/003b3922fbca06a7c7d16fd7ba9be8768279d485",
    artists: ["Estopa", "La Oreja de Van Gogh", "M-Clan"],
  },
  {
    id: '8',
    albumId: 8,
    title: "Deutsch Lieder",
    color: colors.yellow,
    cover:
      "https://i.scdn.co/image/ab67616d0000b273894e6624668d19eb2282c03b",
    artists: ["Kupla", "Blue Fox"],
  },
];

export const morePlaylists = playlists.map((item) => ({
  ...item,
  id: item.id + "_more",
}))

export const sidebarPlaylists = playlists.map((item) => ({
  ...item,
  id: item.id + "_side",
}))

export const allPlaylists = [
  ...playlists,
  ...favourites,
  ...morePlaylists,
  ...sidebarPlaylists,
]

export interface Song {
  id: number;
  albumId: number;
  title: string;
  image: string;
  artists: string[];
  album: string;
  duration: string;
}

export const songs: Song[] = [
  {
    "id": 1,
    "albumId": 1,
    "title": "Moonlit Walk",
    "image": `https://vinyl.lofirecords.com/cdn/shop/products/VINYL_MORNING_COFFEE_4-min.png?v=1680526353`,
    "artists": ["LoFi Dreamer"],
    "album": "Chill Lo-Fi Music",
    "duration": "3:12"
  },
  {
    "id": 2,
    "albumId": 1,
    "title": "Coffee Daze",
    "image": `https://vinyl.lofirecords.com/cdn/shop/products/VINYL_MORNING_COFFEE_4-min.png?v=1680526353`,
    "artists": ["LoFi Dreamer"],
    "album": "Chill Lo-Fi Music",
    "duration": "4:07"
  },
  {
    "id": 3,
    "albumId": 1,
    "title": "Skyline Serenade",
    "image": `https://vinyl.lofirecords.com/cdn/shop/products/VINYL_MORNING_COFFEE_4-min.png?v=1680526353`,
    "artists": ["LoFi Dreamer"],
    "album": "Chill Lo-Fi Music",
    "duration": "3:50"
  },
  {
    "id": 4,
    "albumId": 1,
    "title": "Urban Echoes",
    "image": `https://vinyl.lofirecords.com/cdn/shop/products/VINYL_MORNING_COFFEE_4-min.png?v=1680526353`,
    "artists": ["LoFi Dreamer"],
    "album": "Chill Lo-Fi Music",
    "duration": "3:30"
  },
  {
    "id": 5,
    "albumId": 1,
    "title": "Night's End",
    "image": `https://vinyl.lofirecords.com/cdn/shop/products/VINYL_MORNING_COFFEE_4-min.png?v=1680526353`,
    "artists": ["LoFi Dreamer"],
    "album": "Chill Lo-Fi Music",
    "duration": "4:20"
  },
  {
    "id": 1,
    "albumId": 2,
    "title": "Silent Rain",
    "image": `https://vinyl.lofirecords.com/cdn/shop/files/2amsynth-vinyl.png?v=1693312187`,
    "artists": ["Urban Nocturne"],
    "album": "Midnight Tales",
    "duration": "3:40"
  },
  {
    "id": 2,
    "albumId": 2,
    "title": "Lost Pages",
    "image": `https://vinyl.lofirecords.com/cdn/shop/files/2amsynth-vinyl.png?v=1693312187`,
    "artists": ["Urban Nocturne"],
    "album": "Midnight Tales",
    "duration": "3:20"
  },
  {
    "id": 3,
    "albumId": 2,
    "title": "Midnight Tales",
    "image": `https://vinyl.lofirecords.com/cdn/shop/files/2amsynth-vinyl.png?v=1693312187`,
    "artists": ["Urban Nocturne"],
    "album": "Midnight Tales",
    "duration": "3:50"
  },
  {
    "id": 4,
    "albumId": 2,
    "title": "City Lights",
    "image": `https://vinyl.lofirecords.com/cdn/shop/files/2amsynth-vinyl.png?v=1693312187`,
    "artists": ["Urban Nocturne"],
    "album": "Midnight Tales",
    "duration": "3:30"
  },
  {
    "id": 5,
    "albumId": 2,
    "title": "Night Drive",
    "image": `https://vinyl.lofirecords.com/cdn/shop/files/2amsynth-vinyl.png?v=1693312187`,
    "artists": ["Urban Nocturne"],
    "album": "Midnight Tales",
    "duration": "4:20"
  },
  {
    "id": 1,
    "albumId": 3,
    "title": "Lunar",
    "image": `https://f4.bcbits.com/img/a1435058381_65.jpg`,
    "artists": ["Tenno"],
    "album": "Study Session",
    "duration": "3:40"
  },
  {
    "id": 2,
    "albumId": 3,
    "title": "Go go go!",
    "image": `https://f4.bcbits.com/img/a1435058381_65.jpg`,
    "artists": ["Tenno"],
    "album": "Study Session",
    "duration": "3:20"
  },
  {
    "id": 3,
    "albumId": 3,
    "title": "Keep focus!",
    "image": `https://f4.bcbits.com/img/a1435058381_65.jpg`,
    "artists": ["Tenno"],
    "album": "Study Session",
    "duration": "2:40"
  },
  {
    "id": 4,
    "albumId": 3,
    "title": "JavaScript is the way",
    "image": `https://f4.bcbits.com/img/a1435058381_65.jpg`,
    "artists": ["Tenno"],
    "album": "Study Session",
    "duration": "3:10"
  },
  {
    "id": 5,
    "albumId": 3,
    "title": "No more TypeScript for me",
    "image": `https://f4.bcbits.com/img/a1435058381_65.jpg`,
    "artists": ["Tenno"],
    "album": "Study Session",
    "duration": "2:10"
  },
  {
    "id": 1,
    "albumId": 4,
    "title": "Lunar",
    "image": "https://f4.bcbits.com/img/a1962013209_16.jpg",
    "artists": ["Tenno"],
    "album": "Study Session",
    "duration": "3:40"
  },
  {
    "id": 2,
    "albumId": 4,
    "title": "Go go go!",
    "image": "https://f4.bcbits.com/img/a1962013209_16.jpg",
    "artists": ["Tenno"],
    "album": "Study Session",
    "duration": "3:20"
  },
  {
    "id": 3,
    "albumId": 4,
    "title": "Keep focus!",
    "image": "https://f4.bcbits.com/img/a1962013209_16.jpg",
    "artists": ["Tenno"],
    "album": "Study Session",
    "duration": "2:40"
  },
  {
    "id": 4,
    "albumId": 4,
    "title": "JavaScript is the way",
    "image": "https://f4.bcbits.com/img/a1962013209_16.jpg",
    "artists": ["Tenno"],
    "album": "Study Session",
    "duration": "3:10"
  },
  {
    "id": 5,
    "albumId": 4,
    "title": "No more TypeScript for me",
    "image": "https://f4.bcbits.com/img/a1962013209_16.jpg",
    "artists": ["Tenno"],
    "album": "Study Session",
    "duration": "2:10"
  },
  {
    "id": 1,
    "albumId": 5,
    "title": "Moonlit Walk",
    "image": "https://f4.bcbits.com/img/a2793859494_16.jpg",
    "artists": ["LoFi Dreamer"],
    "album": "Chill Lo-Fi Music",
    "duration": "3:12"
  },
  {
    "id": 2,
    "albumId": 5,
    "title": "Coffee Daze",
    "image": "https://f4.bcbits.com/img/a2793859494_16.jpg",
    "artists": ["LoFi Dreamer"],
    "album": "Chill Lo-Fi Music",
    "duration": "4:07"
  },
  {
    "id": 3,
    "albumId": 5,
    "title": "Skyline Serenade",
    "image": "https://f4.bcbits.com/img/a2793859494_16.jpg",
    "artists": ["LoFi Dreamer"],
    "album": "Chill Lo-Fi Music",
    "duration": "3:50"
  },
  {
    "id": 4,
    "albumId": 5,
    "title": "Urban Echoes",
    "image": "https://f4.bcbits.com/img/a2793859494_16.jpg",
    "artists": ["LoFi Dreamer"],
    "album": "Chill Lo-Fi Music",
    "duration": "3:30"
  },
  {
    "id": 5,
    "albumId": 5,
    "title": "Night's End",
    "image": "https://f4.bcbits.com/img/a2793859494_16.jpg",
    "artists": ["LoFi Dreamer"],
    "album": "Chill Lo-Fi Music",
    "duration": "4:20"
  },
  {
    "id": 1,
    "albumId": 7,
    "title": "El Run Run",
    "image": "https://images.genius.com/338ce523f14e31627c7b57d9669837db.953x953x1.jpg",
    "artists": ["Estopa"],
    "album": "Allenrock",
    "duration": "3:35"
  },
  {
    "id": 2,
    "albumId": 7,
    "title": "Carolina",
    "image": "https://th.bing.com/th/id/OIP.evTfA7u98CW8W32TG4DRIAAAAA?rs=1&pid=ImgDetMain",
    "artists": ["M-Clan"],
    "album": "Carolina",
    "duration": "4:23"
  },
  {
    "id": 3,
    "albumId": 7,
    "title": "Por la boca vive el pez",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2F5a52d96ecfa47336534c0ec9ca710993.300x300x1.jpg",
    "artists": ["Fito & Fitipaldis"],
    "album": "Por la boca vive el pez",
    "duration": "4:30"
  },
  {
    "id": 4,
    "albumId": 7,
    "title": "Princesas",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2Fcbea4cc995d0f12e936856c7e3710749.593x600x1.jpg",
    "artists": ["Pereza"],
    "album": "Animales",
    "duration": "3:37"
  },
  {
    "id": 5,
    "albumId": 7,
    "title": "La Camisa Negra",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2F200ff12abac97db8809a9de89a4e7055.1000x1000x1.jpg",
    "artists": ["Juanes"],
    "album": "Mi Sangre",
    "duration": "4:07"
  },
  {
    "id": 6,
    "albumId": 7,
    "title": "Duele el amor",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2F8071784379d48eb0b7dc191b5819b914.600x608x1.jpg",
    "artists": ["Aleks Syntek", "Ana Torroja"],
    "album": "Mundo Lite",
    "duration": "4:36"
  },
  {
    "id": 7,
    "albumId": 7,
    "title": "La raja de tu falda",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2Ff013fef400363eb0320210a98d5ac491.554x426x1.jpg",
    "artists": ["Estopa"],
    "album": "Estopa",
    "duration": "3:22"
  },
  {
    "id": 8,
    "albumId": 7,
    "title": "20 de abril",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2F53ad73df8dccc7499b0732b64ce85c90.224x223x1.jpg",
    "artists": ["Celtas Cortos"],
    "album": "Cuéntame un cuento",
    "duration": "3:56"
  },
  {
    "id": 9,
    "albumId": 7,
    "title": "La niña que llora en tus fiestas",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2F2ae760428401e9e227eccf5c5f94ef42.953x953x1.jpg",
    "artists": ["La Oreja de Van Gogh"],
    "album": "Cometas por el cielo",
    "duration": "2:46"
  },
  {
    "id": 10,
    "albumId": 7,
    "title": "Lágrimas desordenadas",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2Fb74df1ea5b02087b860c27b4fd31633d.250x250x1.jpg",
    "artists": ["Melendi"],
    "album": "Lágrimas desordenadas",
    "duration": "3:48"
  },
  {
    "id": 11,
    "albumId": 7,
    "title": "La Deriva",
    "image": "https://t2.genius.com/unsafe/251x251/https%3A%2F%2Fimages.genius.com%2Fefc0cfabef8db7e0e4a3b8ef45d86671.1000x1000x1.jpg",
    "artists": ["Vetusta Morla"],
    "album": "La Deriva",
    "duration": "3:39"
  },
  {
    "id": 1,
    "albumId": 8,
    "title": "99 Luftballons",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2Fd7ba8779026c9fb7b3232354a8c021e4.1000x1000x1.png",
    "artists": ["Nena"],
    "album": "Nena",
    "duration": "3:54"
  },
  {
    "id": 2,
    "albumId": 8,
    "title": "Traum",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2Fbb0af5c718744dc933c285d7dabf917d.1000x1000x1.jpg",
    "artists": ["Cro"],
    "album": "Melodie",
    "duration": "3:07"
  },
  {
    "id": 3,
    "albumId": 8,
    "title": "Amerika",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2F6560cc9c8bdbc1aafaa58446bbd730b7.603x603x1.jpg",
    "artists": ["Rammstein"],
    "album": "Amerika",
    "duration": "4:18"
  },
  {
    "id": 4,
    "albumId": 8,
    "title": "Finale 1150",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2F05a8b8096d3a63b19f0f45769cea50a3.1000x1000x1.jpg",
    "artists": ["RAF Camora"],
    "album": "ZENIT",
    "duration": "2:56"
  },
  {
    "id": 5,
    "albumId": 8,
    "title": "Glück",
    "image": "https://i.scdn.co/image/ab67616d00001e02eae76af432b642ed8d31a474",
    "artists": ["Berge"],
    "album": "Vor uns die Sinnflut",
    "duration": "4:15"
  },
  {
    "id": 6,
    "albumId": 8,
    "title": "Federkleid",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2Fcf04bd6ab990ddb0970ae03683ff0ece.1000x899x1.jpg",
    "artists": ["Faun"],
    "album": "Midgard",
    "duration": "4:17"
  },
  {
    "id": 7,
    "albumId": 8,
    "title": "Sieben",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2Fe74e9cf6fd2cbb7dd3b1f89f60acbd8b.1000x1000x1.jpg",
    "artists": ["Subway to Sally"],
    "album": "Nord Nord Ost",
    "duration": "3:23"
  },
  {
    "id": 8,
    "albumId": 8,
    "title": "Was wollen wir trinken",
    "image": "https://t2.genius.com/unsafe/378x378/https%3A%2F%2Fimages.genius.com%2Fd5074e8e65192f9027453f61286e2760.500x500x1.jpg",
    "artists": ["dArtagnan"],
    "album": "Verehrt und Verdammt",
    "duration": "3:12"
  }
]
