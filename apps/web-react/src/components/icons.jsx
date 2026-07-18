/**
 * Inline SVG icons — Google Material style, stroke-based, currentColor.
 * 24x24 viewBox, stroke-linecap: square, stroke-linejoin: miter for 8-bit feel.
 */

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "square",
  strokeLinejoin: "miter"
};

export function IconOverview(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

export function IconReview(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4h16v12H7l-3 3V4z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="11" x2="13" y2="11" />
    </svg>
  );
}

export function IconWall(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="4" />
      <rect x="3" y="10" width="8" height="4" />
      <rect x="13" y="10" width="8" height="4" />
      <rect x="3" y="16" width="18" height="4" />
    </svg>
  );
}

export function IconSkills(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" />
      <path d="M12 12l9-5" />
      <path d="M12 12v10" />
      <path d="M12 12L3 7" />
    </svg>
  );
}

export function IconAudit(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconVault(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="8" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="16" />
      <line x1="8" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export function IconMarket(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 9h18l-1 11H4L3 9z" />
      <path d="M8 9V6a4 4 0 018 0v3" />
    </svg>
  );
}

export function IconQuality(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2l2.5 7H22l-6 4.5 2.5 7L12 16l-6.5 4.5L8 13.5 2 9h7.5L12 2z" />
    </svg>
  );
}

export function IconRevenue(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="6" width="20" height="12" />
      <circle cx="12" cy="12" r="3" />
      <line x1="6" y1="9" x2="6" y2="15" />
      <line x1="18" y1="9" x2="18" y2="15" />
    </svg>
  );
}

export function IconRefresh(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12a9 9 0 0115-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 01-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg {...base} {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </svg>
  );
}

export function IconSun(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="5" y1="5" x2="7" y2="7" />
      <line x1="17" y1="17" x2="19" y2="19" />
      <line x1="5" y1="19" x2="7" y2="17" />
      <line x1="17" y1="7" x2="19" y2="5" />
    </svg>
  );
}

export function IconMoon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  );
}

export function IconStar(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2l2.5 7H22l-6 4.5 2.5 7L12 16l-6.5 4.5L8 13.5 2 9h7.5L12 2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconDownload(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function IconProject(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h9l4 4v14H6V3z" />
      <path d="M15 3v4h4" />
      <line x1="9" y1="12" x2="16" y2="12" />
      <line x1="9" y1="16" x2="14" y2="16" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export function IconChevronDown(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  );
}
