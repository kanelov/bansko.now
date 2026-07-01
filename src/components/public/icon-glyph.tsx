type IconDefinition = {
  paths: string[];
  circles?: { cx: number; cy: number; r: number }[];
  rects?: { x: number; y: number; width: number; height: number; rx?: number }[];
  fill?: boolean;
};

const iconDefinitions: Record<string, IconDefinition> = {
  house: { paths: ["M3 10.8 12 3l9 7.8", "M5 10v10h14V10", "M9 20v-6h6v6"] },
  clock: { paths: ["M12 7v5l3 2"], circles: [{ cx: 12, cy: 12, r: 8.5 }] },
  "calendar-days": {
    paths: ["M7 3v4", "M17 3v4", "M4.5 9h15", "M8 13h.01", "M12 13h.01", "M16 13h.01", "M8 17h.01", "M12 17h.01"],
    rects: [{ x: 4.5, y: 5, width: 15, height: 16, rx: 2.2 }]
  },
  compass: { paths: ["m15.5 8.5-2.4 5.1-5.1 2.4 2.4-5.1 5.1-2.4Z"], circles: [{ cx: 12, cy: 12, r: 9 }] },
  "map-location-dot": { paths: ["M9 18 4.5 20.5V6.5L9 4l6 2.5 4.5-2.5v14L15 20.5 9 18Z", "M9 4v14", "M15 6.5v14"], circles: [{ cx: 15, cy: 10, r: 1.8 }] },
  mountain: { paths: ["M3 20h18L14.5 5.5 10 14l-2.5-3.5L3 20Z", "M12.3 9.6 14.5 12l1.4-1.4"] },
  tree: { paths: ["M12 21v-5", "M7 16h10L14.5 12h2L12 4 7.5 12h2L7 16Z"] },
  "masks-theater": { paths: ["M5 5.5c3-1.5 6-1.5 9 0v5.2c0 3.5-2.2 6.2-4.5 6.2S5 14.2 5 10.7V5.5Z", "M15 8.5c1.5.1 2.8.5 4 1.2v4.7c0 2.8-1.7 5-3.7 5-.8 0-1.5-.3-2.1-.9", "M8 10h.01", "M12 10h.01", "M8.3 13.5c1.1.8 2.3.8 3.4 0"] },
  utensils: { paths: ["M6 3v8", "M4 3v5c0 1.7.9 3 2 3s2-1.3 2-3V3", "M6 11v10", "M15 3v18", "M15 3c3 2.2 4 5.4 2 8h-2"] },
  palette: { paths: ["M12 4a8 8 0 0 0 0 16h1.2a1.8 1.8 0 0 0 1.4-2.9 1.8 1.8 0 0 1 1.4-2.9H18a4 4 0 0 0 4-4c0-3.4-4-6.2-10-6.2Z"], circles: [{ cx: 8.5, cy: 10, r: 0.7 }, { cx: 11.5, cy: 8, r: 0.7 }, { cx: 14.7, cy: 9.1, r: 0.7 }] },
  "bag-shopping": { paths: ["M6.5 8.5h11L18.5 21h-13l1-12.5Z", "M9 8.5V7a3 3 0 0 1 6 0v1.5"] },
  "book-open": { paths: ["M12 6.8c-2-1.4-4.5-2-7-1.8v13c2.5-.2 5 .4 7 1.8", "M12 6.8c2-1.4 4.5-2 7-1.8v13c-2.5-.2-5 .4-7 1.8", "M12 6.8v13"] },
  users: { paths: ["M8.5 12.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z", "M2.8 20c.7-3 2.8-4.8 5.7-4.8s5 1.8 5.7 4.8", "M16 12a3 3 0 1 0-1.8-5.4", "M15.5 15.4c2.6.2 4.5 1.8 5.2 4.6"] },
  newspaper: { paths: ["M5 5h12.5A1.5 1.5 0 0 1 19 6.5V19H6.5A1.5 1.5 0 0 1 5 17.5V5Z", "M19 9h1.5v8.5A1.5 1.5 0 0 1 19 19", "M8 9h6", "M8 12h8", "M8 15h5"] },
  "user-shield": { paths: ["M9.5 11.5a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Z", "M3.4 19.2c.7-3.1 3-4.9 6.1-4.9 1 0 1.9.2 2.7.6", "M16.5 13l4 1.5v3.2c0 2.3-1.5 4-4 5-2.5-1-4-2.7-4-5v-3.2l4-1.5Z"] },
  "magnifying-glass": { paths: ["m16.8 16.8 4 4"], circles: [{ cx: 10.5, cy: 10.5, r: 6.5 }] },
  link: { paths: ["M9.5 14.5 14.5 9.5", "M10.5 6.5l1.2-1.2a4 4 0 0 1 5.7 5.7l-1.7 1.7a4 4 0 0 1-5.1.5", "M13.5 17.5l-1.2 1.2a4 4 0 0 1-5.7-5.7l1.7-1.7a4 4 0 0 1 5.1-.5"] },
  facebook: { paths: ["M14.5 8.2H16V4.8c-.7-.1-1.7-.2-2.8-.2-2.8 0-4.7 1.7-4.7 4.8v2.7H5.5v3.8h3V22h3.8v-6.1h3.1l.5-3.8h-3.6V9.8c0-1.1.3-1.6 2.2-1.6Z"], fill: true },
  instagram: { paths: ["M8 3.8h8A4.2 4.2 0 0 1 20.2 8v8a4.2 4.2 0 0 1-4.2 4.2H8A4.2 4.2 0 0 1 3.8 16V8A4.2 4.2 0 0 1 8 3.8Z"], circles: [{ cx: 12, cy: 12, r: 3.2 }, { cx: 16.7, cy: 7.4, r: 0.7 }] },
  youtube: { paths: ["M21 8.2a3 3 0 0 0-2.1-2.1C17 5.6 12 5.6 12 5.6s-5 0-6.9.5A3 3 0 0 0 3 8.2 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.9.5 6.9.5 6.9.5s5 0 6.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 0-7.6Z", "m10 9.3 5.2 2.7-5.2 2.7V9.3Z"] },
  "x-twitter": { paths: ["M5 4.8 19 19.2", "M19 4.8 5 19.2"] },
  linkedin: { paths: ["M6.5 10v9", "M6.5 6.2v.01", "M11 19v-9", "M11 13.8c0-2.5 1.4-4 3.7-4 2 0 3.3 1.4 3.3 4V19"] },
  tiktok: { paths: ["M14 4v10.3a4.1 4.1 0 1 1-3.3-4", "M14 4c.8 2.6 2.4 4.2 5 4.7"] },
  globe: { paths: ["M3 12h18", "M12 3c2.3 2.6 3.5 5.6 3.5 9s-1.2 6.4-3.5 9", "M12 3c-2.3 2.6-3.5 5.6-3.5 9s1.2 6.4 3.5 9"], circles: [{ cx: 12, cy: 12, r: 9 }] },
  "arrow-up": { paths: ["M12 20V4", "M5.5 10.5 12 4l6.5 6.5"] }
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

  const lastClass = iconName.trim().toLowerCase().split(/\s+/).pop() || "";
  const normalized = lastClass.replace(/^fa-/, "");

  return iconDefinitions[normalized] ? normalized : null;
}

export function IconGlyph({
  name,
  className = "h-4 w-4",
  strokeWidth = 1.9
}: {
  name?: string | null;
  className?: string;
  strokeWidth?: number;
}) {
  const normalized = normalizeIconName(name);

  if (!normalized) {
    return null;
  }

  const icon = iconDefinitions[normalized];
  const fill = icon.fill ? "currentColor" : "none";
  const stroke = icon.fill ? "none" : "currentColor";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill={fill}
      stroke={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      focusable="false"
    >
      {icon.rects?.map((rect, index) => <rect key={`rect-${index}`} {...rect} />)}
      {icon.circles?.map((circle, index) => <circle key={`circle-${index}`} {...circle} />)}
      {icon.paths.map((path, index) => <path key={`path-${index}`} d={path} />)}
    </svg>
  );
}
