/* Polaris glyph set v2 — bespoke geometric duotone icons (July 2026).

   Shapes are data, not JSX, for two reasons: `scripts/check-navigation-config.mjs`
   imports the registry through `NavIcon.js` under plain Node, which cannot parse
   JSX; and one flat table makes the drawing language easy to keep consistent.

   Language: 24-unit grid, geometric primitives, rounded 2px-family strokes, two
   tones per glyph. `data-tone="soft"` drops a part to a fraction of the accent
   (globals.css) so every icon reads as a product icon rather than a single-weight
   outline. `data-part` names a group so the landing hover animations can move it
   independently; parts without a name never move.

   Each entry is a list of [tag, attributes] pairs rendered by `Glyph`. */

export const GLYPH_SHAPES = Object.freeze({
  Activity: [
    ['path', { 'data-tone': 'soft', d: 'M3 19.4h18' }],
    ['path', { d: 'M3 12.6h3.6l2.4-6 3.6 12 2.4-6H21' }]
  ],

  ArrowLeftRight: [
    ['path', { d: 'M7.4 6.6h13.1' }],
    ['path', { d: 'm16.8 2.9 3.7 3.7-3.7 3.7' }],
    ['path', { 'data-tone': 'soft', d: 'M16.6 17.4H3.5' }],
    ['path', { 'data-tone': 'soft', d: 'm7.2 13.7-3.7 3.7 3.7 3.7' }]
  ],

  BadgeCheck: [
    [
      'path',
      {
        'data-tone': 'soft',
        d: 'm12 2.6 2.6 1.6 3-.3 1 2.9 2.5 1.7-.8 2.9.8 2.9-2.5 1.7-1 2.9-3-.3L12 21.4l-2.6-1.6-3 .3-1-2.9L2.9 15.8l.8-2.9-.8-2.9 2.5-1.7 1-2.9 3 .3z'
      }
    ],
    ['path', { d: 'm8.6 12.2 2.5 2.5 4.4-4.8' }]
  ],

  BadgeDollarSign: [
    ['circle', { 'data-tone': 'soft', cx: 12, cy: 12, r: 9 }],
    ['path', { 'data-tone': 'soft', d: 'M12 6.4v11.2' }],
    [
      'path',
      {
        d: 'M14.5 9.4c-.6-.7-1.5-1.1-2.5-1.1-1.4 0-2.4.8-2.4 1.8 0 2.6 5 1.4 5 4.1 0 1.2-1.1 2-2.6 2-1.1 0-2.1-.4-2.7-1.2'
      }
    ]
  ],

  BookOpen: [
    ['path', { 'data-tone': 'soft', d: 'M12 7.4v12.2' }],
    ['path', { d: 'M12 7.4C10.3 5.9 7.7 5.2 4 5.4V17.3c3.7-.2 6.3.5 8 2.3' }],
    [
      'path',
      { 'data-part': 'book-cover', d: 'M12 7.4C13.7 5.9 16.3 5.2 20 5.4V17.3c-3.7-.2-6.3.5-8 2.3' }
    ]
  ],

  ChartColumn: [
    ['path', { 'data-tone': 'soft', d: 'M4 3.4v15.2a1.4 1.4 0 0 0 1.4 1.4H20.6' }],
    ['rect', { height: 6.6, rx: 1, width: 3, x: 7.4, y: 13.4 }],
    ['rect', { height: 11.4, rx: 1, width: 3, x: 12.2, y: 8.6 }],
    ['rect', { 'data-tone': 'soft', height: 8.6, rx: 1, width: 3, x: 17, y: 11.4 }]
  ],

  ChartLine: [
    ['path', { 'data-tone': 'soft', d: 'M4 3.6v15.4a1.4 1.4 0 0 0 1.4 1.4H20.4' }],
    [
      'path',
      {
        'data-part': 'curve-line',
        d: 'M6.6 17.2c3 0 3.6-2.6 5.4-5.6 1.6-2.7 3-4.2 6.6-4.2',
        pathLength: 100
      }
    ],
    [
      'circle',
      { 'data-part': 'curve-dot', cx: 18.6, cy: 7.4, fill: 'currentColor', r: 1.7, stroke: 'none' }
    ]
  ],

  ChartPie: [
    ['path', { 'data-tone': 'soft', d: 'M20.6 15.2A9 9 0 1 1 8.8 3.5' }],
    ['path', { d: 'M12 3v9h9a9 9 0 0 0-9-9z' }]
  ],

  Cog: [
    ['circle', { cx: 12, cy: 12, r: 3.3 }],
    ['circle', { 'data-tone': 'soft', cx: 12, cy: 12, r: 7.4 }],
    [
      'path',
      {
        'data-tone': 'soft',
        d: 'M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5'
      }
    ]
  ],

  Coins: [
    ['path', { d: 'M4.6 8.4v7c0 1.9 3.3 3.4 7.4 3.4s7.4-1.5 7.4-3.4v-7' }],
    ['ellipse', { 'data-tone': 'soft', cx: 12, cy: 8.4, rx: 7.4, ry: 3.4 }],
    ['path', { 'data-tone': 'soft', d: 'M4.6 11.9c0 1.9 3.3 3.4 7.4 3.4s7.4-1.5 7.4-3.4' }]
  ],

  Compass: [
    ['circle', { 'data-tone': 'soft', cx: 12, cy: 12, r: 9 }],
    ['path', { d: 'm15.6 8.4-2 5.2-5.2 2 2-5.2z' }]
  ],

  FileText: [
    [
      'path',
      {
        d: 'M13.8 3H7.4a2.2 2.2 0 0 0-2.2 2.2v13.6A2.2 2.2 0 0 0 7.4 21h9.2a2.2 2.2 0 0 0 2.2-2.2V8.2z'
      }
    ],
    ['path', { 'data-tone': 'soft', d: 'M13.8 3v5.2h5' }],
    ['path', { 'data-tone': 'soft', d: 'M8.6 13.2h6.8M8.6 16.6h4.4' }]
  ],

  FlaskConical: [
    ['path', { d: 'M9.6 3.4v6.2L4.5 18.1a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14.4 9.6V3.4' }],
    ['path', { 'data-tone': 'soft', d: 'M8.6 3.4h6.8' }],
    ['path', { 'data-tone': 'soft', d: 'M7.2 14.4h9.6' }],
    [
      'circle',
      { 'data-tone': 'soft', cx: 10.2, cy: 17.6, fill: 'currentColor', r: 0.9, stroke: 'none' }
    ],
    [
      'circle',
      {
        'data-part': 'flask-bubble',
        cx: 13.4,
        cy: 18.2,
        fill: 'currentColor',
        opacity: 0,
        r: 1,
        stroke: 'none'
      }
    ]
  ],

  Gavel: [
    ['rect', { height: 5.2, rx: 1.6, transform: 'rotate(45 16 6)', width: 9, x: 11.5, y: 3.4 }],
    ['path', { 'data-tone': 'soft', d: 'M13.6 8.4 6.4 15.6' }],
    ['path', { d: 'M3.4 20.6h9.2' }]
  ],

  Gem: [
    ['path', { d: 'M12 3.6 5 8.6l7 11.8 7-11.8z' }],
    ['path', { 'data-tone': 'soft', d: 'M5 8.6h14M9.2 8.6 12 20.4l2.8-11.8' }]
  ],

  HandCoins: [
    ['circle', { 'data-tone': 'soft', cx: 15.2, cy: 9, r: 2.4 }],
    ['circle', { 'data-part': 'loan-coin', cx: 10, cy: 7.4, r: 3 }],
    ['path', { d: 'M2.6 14.8c0 3 4.2 5.2 9.4 5.2s9.4-2.2 9.4-5.2' }],
    ['path', { 'data-tone': 'soft', d: 'M2.6 14.8V13M21.4 14.8V13' }]
  ],

  Landmark: [
    ['path', { 'data-tone': 'soft', d: 'M2.8 9.6 12 3.8l9.2 5.8' }],
    ['path', { d: 'M6 10.4v7.4M10 10.4v7.4M14 10.4v7.4M18 10.4v7.4' }],
    ['path', { d: 'M3.2 17.8h17.6' }],
    ['path', { 'data-tone': 'soft', d: 'M4.6 20.6h14.8' }]
  ],

  LayoutDashboard: [
    ['rect', { height: 8.4, rx: 1.6, width: 7.4, x: 3, y: 3 }],
    ['rect', { 'data-tone': 'soft', height: 5, rx: 1.6, width: 7.4, x: 13.6, y: 3 }],
    ['rect', { height: 10, rx: 1.6, width: 7.4, x: 13.6, y: 11 }],
    ['rect', { 'data-tone': 'soft', height: 6.6, rx: 1.6, width: 7.4, x: 3, y: 14.4 }]
  ],

  LifeBuoy: [
    ['circle', { cx: 12, cy: 12, r: 9 }],
    ['circle', { 'data-tone': 'soft', cx: 12, cy: 12, r: 4 }],
    ['path', { d: 'm14.8 9.2 3.6-3.6M9.2 9.2 5.6 5.6M9.2 14.8l-3.6 3.6M14.8 14.8l3.6 3.6' }]
  ],

  Map: [
    ['path', { 'data-tone': 'soft', d: 'M2.8 6.4 9 4.2v13.4l-6.2 2.2z' }],
    ['path', { d: 'm9 4.2 6 2.2v13.4L9 17.6z' }],
    ['path', { 'data-tone': 'soft', d: 'm15 6.4 6.2-2.2v13.4L15 19.8z' }]
  ],

  Network: [
    ['rect', { height: 5, rx: 1.5, width: 6, x: 9, y: 2.6 }],
    ['rect', { 'data-tone': 'soft', height: 5, rx: 1.5, width: 6, x: 2.6, y: 16.4 }],
    ['rect', { 'data-tone': 'soft', height: 5, rx: 1.5, width: 6, x: 15.4, y: 16.4 }],
    ['path', { 'data-tone': 'soft', d: 'M12 7.6V12M5.6 16.4V12h12.8v4.4' }]
  ],

  Percent: [
    ['path', { d: 'M18.6 5.4 5.4 18.6' }],
    ['circle', { 'data-tone': 'soft', cx: 7.8, cy: 7.8, r: 2.6 }],
    ['circle', { 'data-tone': 'soft', cx: 16.2, cy: 16.2, r: 2.6 }]
  ],

  RadioTower: [
    ['circle', { cx: 12, cy: 8.6, r: 1.9 }],
    ['path', { d: 'm12 10.5-3.6 10.5M12 10.5 15.6 21' }],
    ['path', { 'data-tone': 'soft', d: 'M9.4 16.6h5.2' }],
    [
      'path',
      {
        'data-tone': 'soft',
        d: 'M8.4 5.2a5 5 0 0 0 0 6.8M15.6 5.2a5 5 0 0 1 0 6.8M5.6 2.6a8.6 8.6 0 0 0 0 12M18.4 2.6a8.6 8.6 0 0 1 0 12'
      }
    ]
  ],

  RefreshCw: [
    ['path', { d: 'M20.4 8.6A8.6 8.6 0 0 0 5.4 6.4L2.6 9.1' }],
    ['path', { d: 'M2.6 4.6v4.5h4.5' }],
    ['path', { 'data-tone': 'soft', d: 'M3.6 15.4a8.6 8.6 0 0 0 15 2.2l2.8-2.7' }],
    ['path', { 'data-tone': 'soft', d: 'M21.4 19.4v-4.5h-4.5' }]
  ],

  Route: [
    ['circle', { cx: 5.6, cy: 17.6, r: 2.6 }],
    ['circle', { cx: 18.4, cy: 3.2, r: 2.6 }],
    [
      'path',
      { 'data-tone': 'soft', d: 'M8.2 17.6h5.2a3.6 3.6 0 0 0 0-7.2h-2.8a3.6 3.6 0 0 1 0-7.2h5.2' }
    ]
  ],

  Scale: [
    [
      'g',
      { 'data-part': 'scale-beam' },
      ['path', { d: 'M4.6 6.8h14.8' }],
      ['path', { 'data-tone': 'soft', d: 'M4.6 6.8 2.2 12.6h4.8z' }],
      ['path', { 'data-tone': 'soft', d: 'M19.4 6.8 17 12.6h4.8z' }]
    ],
    ['path', { d: 'M12 4.6v15.2' }],
    ['path', { d: 'M8.4 19.8h7.2' }],
    [
      'circle',
      { 'data-tone': 'soft', cx: 12, cy: 4.4, fill: 'currentColor', r: 1.1, stroke: 'none' }
    ]
  ],

  ScrollText: [
    ['rect', { 'data-tone': 'soft', height: 3.2, rx: 1.6, width: 16, x: 4, y: 3 }],
    ['rect', { 'data-tone': 'soft', height: 3.2, rx: 1.6, width: 16, x: 4, y: 17.8 }],
    ['path', { d: 'M6.2 6.2h11.6v11.6H6.2z' }],
    ['path', { d: 'M8.8 10h6.4M8.8 13.6h4.4' }]
  ],

  ShieldAlert: [
    [
      'path',
      {
        'data-tone': 'soft',
        d: 'M12 2.8 4.6 5.6v6.1c0 4.4 3 7.7 7.4 9.5 4.4-1.8 7.4-5.1 7.4-9.5V5.6z'
      }
    ],
    ['path', { d: 'M12 8.2v4.4' }],
    ['circle', { cx: 12, cy: 16.2, fill: 'currentColor', r: 1, stroke: 'none' }]
  ],

  ShieldCheck: [
    [
      'path',
      {
        'data-tone': 'soft',
        d: 'M12 2.8 4.6 5.6v6.1c0 4.4 3 7.7 7.4 9.5 4.4-1.8 7.4-5.1 7.4-9.5V5.6z'
      }
    ],
    ['path', { 'data-part': 'shield-check', d: 'm8.4 12 2.6 2.6 4.6-5', pathLength: 100 }]
  ],

  SlidersHorizontal: [
    ['path', { 'data-tone': 'soft', d: 'M3.6 7.4h9.4M17 7.4h3.4' }],
    ['circle', { cx: 15, cy: 7.4, r: 2 }],
    ['path', { 'data-tone': 'soft', d: 'M3.6 16.6H7M11 16.6h9.4' }],
    ['circle', { cx: 9, cy: 16.6, r: 2 }]
  ],

  Split: [
    ['path', { 'data-tone': 'soft', d: 'M2.6 12H8' }],
    ['path', { d: 'M8 12c3.4 0 3.4-5.4 6.8-5.4h4.8' }],
    ['path', { d: 'M8 12c3.4 0 3.4 5.4 6.8 5.4h4.8' }],
    ['path', { 'data-tone': 'soft', d: 'm17.2 4.2 2.8 2.4-2.8 2.4M17.2 15l2.8 2.4-2.8 2.4' }]
  ],

  Stamp: [
    ['path', { d: 'M4.8 18.4h14.4v-1.6a2.6 2.6 0 0 0-2.6-2.6H7.4a2.6 2.6 0 0 0-2.6 2.6z' }],
    [
      'path',
      {
        d: 'M14.4 14.2V9.6c0-1.6 1.1-1.6 1.1-3.4A3.5 3.5 0 0 0 12 2.7a3.5 3.5 0 0 0-3.5 3.5c0 1.8 1.1 1.8 1.1 3.4v4.6'
      }
    ],
    ['path', { 'data-tone': 'soft', d: 'M4.5 21h15' }]
  ],

  Telescope: [
    ['rect', { height: 4.6, rx: 2.3, transform: 'rotate(-22 12 11.3)', width: 16, x: 4, y: 9 }],
    ['path', { d: 'm9.6 14.6-2 5.9M13.8 12.9l2.4 7.6' }],
    ['path', { 'data-tone': 'soft', d: 'M6.6 20.5h10.8' }],
    [
      'circle',
      { 'data-tone': 'soft', cx: 20, cy: 4.6, fill: 'currentColor', r: 1.2, stroke: 'none' }
    ]
  ],

  TrendingUp: [
    ['path', { d: 'm3.5 17.5 6-6 3.5 3.5 7.5-7.5' }],
    ['path', { 'data-tone': 'soft', d: 'M15.5 7.5h5v5' }]
  ],

  TriangleAlert: [
    ['path', { 'data-tone': 'soft', d: 'M12 4.3 21.2 20.2H2.8z' }],
    [
      'g',
      { 'data-part': 'risk-mark' },
      ['path', { d: 'M12 10v3.9' }],
      ['circle', { cx: 12, cy: 17.2, fill: 'currentColor', r: 0.95, stroke: 'none' }]
    ]
  ],

  Vault: [
    ['rect', { height: 17.6, rx: 2.4, width: 18, x: 3, y: 3.2 }],
    ['circle', { cx: 12, cy: 12, r: 4 }],
    [
      'circle',
      { 'data-tone': 'soft', cx: 12, cy: 12, fill: 'currentColor', r: 1.1, stroke: 'none' }
    ],
    ['path', { d: 'M12 6.2v1.8M12 16v1.8M6.2 12H8M16 12h1.8' }]
  ],

  Vote: [
    ['path', { 'data-tone': 'soft', d: 'M6.6 11.4V4.4h10.8v7' }],
    ['path', { d: 'm9.4 7.4 1.9 1.9 3.6-3.9' }],
    ['path', { d: 'M3.4 13.4h17.2v5a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2z' }]
  ],

  Waves: [
    ['path', { 'data-tone': 'soft', d: 'M2.6 7.4q2.35-2.4 4.7 0t4.7 0 4.7 0 4.7 0' }],
    ['path', { d: 'M2.6 12q2.35-2.4 4.7 0t4.7 0 4.7 0 4.7 0' }],
    ['path', { 'data-tone': 'soft', d: 'M2.6 16.6q2.35-2.4 4.7 0t4.7 0 4.7 0 4.7 0' }]
  ],

  Workflow: [
    ['rect', { height: 6.4, rx: 1.6, width: 7.4, x: 2.6, y: 2.6 }],
    ['rect', { height: 6.4, rx: 1.6, width: 7.4, x: 14, y: 15 }],
    ['path', { 'data-tone': 'soft', d: 'M6.3 9v3.7a2.3 2.3 0 0 0 2.3 2.3h9.1V15' }]
  ]
})

export const GLYPH_NAMES = Object.freeze(Object.keys(GLYPH_SHAPES))
