// Chunky inline icons (2.4px strokes, round joins) so they read like ink.
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };

const PATHS = {
  camera: <><rect x="2.5" y="6.5" width="14" height="11" rx="2.5" {...P} /><path d="M16.5 10.5l5-3v9l-5-3" {...P} /><circle cx="7" cy="10.5" r="1.4" fill="currentColor" /></>,
  keys: <><circle cx="8" cy="12" r="4.5" {...P} /><path d="M12.5 12H21M18 12v3.5M21 12v2.5" {...P} /></>,
  question: <><path d="M4 5.5h16v10H11l-4.5 4v-4H4z" {...P} /><path d="M10 9a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6.9" {...P} /><circle cx="12" cy="13.6" r="0.6" fill="currentColor" /></>,
  test: <><path d="M9 3h6M10 3v6l-5 9.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L14 9V3" {...P} /><path d="M7.5 15h9" {...P} /></>,
  eye: <><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" {...P} /><circle cx="12" cy="12" r="3" fill="currentColor" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" {...P} /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" {...P} /><circle cx="12" cy="15.5" r="1.5" fill="currentColor" /></>,
  star: <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2 6.4 20.2l1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />,
  alarm: <><path d="M6 17V11a6 6 0 0 1 12 0v6" {...P} /><path d="M3.5 17h17M10 20.5h4M12 2.5v2M3.5 6l1.6 1.2M20.5 6l-1.6 1.2" {...P} /></>,
  heart: <path d="M12 20.5S3.5 15.4 3.5 9.3A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 8.5 2.1c0 6.1-8.5 11.2-8.5 11.2z" {...P} />,
  home: <><path d="M3.5 11L12 4l8.5 7" {...P} /><path d="M6 9.5V20h12V9.5" {...P} /><path d="M10 20v-5.5h4V20" {...P} /></>,
  hospital: <><rect x="4" y="4" width="16" height="16" rx="2.5" {...P} /><path d="M12 8v8M8 12h8" {...P} /></>,
  office: <><rect x="5" y="3.5" width="14" height="17" rx="1.5" {...P} /><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M9 14.5h2M13 14.5h2M11 20.5v-3h2v3" {...P} /></>,
  cards: <><rect x="7" y="4" width="12" height="15" rx="2" {...P} transform="rotate(8 13 11.5)" /><rect x="4" y="5" width="12" height="15" rx="2" {...P} fill="currentColor" fillOpacity="0.15" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" {...P} />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" {...P} />,
  pin: <><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" {...P} /><circle cx="12" cy="10" r="2.3" fill="currentColor" /></>,
  plug: <><path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21" {...P} /></>,
  zzz: <path d="M4 7h5L4 13h5M12 4h7l-7 8h7M14 16h5l-5 5h5" {...P} strokeWidth="2" />,
  // scenario icons
  bin: <><path d="M5 7h14l-1.3 13H6.3z" {...P} /><path d="M3.5 7h17M9.5 7V4.5h5V7M9.5 11v5.5M14.5 11v5.5" {...P} /></>,
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" {...P} />,
  bolt: <path d="M13.5 2.5L5 13.5h6l-1 8 8.5-11h-6z" {...P} />,
  balloon: <><ellipse cx="12" cy="9" rx="5.5" ry="6.5" {...P} /><path d="M12 15.5l-1 1.5h2zM12 17c0 2-2 2.5-1 4.5" {...P} /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" {...P} strokeWidth="2" />,
  shield: <><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z" {...P} /><path d="M8.5 12l2.5 2.5 4.5-5" {...P} /></>,
  battery: <><rect x="3" y="7.5" width="16" height="9" rx="2" {...P} /><path d="M21.5 10.5v3M11.5 9l-2 3h3l-2 3" {...P} /></>,
  door: <><path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21M3.5 21h17" {...P} /><circle cx="14.5" cy="12.5" r="1.1" fill="currentColor" /></>,
  task: <><rect x="5" y="4" width="14" height="17" rx="2" {...P} /><path d="M9 3.5h6v3H9zM8.5 11h7M8.5 15h5" {...P} /></>,
};

export default function Icon({ name, size = 20, className, style }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style} aria-hidden focusable="false">
      {PATHS[name] ?? PATHS.task}
    </svg>
  );
}
