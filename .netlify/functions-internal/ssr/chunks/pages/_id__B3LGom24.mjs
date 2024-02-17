/* empty css                          */
import { c as createAstro, d as createComponent, r as renderTemplate, e as addAttribute, m as maybeRenderHead, f as renderSlot, g as renderComponent, h as renderHead, i as renderTransition } from '../astro_9amAqlSb.mjs';
import 'kleur/colors';
import 'html-escaper';
import cn from 'clsx';
import { jsx, jsxs } from 'react/jsx-runtime';
import { create } from 'zustand';
import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

const colors = {
  red: { accent: "#da2735", dark: "#7f1d1d" },
  orange: { accent: "#cc5400", dark: "#7c2d12" },
  yellow: { accent: "#ffae00", dark: "#78350f" },
  green: { accent: "#21c872", dark: "#14532d" },
  teal: { accent: "#2ee9d7", dark: "#134e4a" },
  blue: { accent: "#1e3a8a", dark: "#1e3a8a" },
  indigo: { accent: "#394bd5", dark: "#312e81" },
  purple: { accent: "#df24ff", dark: "#581c87" },
  pink: { accent: "#f33b73", dark: "#831843" },
  emerald: { accent: "#0c6e54", dark: "#064e3b" },
  rose: { accent: "#ed2377", dark: "#871b48" },
  gray: { accent: "#555555", dark: "#27272a" }
};

const playlists = [
  {
    id: "1",
    albumId: 1,
    title: "Chill Lo-Fi Music",
    color: colors.yellow,
    cover: "https://vinyl.lofirecords.com/cdn/shop/products/VINYL_MORNING_COFFEE_4-min.png?v=1680526353",
    artists: ["NoSpirit", "Casiio"]
  },
  {
    id: "2",
    albumId: 2,
    title: "Lo-Fi Chill Session",
    color: colors.green,
    cover: "https://vinyl.lofirecords.com/cdn/shop/files/2amsynth-vinyl.png?v=1693312187",
    artists: ["Kupla", "Blue Fox"]
  },
  {
    id: "3",
    albumId: 3,
    title: "Study Session",
    color: colors.rose,
    cover: "https://f4.bcbits.com/img/a1435058381_65.jpg",
    artists: ["Tenno", "xander", "Team Astro"]
  },
  {
    id: "4",
    albumId: 4,
    title: "Blue Note Study Time",
    color: colors.blue,
    cover: "https://f4.bcbits.com/img/a1962013209_16.jpg",
    artists: ["Raimu", "Yasumu"]
  },
  {
    id: "5",
    albumId: 5,
    title: "Chau Saura Session",
    color: colors.purple,
    cover: "https://f4.bcbits.com/img/a2793859494_16.jpg",
    artists: ["Chau Saura", "amies", "kyu"]
  },
  {
    id: "6",
    albumId: 6,
    title: "Like a Necessity",
    color: colors.orange,
    cover: "https://f4.bcbits.com/img/a0363730459_16.jpg",
    artists: ["WFS", "Nadav Cohen"]
  }
];
const morePlaylists = playlists.map((item) => ({
  ...item,
  id: item.id + "_more"
}));
const sidebarPlaylists = playlists.map((item) => ({
  ...item,
  id: item.id + "_side"
}));
const allPlaylists = [
  ...playlists,
  ...morePlaylists,
  ...sidebarPlaylists
];
const songs = [
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
  }
];

const $$Astro$8 = createAstro();
const $$ViewTransitions = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$ViewTransitions;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>`;
}, "E:/viplay/node_modules/astro/components/ViewTransitions.astro", void 0);

const $$Astro$7 = createAstro();
const $$Home = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$Home;
  return renderTemplate`${maybeRenderHead()}<svg role="img" stroke="currentColor" fill="currentColor" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z"></path></svg>`;
}, "E:/viplay/src/icons/Home.astro", void 0);

