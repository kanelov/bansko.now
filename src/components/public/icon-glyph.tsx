import {
  faArrowUp,
  faBagShopping,
  faBookOpen,
  faCalendarDays,
  faClock,
  faCompass,
  faGlobe,
  faHouse,
  faLink,
  faMagnifyingGlass,
  faMapLocationDot,
  faMasksTheater,
  faMountain,
  faNewspaper,
  faPalette,
  faTree,
  faUserShield,
  faUsers,
  faUtensils
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookF,
  faInstagram,
  faLinkedinIn,
  faTiktok,
  faXTwitter,
  faYoutube
} from "@fortawesome/free-brands-svg-icons";

type FontAwesomeIconDefinition = {
  icon: [width: number, height: number, ligatures: string[], unicode: string, pathData: string | string[]];
};

const iconDefinitions: Record<string, FontAwesomeIconDefinition> = {
  house: faHouse,
  clock: faClock,
  "calendar-days": faCalendarDays,
  compass: faCompass,
  "map-location-dot": faMapLocationDot,
  mountain: faMountain,
  tree: faTree,
  "masks-theater": faMasksTheater,
  utensils: faUtensils,
  palette: faPalette,
  "bag-shopping": faBagShopping,
  "book-open": faBookOpen,
  users: faUsers,
  newspaper: faNewspaper,
  "user-shield": faUserShield,
  "magnifying-glass": faMagnifyingGlass,
  link: faLink,
  globe: faGlobe,
  "arrow-up": faArrowUp,
  facebook: faFacebookF,
  "facebook-f": faFacebookF,
  instagram: faInstagram,
  youtube: faYoutube,
  "x-twitter": faXTwitter,
  linkedin: faLinkedinIn,
  "linkedin-in": faLinkedinIn,
  tiktok: faTiktok
};

const aliases: Record<string, string> = {
  "calendar-alt": "calendar-days",
  "shopping-bag": "bag-shopping",
  theatre: "masks-theater",
  theater: "masks-theater",
  search: "magnifying-glass",
  admin: "user-shield",
  x: "x-twitter",
  twitter: "x-twitter"
};

export const menuIconOptions = [
  "house",
  "clock",
  "calendar-days",
  "compass",
  "map-location-dot",
  "mountain",
  "tree",
  "masks-theater",
  "utensils",
  "palette",
  "bag-shopping",
  "book-open",
  "users",
  "newspaper",
  "globe"
];

export const socialIconOptions = ["facebook", "instagram", "youtube", "x-twitter", "linkedin", "tiktok", "globe"];

export function normalizeIconName(iconName: string | null | undefined) {
  if (!iconName) {
    return null;
  }

  const ignoredClasses = new Set(["fa", "fas", "far", "fab", "fa-solid", "fa-regular", "fa-brands"]);
  const candidates = iconName
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.replace(/^fa-/, ""))
    .filter((part) => part && !ignoredClasses.has(part));

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = aliases[candidates[index]] || candidates[index];
    if (iconDefinitions[candidate]) {
      return candidate;
    }
  }

  return null;
}

export function IconGlyph({ name, className = "h-4 w-4" }: { name?: string | null; className?: string }) {
  const normalized = normalizeIconName(name);

  if (!normalized) {
    return null;
  }

  const [width, height, , , pathData] = iconDefinitions[normalized].icon;
  const paths = Array.isArray(pathData) ? pathData : [pathData];

  return (
    <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} className={className} fill="currentColor" focusable="false">
      {paths.map((path, index) => (
        <path key={`${normalized}-${index}`} d={path} />
      ))}
    </svg>
  );
}
