// Sim Lab Calendar - Firebase settings
// Not a secret. Security rules protect the data, not these keys.
//
// REPLACE THE THREE "PASTE_YOURS" VALUES BELOW.
// Firebase console -> Settings (gear) -> Project settings -> Your apps
// -> your web app -> the firebaseConfig block.

export const firebaseConfig = {
  apiKey: "AIzaSyBqld177J-28A-ZSk1LPvaKvxG0UL1DBks",
  authDomain: "simlab-calendar-26bed.firebaseapp.com",
  projectId: "simlab-calendar-26bed",
  storageBucket: "simlab-calendar-26bed.firebasestorage.app",
  messagingSenderId: "430530652619",
  appId: "1:430530652619:web:53d1b1fe22a11acb05ee4e"
};

// ---------------------------------------------------------------
// Everything below is only a FALLBACK, used before settings load or
// if the settings document is missing. The live values live in
// Firestore at settings/display and are edited on settings.html.
// You should not need to touch this file again after setup.
// ---------------------------------------------------------------

export const COLORS = {
  teal:   "#1f9b8a",
  blue:   "#2e74b5",
  orange: "#d98324",
  pink:   "#c2548a",
  red:    "#c0392b",
  green:  "#4a8f4e",
  grey:   "#7a8794",
  yellow: "#b08f00",
  purple: "#7a4fb0",
  brown:  "#8a6a3a",
  amber:  "#c08a1e"
};

export const DEFAULT_SETTINGS = {
  title: "THIS WEEK",
  rotateSec: 25,
  popupSec: 30,
  scale: 1,
  weeks: 2,
  showWeekend: true,
  showComments: true,
  showClock: true,
  offlineGraceMin: 5,
  colors: COLORS,
  theme: {
    bg:      "#0d1b2a",
    panel:   "#152c42",
    line:    "#2c4257",
    fg:      "#ffffff",
    muted:   "#8fb3cc",
    today:   "#17334d",
    note:    "#ffd9a0",
    divider: "#d05a5a"
  }
};