const $$Astro$6 = createAstro();
const $$Search = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$Search;
  return renderTemplate`${maybeRenderHead()}<svg role="img" stroke="currentColor" fill="currentColor" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24"> <path fill="currentColor" d="M10.533 1.27893C5.35215 1.27893 1.12598 5.41887 1.12598 10.5579C1.12598 15.697 5.35215 19.8369 10.533 19.8369C12.767 19.8369 14.8235 19.0671 16.4402 17.7794L20.7929 22.132C21.1834 22.5226 21.8166 22.5226 22.2071 22.132C22.5976 21.7415 22.5976 21.1083 22.2071 20.7178L17.8634 16.3741C19.1616 14.7849 19.94 12.7634 19.94 10.5579C19.94 5.41887 15.7138 1.27893 10.533 1.27893ZM3.12598 10.5579C3.12598 6.55226 6.42768 3.27893 10.533 3.27893C14.6383 3.27893 17.94 6.55226 17.94 10.5579C17.94 14.5636 14.6383 17.8369 10.533 17.8369C6.42768 17.8369 3.12598 14.5636 3.12598 10.5579Z"></path> </svg>`;
}, "E:/viplay/src/icons/Search.astro", void 0);

const $$Astro$5 = createAstro();
const $$Library = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$Library;
  return renderTemplate`${maybeRenderHead()}<svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"> <path fill="currentColor" d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.464a1 1 0 0 0-.5-.866l-6-3.464zM9 2a1 1 0 0 0-1 1v18a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1z"></path> </svg>`;
}, "E:/viplay/src/icons/Library.astro", void 0);

const $$Astro$4 = createAstro();
const $$SideMenuItem = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$SideMenuItem;
  const { href } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<li> <a class="flex gap-4 text-zinc-400 hover:text-zinc-100 items-center py-3 px-5 font-medium transition duration-300"${addAttribute(href, "href")}> ${renderSlot($$result, $$slots["default"])} </a> </li>`;
}, "E:/viplay/src/components/SideMenuItem.astro", void 0);

const $$Astro$3 = createAstro();
const $$SideMenuCard = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$SideMenuCard;
  const { playlist } = Astro2.props;
  const {
    id,
    cover,
    title,
    artists,
    color
  } = playlist;
  const artistsString = artists.join(", ");
  return renderTemplate`${maybeRenderHead()}<a${addAttribute(`/playlist/${id}`, "href")} class="playlist-item flex relative p-2 overflow-hidden items-center gap-5 rounded-md hover:bg-zinc-800"> <picture class="size-12 flex-none"> <img${addAttribute(cover, "src")}${addAttribute(`Cover of ${title} by ${artistsString}`, "alt")} class="object-cover w-full h-full rounded-md"> </picture> <div class="flex flex-auto flex-col truncate"> <h4 class="font-white text-sm"> ${title} </h4> <span class="text-xs text-gray-400"> ${artistsString} </span> </div> </a>`;
}, "E:/viplay/src/components/SideMenuCard.astro", void 0);

const $$Astro$2 = createAstro();
const $$AsideMenu = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$AsideMenu;
  return renderTemplate`${maybeRenderHead()}<nav class="flex flex-col flex-1 gap-2"> <div class="bg-zinc-900 rounded-lg p-2"> <ul> ${renderComponent($$result, "SideMenuItem", $$SideMenuItem, { "href": "/" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "HomeIcon", $$Home, {})}
Home
` })} ${renderComponent($$result, "SideMenuItem", $$SideMenuItem, { "href": "/#" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "SearchIcon", $$Search, {})}
Search
` })} </ul> </div> <div class="bg-zinc-900 rounded-lg p-2 flex-1"> <ul> ${renderComponent($$result, "SideMenuItem", $$SideMenuItem, { "href": "/#" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "LibraryIcon", $$Library, {})}
Your library
` })} ${playlists.map((playlist) => renderTemplate`${renderComponent($$result, "SideMenuCard", $$SideMenuCard, { "playlist": playlist })}`)} </ul> </div> </nav>`;
}, "E:/viplay/src/components/AsideMenu.astro", void 0);

const usePlayerStore = create((set) => ({
  isPlaying: false,
  currentMusic: { playlist: null, song: null, songs: [] },
  volume: 0.1,
  setVolume: (volume) => set({ volume }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentMusic: (currentMusic) => set({ currentMusic })
}));

const Pause = ({ className }) => /* @__PURE__ */ jsx("svg", { className, role: "img", height: "16", width: "16", "aria-hidden": "true", viewBox: "0 0 16 16", children: /* @__PURE__ */ jsx("path", { d: "M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z" }) });
const Play = ({ className }) => /* @__PURE__ */ jsx("svg", { className, role: "img", height: "16", width: "16", "aria-hidden": "true", viewBox: "0 0 16 16", children: /* @__PURE__ */ jsx("path", { d: "M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z" }) });

const Slider = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(
  SliderPrimitive.Root,
  {
    ref,
    className: cn(
      "relative flex touch-none select-none items-center group",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx(SliderPrimitive.Track, { className: "relative h-1 w-full grow overflow-hidden rounded-full bg-gray-800", children: /* @__PURE__ */ jsx(SliderPrimitive.Range, { className: "absolute h-full bg-white group-hover:bg-green-400" }) }),
      /* @__PURE__ */ jsx(SliderPrimitive.Thumb, { className: "hidden group-hover:block h-3 w-3 bg-white rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" })
    ]
  }
));
Slider.displayName = SliderPrimitive.Root.displayName;

const Mute = () => /* @__PURE__ */ jsxs("svg", { role: "presentation", fill: "currentColor", height: "16", width: "16", "aria-label": "Volume off", "aria-hidden": "true", viewBox: "0 0 16 16", children: [
  /* @__PURE__ */ jsx("path", { d: "M13.86 5.47a.75.75 0 0 0-1.061 0l-1.47 1.47-1.47-1.47A.75.75 0 0 0 8.8 6.53L10.269 8l-1.47 1.47a.75.75 0 1 0 1.06 1.06l1.47-1.47 1.47 1.47a.75.75 0 0 0 1.06-1.06L12.39 8l1.47-1.47a.75.75 0 0 0 0-1.06z" }),
  /* @__PURE__ */ jsx("path", { d: "M10.116 1.5A.75.75 0 0 0 8.991.85l-6.925 4a3.642 3.642 0 0 0-1.33 4.967 3.639 3.639 0 0 0 1.33 1.332l6.925 4a.75.75 0 0 0 1.125-.649v-1.906a4.73 4.73 0 0 1-1.5-.694v1.3L2.817 9.852a2.141 2.141 0 0 1-.781-2.92c.187-.324.456-.594.78-.782l5.8-3.35v1.3c.45-.313.956-.55 1.5-.694V1.5z" })
] });
const VolumeLow = () => /* @__PURE__ */ jsx("svg", { role: "presentation", fill: "currentColor", height: "16", width: "16", "aria-label": "Volumen bajo", "aria-hidden": "true", viewBox: "0 0 16 16", children: /* @__PURE__ */ jsx("path", { d: "M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 0 1 0 4.88z" }) });
const VolumeMid = () => /* @__PURE__ */ jsx("svg", { role: "presentation", fill: "currentColor", height: "16", width: "16", "aria-label": "Volumen medio", "aria-hidden": "true", viewBox: "0 0 16 16", children: /* @__PURE__ */ jsx("path", { d: "M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 6.087a4.502 4.502 0 0 0 0-8.474v1.65a2.999 2.999 0 0 1 0 5.175v1.649z" }) });
const VolumeHigh = () => /* @__PURE__ */ jsxs("svg", { role: "presentation", fill: "currentColor", height: "16", width: "16", "aria-label": "Volumen alto", "aria-hidden": "true", viewBox: "0 0 16 16", children: [
  /* @__PURE__ */ jsx("path", { d: "M9.741.85a.75.75 0 0 1 .375.65v13a.75.75 0 0 1-1.125.65l-6.925-4a3.642 3.642 0 0 1-1.33-4.967 3.639 3.639 0 0 1 1.33-1.332l6.925-4a.75.75 0 0 1 .75 0zm-6.924 5.3a2.139 2.139 0 0 0 0 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 0 1 0 4.88z" }),
  /* @__PURE__ */ jsx("path", { d: "M11.5 13.614a5.752 5.752 0 0 0 0-11.228v1.55a4.252 4.252 0 0 1 0 8.127v1.55z" })
] });

const CurrentSong = ({ image, title, artists }) => {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5 relative overflow-hidden", children: [
    image && /* @__PURE__ */ jsx("picture", { className: "size-16 bg-zinc-800 rounded-md shadow-lg overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: image, alt: title }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm block", children: title }),
      /* @__PURE__ */ jsx("span", { className: "text-xs opacity-80", children: artists?.join(", ") })
    ] })
  ] });
};
const PlayerControl = ({ audio }) => {
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    audio.current.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      audio.current.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);
  const handleTimeUpdate = () => {
    setCurrentTime(audio.current.currentTime);
  };
  const formatTime = (time) => {
    if (time == null)
      return "0:00";
    const seconds = Math.floor(time % 60);
    const minutes = Math.floor(time / 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  const duration = audio?.current?.duration ?? 0;
  return /* @__PURE__ */ jsxs("div", { className: "flex gap-x-3 text-xs pt-2", children: [
    /* @__PURE__ */ jsx("span", { className: "opacity-50 w-12 text-right", children: formatTime(currentTime) }),
    /* @__PURE__ */ jsx(
      Slider,
      {
        max: audio?.current?.duration ?? 0,
        min: 0,
        value: [currentTime],
        className: "w-[400px]",
        onValueChange: (value) => {
          const [newCurrentTime] = value;
          audio.current.currentTime = newCurrentTime;
        }
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "opacity-50 w-12", children: duration ? formatTime(duration) : "0:00" })
  ] });
};
const VolumeControl = () => {
  const volume = usePlayerStore((state) => state.volume);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const previousVolumeRef = useRef(volume);
  const isVolumeSilenced = volume == 0;
  const handleClickVolume = () => {
    if (isVolumeSilenced) {
      setVolume(previousVolumeRef.current);
    } else {
      previousVolumeRef.current = volume;
      setVolume(0);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-x-2 text-white", children: [
    /* @__PURE__ */ jsx("button", { className: "opacity-70 hover:opacity-100 transition", onClick: handleClickVolume, children: isVolumeSilenced ? /* @__PURE__ */ jsx(Mute, {}) : volume > 0 && volume < 0.3 ? /* @__PURE__ */ jsx(VolumeLow, {}) : volume >= 0.3 && volume < 0.7 ? /* @__PURE__ */ jsx(VolumeMid, {}) : /* @__PURE__ */ jsx(VolumeHigh, {}) }),
    /* @__PURE__ */ jsx(
      Slider,
      {
        defaultValue: [100],
        max: 100,
        min: 0,
        value: [volume * 100],
        className: "w-[95px]",
        onValueChange: (value) => {
          const [newVolume] = value;
          const volumeValue = newVolume / 100;
          setVolume(volumeValue);
        }
      }
    )
  ] });
};
function Player() {
  const { currentMusic, isPlaying, setIsPlaying, volume } = usePlayerStore((state) => state);
  const audioRef = useRef();
  useEffect(() => {
    isPlaying ? audioRef.current.play() : audioRef.current.pause();
  }, [isPlaying]);
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);
  useEffect(() => {
    const { song, playlist } = currentMusic;
    if (song) {
      audioRef.current.src = `/music/${playlist?.id}/0${song.id}.mp3`;
      audioRef.current.volume = volume;
      audioRef.current.play();
    }
  }, [currentMusic]);
  const handleClick = () => {
    setIsPlaying(!isPlaying);
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-row justify-between w-full px-1 z-50", children: [
    /* @__PURE__ */ jsx("div", { className: "w-[200px]", children: /* @__PURE__ */ jsx(CurrentSong, { ...currentMusic.song }) }),
    /* @__PURE__ */ jsx("div", { className: "grid place-content-center gap-4 flex-1", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center", children: [
      /* @__PURE__ */ jsx("button", { className: "bg-white text-black rounded-full p-2 hover:scale-110", onClick: handleClick, children: isPlaying ? /* @__PURE__ */ jsx(Pause, {}) : /* @__PURE__ */ jsx(Play, {}) }),
      /* @__PURE__ */ jsx(PlayerControl, { audio: audioRef }),
      /* @__PURE__ */ jsx("audio", { ref: audioRef })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "grid place-content-center", children: /* @__PURE__ */ jsx(VolumeControl, {}) })
  ] });
}

const $$Astro$1 = createAstro();
const $$Layout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="description" content="Astro description"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title>${renderComponent($$result, "ViewTransitions", $$ViewTransitions, { "fallback": "none", "data-astro-cid-sckkx6r4": true })}${renderHead()}</head> <body data-astro-cid-sckkx6r4> <div id="app" class="relative h-screen p-2 gap-2" data-astro-cid-sckkx6r4> <aside class="[grid-area:aside] flex-col flex overflow-y-auto" data-astro-cid-sckkx6r4> ${renderComponent($$result, "AsideMenu", $$AsideMenu, { "data-astro-cid-sckkx6r4": true })} </aside> <main class="[grid-area:main] rounded-lg bg-zinc-900 overflow-y-auto" data-astro-cid-sckkx6r4> ${renderSlot($$result, $$slots["default"])} </main> <footer class="[grid-area:player] h-[80px]" data-astro-cid-sckkx6r4> ${renderComponent($$result, "Player", Player, { "client:load": true, "data-astro-transition-persist": "media-player", "client:component-hydration": "load", "client:component-path": "E:/viplay/src/components/Player.jsx", "client:component-export": "Player", "data-astro-cid-sckkx6r4": true, "data-astro-transition-scope": renderTransition($$result, "p74ezckc", "", "media-player") })} </footer> </div>  </body></html>`;
}, "E:/viplay/src/layouts/Layout.astro", "self");

function getPlayListInfoById(playListId) {
  return fetch(`/api/get-info-playlist.json?id=${playListId}`).then((res) => res.json());
}

function CardPlayButton({ id, size = "small" }) {
  const {
    currentMusic,
    isPlaying,
    setIsPlaying,
    setCurrentMusic
  } = usePlayerStore((state) => state);
  const isPlayingPlaylist = isPlaying && currentMusic?.playlist?.id === id;
  const isThisPlaylistInStore = currentMusic?.playlist?.id === id;
  const handleClick = () => {
    if (isThisPlaylistInStore) {
      setIsPlaying(!isPlaying);
      return;
    }
    getPlayListInfoById(id).then((data) => {
      const { songs, playlist } = data;
      setCurrentMusic({ songs, playlist, song: songs[0] });
    }).then(() => {
      setIsPlaying(true);
    });
  };
  const iconClassName = size === "small" ? "size-4" : "size-5";
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: handleClick,
      className: "card-play-button rounded-full text-black bg-green-500 p-4 hover:scale-105 transition hover:bg-green-400",
      children: isPlayingPlaylist ? /* @__PURE__ */ jsx(Pause, { className: iconClassName }) : /* @__PURE__ */ jsx(Play, { className: iconClassName })
    }
  );
}

const TimeIcon = () => /* @__PURE__ */ jsxs(
  "svg",
  {
    role: "img",
    height: "16",
    width: "16",
    "aria-hidden": "true",
    viewBox: "0 0 16 16",
    fill: "currentColor",
    children: [
      /* @__PURE__ */ jsx(
        "path",
        {
          d: "M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"
        }
      ),
      /* @__PURE__ */ jsx(
        "path",
        {
          d: "M8 3.25a.75.75 0 0 1 .75.75v3.25H11a.75.75 0 0 1 0 1.5H7.25V4A.75.75 0 0 1 8 3.25z"
        }
      )
    ]
  }
);

const isNewSongOfAnotherPlaylist = (currentMusic, song) => {
  return currentMusic.playlist?.id != song.albumId;
};
const setNewCurrentMusic = (song, setIsPlaying, setCurrentMusic) => {
  getPlayListInfoById(song.albumId).then((data) => {
    const { songs, playlist } = data;
    setCurrentMusic({ songs, playlist, song });
  }).then(() => {
    setIsPlaying(true);
  });
};
const MusicsTablePlay = ({ song, isCurrentSong }) => {
  const {
    currentMusic,
    isPlaying,
    setIsPlaying,
    setCurrentMusic
  } = usePlayerStore((state) => state);
  const isCurrentSongRunning = (song2) => {
    return currentMusic.song?.id == song2.id && currentMusic.playlist?.albumId == song2.albumId && isPlaying;
  };
  const handleClick = (song2) => {
    if (isCurrentSongRunning(song2)) {
      setIsPlaying(false);
      return;
    }
    if (isNewSongOfAnotherPlaylist(currentMusic, song2)) {
      setNewCurrentMusic(song2, setIsPlaying, setCurrentMusic);
      return;
    }
    if (currentMusic.song?.id !== song2.id) {
      setCurrentMusic({ songs: currentMusic.songs, playlist: currentMusic.playlist, song: song2 });
    }
    setIsPlaying(true);
  };
  const className = "hover:scale-125";
  return /* @__PURE__ */ jsx("button", { className: "text-white", onClick: () => handleClick(song), children: isCurrentSongRunning(song) ? /* @__PURE__ */ jsx(Pause, { className }) : /* @__PURE__ */ jsx(Play, { className }) });
};

const isCurrentSong = (song) => {
  const { song: currentSong, playlist } = usePlayerStore((state) => state.currentMusic);
  return currentSong?.id == song.id && playlist?.albumId == song.albumId;
};
const MusicsTable = ({ songs }) => {
  return /* @__PURE__ */ jsxs("table", { className: "table-auto text-left min-w-full divide-y divide-gray-500/20", children: [
    /* @__PURE__ */ jsx("thead", { className: "", children: /* @__PURE__ */ jsxs("tr", { className: "text-zinc-400 text-sm", children: [
      /* @__PURE__ */ jsx("th", { className: "px-4 py-2 font-light", children: "#" }),
      /* @__PURE__ */ jsx("th", { className: "px-4 py-2 font-light", children: "Título" }),
      /* @__PURE__ */ jsx("th", { className: "px-4 py-2 font-light", children: "Álbum" }),
      /* @__PURE__ */ jsx("th", { className: "px-4 py-2 font-light", children: /* @__PURE__ */ jsx(TimeIcon, {}) })
    ] }) }),
    /* @__PURE__ */ jsxs("tbody", { children: [
      /* @__PURE__ */ jsx("tr", { className: "h-[16px]" }),
      songs.map(
        (song, index) => {
          const isCurrentSongBoolean = isCurrentSong(song);
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: "text-gray-300 border-spacing-0 text-sm font-light hover:bg-white/10 overflow-hidden transition duration-300 group",
              children: [
                /* @__PURE__ */ jsxs("td", { className: "relative px-4 py-2 rounded-tl-lg rounded-bl-lg w-5", children: [
                  /* @__PURE__ */ jsx("span", { className: "absolute top-5 opacity-100 transition-all group-hover:opacity-0", children: index + 1 }),
                  /* @__PURE__ */ jsx("div", { className: "absolute top-5 opacity-0 transition-all group-hover:opacity-100", children: /* @__PURE__ */ jsx(MusicsTablePlay, { song, isCurrentSong: isCurrentSongBoolean }) })
                ] }),
                /* @__PURE__ */ jsxs("td", { className: "px-4 py-2 flex gap-3", children: [
                  /* @__PURE__ */ jsx("picture", { className: "", children: /* @__PURE__ */ jsx("img", { src: song.image, alt: song.title, className: "w-11 h-11" }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                    /* @__PURE__ */ jsx("h3", { className: `text-base font-normal
                        ${isCurrentSongBoolean ? "text-green-400" : "text-White"}
                        `, children: song.title }),
                    /* @__PURE__ */ jsx("span", { children: song.artists.join(", ") })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2", children: song.album }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2 rounded-tr-lg rounded-br-lg", children: song.duration })
              ]
            },
            `{song.albumId}-${song.id}`
          );
        }
      )
    ] })
  ] });
};

const $$Astro = createAstro();
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  const playlist = allPlaylists.find((playlist2) => playlist2.id === id);
  const playListSongs = songs.filter((song) => song.albumId === playlist?.albumId);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Viplay. Listen to your favourite music." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div id="playlist-container" class="relative flex flex-col h-full bg-zinc-900 overflow-x-hidden bg-gradient-to-t from-50% from-zinc-900 via-zinc-900/80"${addAttribute(`background-color: ${playlist?.color.accent}`, "style")}${addAttribute(renderTransition($$result2, "lwbbxtwc", "", `playlist ${id} box`), "data-astro-transition-scope")}> <!-- <PageHeader /> --> <header class="flex flex-row gap-8 px-6 mt-12"> <picture class="aspect-square size-52 flex-none"> <img${addAttribute(playlist?.cover, "src")}${addAttribute(`Cover of ${playlist?.title}`, "alt")} class="object-cover w-full h-full shadow-lg"${addAttribute(renderTransition($$result2, "jkadwh6j", "", `playlist ${id} image`), "data-astro-transition-scope")}> </picture> <div class="flex flex-col justify-between"> <h2 class="flex flex-1 items-end">Playlist</h2> <div> <h1 class="text-5xl font-bold block text-white"> <span${addAttribute(renderTransition($$result2, "vl5qskca", "", `playlist ${playlist?.id} title`), "data-astro-transition-scope")}> ${playlist?.title} </span> </h1> </div> <div class="flex-1 flex items-end"> <div class="text-sm text-gray-300 font-normal"> <div${addAttribute(renderTransition($$result2, "2qsllmyo", "", `playlist ${playlist?.id} artists`), "data-astro-transition-scope")}> <span>${playlist?.artists.join(", ")}</span> </div> <p class="mt-1"> <span class="text-white">${playListSongs.length} songs</span>, around 3 hours
</p> </div> </div> </div> </header> <div class="pl-6 pt-8"> ${renderComponent($$result2, "CardPlayButton", CardPlayButton, { "id": id, "size": "large", "client:load": true, "client:component-hydration": "load", "client:component-path": "E:/viplay/src/components/CardPlayButton", "client:component-export": "CardPlayButton" })} </div> <div class="relative z-10 px-6 pt-10"></div> <section class="p-6"> ${renderComponent($$result2, "MusicsTable", MusicsTable, { "songs": playListSongs, "client:load": true, "client:component-hydration": "load", "client:component-path": "E:/viplay/src/components/MusicsTable.tsx", "client:component-export": "MusicsTable" })} </section> </div> ` })}`;
}, "E:/viplay/src/pages/playlist/[id].astro", "self");

const $$file = "E:/viplay/src/pages/playlist/[id].astro";
const $$url = "/playlist/[id]";

const _id_ = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

export { $$Layout as $, CardPlayButton as C, _id_ as _, allPlaylists as a, playlists as p, songs as s };
