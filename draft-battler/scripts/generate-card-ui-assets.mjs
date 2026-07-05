import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUTPUT_ROOT = path.resolve("draft-battler/public/assets/ui/cards");

const rarities = {
  common: {
    label: "Common",
    rim: "#8f7a53",
    rimDark: "#3e3424",
    rimLight: "#d2bd82",
    glow: "#9b7f4f",
  },
  uncommon: {
    label: "Uncommon",
    rim: "#4b9d52",
    rimDark: "#1f4728",
    rimLight: "#9be38f",
    glow: "#4ed064",
  },
  rare: {
    label: "Rare",
    rim: "#3578c8",
    rimDark: "#173a66",
    rimLight: "#8dbfff",
    glow: "#4f9cff",
  },
};

const archetypes = {
  support: {
    label: "Support",
    accent: "#9cff72",
    dark: "#1f5226",
    glow: "#6eff67",
  },
  tank: {
    label: "Tank",
    accent: "#f0c766",
    dark: "#60401b",
    glow: "#f4b846",
  },
  damage: {
    label: "Damage",
    accent: "#ff7768",
    dark: "#6a1913",
    glow: "#ff4c3b",
  },
};

const abilityIcons = {
  none: { accent: "#d9c28b", dark: "#554829", glow: "#d7a64f" },
  shield_wall: { accent: "#c7d3d8", dark: "#39484d", glow: "#9dbcc8" },
  bulwark: { accent: "#d6d8ca", dark: "#4f4f3d", glow: "#bfc7a6" },
  battle_banner: { accent: "#e3c46a", dark: "#5c4320", glow: "#e0ac3d" },
  charge: { accent: "#dfad62", dark: "#5a351c", glow: "#df8f3e" },
  backstab: { accent: "#e2b77b", dark: "#4f2c24", glow: "#e0834d" },
  snipe: { accent: "#92c9ee", dark: "#253e5b", glow: "#56a9e8" },
  fireball: { accent: "#ff9b55", dark: "#6a2418", glow: "#ff6c2f" },
  frost_hex: { accent: "#a9ddff", dark: "#24465f", glow: "#73c5ff" },
  bone_pact: { accent: "#d9d0aa", dark: "#504833", glow: "#c8ba75" },
  heal_ally: { accent: "#9bef7d", dark: "#24542c", glow: "#65e66b" },
  heal_only: { accent: "#9bef7d", dark: "#24542c", glow: "#65e66b" },
  pack_hunter: { accent: "#c7b38a", dark: "#503a25", glow: "#c99558" },
  thorn_guard: { accent: "#8edb75", dark: "#264f2a", glow: "#6ad15e" },
  stone_skin: { accent: "#c5c4b5", dark: "#4d4d45", glow: "#aca990" },
  pyro_splash: { accent: "#ffbd5d", dark: "#6c2717", glow: "#ff7430" },
  riposte: { accent: "#e5c48a", dark: "#573628", glow: "#df9250" },
};

await Promise.all([
  mkdir(path.join(OUTPUT_ROOT, "frames"), { recursive: true }),
  mkdir(path.join(OUTPUT_ROOT, "medallions"), { recursive: true }),
  mkdir(path.join(OUTPUT_ROOT, "archetypes"), { recursive: true }),
  mkdir(path.join(OUTPUT_ROOT, "abilities"), { recursive: true }),
]);

for (const [rarity, theme] of Object.entries(rarities)) {
  await writeFile(path.join(OUTPUT_ROOT, "frames", `card-frame-${rarity}.svg`), frameSvg(rarity, theme));
  await writeFile(
    path.join(OUTPUT_ROOT, "medallions", `card-medallion-${rarity}.svg`),
    medallionSvg(rarity, theme),
  );
}

for (const [archetype, theme] of Object.entries(archetypes)) {
  await writeFile(
    path.join(OUTPUT_ROOT, "archetypes", `archetype-${archetype}.svg`),
    archetypeSvg(archetype, theme),
  );
}

for (const [abilityId, theme] of Object.entries(abilityIcons)) {
  await writeFile(
    path.join(OUTPUT_ROOT, "abilities", `ability-${abilityId}.svg`),
    abilitySvg(abilityId, theme),
  );
}

await writeFile(path.join(OUTPUT_ROOT, "README.md"), readme());

function frameSvg(rarity, theme) {
  const outerPath = "M20 12H108L120 24V276L108 288H20L8 276V24Z";
  const bevelPath = "M27 25H101L112 36V264L101 275H27L16 264V36Z";
  const innerPath = "M31 37H97L105 45V255L97 263H31L23 255V45Z";

  return svg(
    128,
    300,
    `
  <defs>
    <linearGradient id="metal-${rarity}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${theme.rimLight}"/>
      <stop offset="0.18" stop-color="${theme.rim}"/>
      <stop offset="0.52" stop-color="${theme.rimDark}"/>
      <stop offset="0.82" stop-color="${theme.rim}"/>
      <stop offset="1" stop-color="${theme.rimLight}"/>
    </linearGradient>
    <filter id="soft-glow-${rarity}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.4" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 ${hexToUnit(theme.glow, 0)} 0 0 0 0 ${hexToUnit(theme.glow, 1)} 0 0 0 0 ${hexToUnit(theme.glow, 2)} 0 0 0 0.48 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <path d="${outerPath}" fill="none" stroke="#050604" stroke-width="9" stroke-linejoin="round"/>
  <path d="${outerPath}" fill="none" stroke="${theme.rimDark}" stroke-width="5.4" stroke-linejoin="round"/>
  <path d="${outerPath}" fill="none" stroke="url(#metal-${rarity})" stroke-width="2.8" stroke-linejoin="round" filter="url(#soft-glow-${rarity})"/>
  <path d="${bevelPath}" fill="none" stroke="#050604" stroke-opacity="0.72" stroke-width="3.2" stroke-linejoin="round"/>
  <path d="${bevelPath}" fill="none" stroke="${theme.rimLight}" stroke-opacity="0.5" stroke-width="1.15" stroke-linejoin="round"/>
  <path d="${innerPath}" fill="none" stroke="#ead9a0" stroke-opacity="0.2" stroke-width="1" stroke-linejoin="round"/>
  <path d="M18 61L35 44H51M77 44H93L110 61" fill="none" stroke="${theme.rimLight}" stroke-opacity="0.66" stroke-width="1.45" stroke-linecap="round"/>
  <path d="M18 238L35 255H51M77 255H93L110 238" fill="none" stroke="${theme.rimLight}" stroke-opacity="0.52" stroke-width="1.45" stroke-linecap="round"/>
  <path d="M15 92L22 99V201L15 208M113 92L106 99V201L113 208" fill="none" stroke="${theme.rimLight}" stroke-opacity="0.32" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M29 76H46M82 76H99M29 224H46M82 224H99" stroke="${theme.rimLight}" stroke-opacity="0.27" stroke-width="1" stroke-linecap="round"/>
`,
  );
}

function medallionSvg(rarity, theme) {
  return svg(
    128,
    128,
    `
  <defs>
    <radialGradient id="medallion-fill-${rarity}" cx="50%" cy="28%" r="72%">
      <stop offset="0" stop-color="#293229"/>
      <stop offset="0.52" stop-color="#111611"/>
      <stop offset="1" stop-color="#060806"/>
    </radialGradient>
    <linearGradient id="medallion-rim-${rarity}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${theme.rimLight}"/>
      <stop offset="0.38" stop-color="${theme.rim}"/>
      <stop offset="0.72" stop-color="${theme.rimDark}"/>
      <stop offset="1" stop-color="${theme.rimLight}"/>
    </linearGradient>
    <filter id="medallion-glow-${rarity}" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="3.2" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 ${hexToUnit(theme.glow, 0)} 0 0 0 0 ${hexToUnit(theme.glow, 1)} 0 0 0 0 ${hexToUnit(theme.glow, 2)} 0 0 0 0.55 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <circle cx="64" cy="64" r="55" fill="#070907" fill-opacity="0.78"/>
  <circle cx="64" cy="64" r="47" fill="url(#medallion-fill-${rarity})" stroke="url(#medallion-rim-${rarity})" stroke-width="8" filter="url(#medallion-glow-${rarity})"/>
  <circle cx="64" cy="64" r="34" fill="none" stroke="#f5edc9" stroke-opacity="0.15" stroke-width="1.6"/>
  <path d="M30 64H18M110 64H98M64 30V18M64 110V98" stroke="${theme.rimLight}" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"/>
`,
  );
}

function archetypeSvg(archetype, theme) {
  if (archetype === "support") {
    return svg(128, 128, iconDefs("support", theme) + `
  <path d="M64 12L75 48L112 36L88 64L112 92L75 80L64 116L53 80L16 92L40 64L16 36L53 48Z" fill="url(#icon-fill-support)" stroke="#f4ffe4" stroke-width="4.5" stroke-linejoin="round" filter="url(#icon-glow-support)"/>
  <circle cx="64" cy="64" r="17" fill="#f4ffe4" fill-opacity="0.24" stroke="#f4ffe4" stroke-width="3.5"/>
  <path d="M64 37V91M37 64H91" stroke="#f4ffe4" stroke-width="8" stroke-linecap="round"/>
`);
  }

  if (archetype === "tank") {
    return svg(128, 128, iconDefs("tank", theme) + `
  <path d="M64 13L104 28V62C104 88 88 107 64 117C40 107 24 88 24 62V28Z" fill="url(#icon-fill-tank)" stroke="#fff0be" stroke-width="5" stroke-linejoin="round" filter="url(#icon-glow-tank)"/>
  <path d="M64 25V106M37 43H91M36 64H92" fill="none" stroke="#fff6d1" stroke-opacity="0.8" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M64 25L93 36V63C93 81 82 96 64 106Z" fill="#fff5ca" fill-opacity="0.22"/>
  <path d="M34 31L24 23M94 31L104 23" stroke="#fff0be" stroke-opacity="0.55" stroke-width="4" stroke-linecap="round"/>
`);
  }

  return svg(128, 128, iconDefs("damage", theme) + `
  <g filter="url(#icon-glow-damage)">
    <path d="M30 19L45 16L72 58L61 69L20 36Z" fill="url(#icon-fill-damage)" stroke="#ffe1cf" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M98 19L83 16L56 58L67 69L108 36Z" fill="url(#icon-fill-damage)" stroke="#ffe1cf" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M60 70L31 111L18 98L51 62Z" fill="url(#icon-fill-damage)" stroke="#ffe1cf" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M68 70L97 111L110 98L77 62Z" fill="url(#icon-fill-damage)" stroke="#ffe1cf" stroke-width="4.5" stroke-linejoin="round"/>
  </g>
  <path d="M42 86L27 72M86 86L101 72" stroke="#ffe1cf" stroke-width="5" stroke-linecap="round"/>
  <circle cx="64" cy="64" r="8" fill="#fff1d8" fill-opacity="0.42" stroke="#ffe1cf" stroke-width="3"/>
`);
}

function iconDefs(id, theme) {
  return `
  <defs>
    <radialGradient id="icon-fill-${id}" cx="50%" cy="22%" r="72%">
      <stop offset="0" stop-color="#fff7d7"/>
      <stop offset="0.42" stop-color="${theme.accent}"/>
      <stop offset="1" stop-color="${theme.dark}"/>
    </radialGradient>
    <filter id="icon-glow-${id}" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur stdDeviation="2.6" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 ${hexToUnit(theme.glow, 0)} 0 0 0 0 ${hexToUnit(theme.glow, 1)} 0 0 0 0 ${hexToUnit(theme.glow, 2)} 0 0 0 0.62 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
`;
}

function abilitySvg(abilityId, theme) {
  const body = {
    none: `
  <path d="M78 17L95 34L46 91L23 105L37 82Z" fill="url(#ability-fill-none)" stroke="#fff0c8" stroke-width="5" stroke-linejoin="round" filter="url(#ability-glow-none)"/>
  <path d="M72 41L88 57M32 98L18 112" stroke="#fff0c8" stroke-width="6" stroke-linecap="round"/>
`,
    shield_wall: `
  <path d="M64 15L101 29V61C101 88 86 106 64 115C42 106 27 88 27 61V29Z" fill="url(#ability-fill-shield_wall)" stroke="#f2f7ed" stroke-width="5" stroke-linejoin="round" filter="url(#ability-glow-shield_wall)"/>
  <path d="M64 24V104M39 43H89M38 63H90" stroke="#f2f7ed" stroke-opacity="0.72" stroke-width="4" stroke-linecap="round"/>
`,
    bulwark: `
  <path d="M36 18H92L99 27V101L64 116L29 101V27Z" fill="url(#ability-fill-bulwark)" stroke="#f4f1da" stroke-width="5" stroke-linejoin="round" filter="url(#ability-glow-bulwark)"/>
  <path d="M43 33H85M43 55H85M43 77H85M64 27V105" stroke="#f4f1da" stroke-opacity="0.67" stroke-width="4" stroke-linecap="round"/>
`,
    battle_banner: `
  <path d="M42 18V112" stroke="#ffe5a3" stroke-width="7" stroke-linecap="round" filter="url(#ability-glow-battle_banner)"/>
  <path d="M45 23H96L85 47L99 72H45Z" fill="url(#ability-fill-battle_banner)" stroke="#ffe5a3" stroke-width="5" stroke-linejoin="round"/>
  <path d="M57 36H79" stroke="#fff4c8" stroke-width="4" stroke-linecap="round"/>
`,
    charge: `
  <path d="M24 84C39 53 67 34 104 25" stroke="#ffe6b4" stroke-width="8" stroke-linecap="round" filter="url(#ability-glow-charge)"/>
  <path d="M88 16L108 24L92 39" fill="url(#ability-fill-charge)" stroke="#ffe6b4" stroke-width="5" stroke-linejoin="round"/>
  <path d="M28 82L45 103M47 65L63 89" stroke="#ffe6b4" stroke-opacity="0.7" stroke-width="5" stroke-linecap="round"/>
`,
    backstab: `
  <path d="M80 13L96 29L51 80L28 98L41 73Z" fill="url(#ability-fill-backstab)" stroke="#fff0cf" stroke-width="5" stroke-linejoin="round" filter="url(#ability-glow-backstab)"/>
  <path d="M38 100L23 115M72 36L88 52" stroke="#fff0cf" stroke-width="6" stroke-linecap="round"/>
`,
    snipe: `
  <path d="M21 66H99" stroke="#dff5ff" stroke-width="7" stroke-linecap="round" filter="url(#ability-glow-snipe)"/>
  <path d="M83 44L108 66L83 88" fill="url(#ability-fill-snipe)" stroke="#dff5ff" stroke-width="5" stroke-linejoin="round"/>
  <path d="M32 47L52 66L32 85" stroke="#dff5ff" stroke-opacity="0.62" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
`,
    fireball: `
  <path d="M67 16C85 36 100 52 93 78C88 98 74 114 55 114C36 114 24 99 27 80C30 62 47 55 44 36C57 42 62 31 67 16Z" fill="url(#ability-fill-fireball)" stroke="#fff0bc" stroke-width="5" stroke-linejoin="round" filter="url(#ability-glow-fireball)"/>
  <path d="M60 56C73 70 75 89 61 99C50 94 46 82 50 72C53 65 57 61 60 56Z" fill="#fff0bc" fill-opacity="0.44"/>
`,
    frost_hex: `
  <path d="M64 17V111M24 40L104 88M24 88L104 40" stroke="#e2f7ff" stroke-width="6" stroke-linecap="round" filter="url(#ability-glow-frost_hex)"/>
  <circle cx="64" cy="64" r="13" fill="url(#ability-fill-frost_hex)" stroke="#e2f7ff" stroke-width="4"/>
`,
    bone_pact: `
  <path d="M38 53C38 31 51 20 64 20C77 20 90 31 90 53V77C90 91 79 102 64 102C49 102 38 91 38 77Z" fill="url(#ability-fill-bone_pact)" stroke="#f0e9c7" stroke-width="5" filter="url(#ability-glow-bone_pact)"/>
  <circle cx="53" cy="59" r="6" fill="#18150f"/><circle cx="75" cy="59" r="6" fill="#18150f"/>
  <path d="M54 86H74M47 105H81" stroke="#f0e9c7" stroke-width="5" stroke-linecap="round"/>
`,
    heal_ally: healIcon("heal_ally"),
    heal_only: healIcon("heal_only"),
    pack_hunter: `
  <circle cx="44" cy="50" r="10" fill="url(#ability-fill-pack_hunter)" stroke="#f2dfb9" stroke-width="4" filter="url(#ability-glow-pack_hunter)"/>
  <circle cx="64" cy="40" r="10" fill="url(#ability-fill-pack_hunter)" stroke="#f2dfb9" stroke-width="4"/>
  <circle cx="84" cy="50" r="10" fill="url(#ability-fill-pack_hunter)" stroke="#f2dfb9" stroke-width="4"/>
  <path d="M34 88C40 68 54 62 64 62C74 62 88 68 94 88C88 103 77 109 64 109C51 109 40 103 34 88Z" fill="url(#ability-fill-pack_hunter)" stroke="#f2dfb9" stroke-width="5" stroke-linejoin="round"/>
`,
    thorn_guard: `
  <path d="M65 16C89 35 99 60 88 84C77 108 51 113 31 93C55 88 69 70 65 16Z" fill="url(#ability-fill-thorn_guard)" stroke="#eaffd6" stroke-width="5" stroke-linejoin="round" filter="url(#ability-glow-thorn_guard)"/>
  <path d="M31 96C49 79 67 56 91 34M36 77L20 67M54 57L40 44M72 40L66 24" stroke="#eaffd6" stroke-width="4" stroke-linecap="round"/>
`,
    stone_skin: `
  <path d="M64 14L104 38V86L64 114L24 86V38Z" fill="url(#ability-fill-stone_skin)" stroke="#f2f0de" stroke-width="5" stroke-linejoin="round" filter="url(#ability-glow-stone_skin)"/>
  <path d="M64 14V114M24 38L104 86M104 38L24 86" stroke="#f2f0de" stroke-opacity="0.38" stroke-width="4" stroke-linecap="round"/>
`,
    pyro_splash: `
  <path d="M64 16L75 48L110 40L86 66L108 91L74 84L64 116L54 84L20 91L42 66L18 40L53 48Z" fill="url(#ability-fill-pyro_splash)" stroke="#fff0bc" stroke-width="5" stroke-linejoin="round" filter="url(#ability-glow-pyro_splash)"/>
  <circle cx="64" cy="66" r="16" fill="#fff0bc" fill-opacity="0.32"/>
`,
    riposte: `
  <path d="M33 19L93 105M95 19L35 105" stroke="#fff0cf" stroke-width="8" stroke-linecap="round" filter="url(#ability-glow-riposte)"/>
  <path d="M29 15L40 26M88 26L99 15M27 112L40 99M88 99L101 112" stroke="#fff0cf" stroke-width="5" stroke-linecap="round"/>
`,
  }[abilityId];

  return svg(128, 128, abilityDefs(abilityId, theme) + body);
}

function healIcon(id) {
  return `
  <path d="M55 18H73V55H110V73H73V110H55V73H18V55H55Z" fill="url(#ability-fill-${id})" stroke="#f3ffd9" stroke-width="5" stroke-linejoin="round" filter="url(#ability-glow-${id})"/>
  <circle cx="64" cy="64" r="47" fill="none" stroke="#f3ffd9" stroke-opacity="0.28" stroke-width="4"/>
`;
}

function abilityDefs(id, theme) {
  return `
  <defs>
    <radialGradient id="ability-fill-${id}" cx="50%" cy="22%" r="78%">
      <stop offset="0" stop-color="#fff8d6"/>
      <stop offset="0.46" stop-color="${theme.accent}"/>
      <stop offset="1" stop-color="${theme.dark}"/>
    </radialGradient>
    <filter id="ability-glow-${id}" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur stdDeviation="2.8" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 ${hexToUnit(theme.glow, 0)} 0 0 0 0 ${hexToUnit(theme.glow, 1)} 0 0 0 0 ${hexToUnit(theme.glow, 2)} 0 0 0 0.68 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
`;
}

function readme() {
  return `# Draft Battler Card UI Assets

Generated by \`draft-battler/scripts/generate-card-ui-assets.mjs\`.

## Visual rules

- Rarity controls the outer frame, medallion rim, and rarity label.
- Archetype controls the icon silhouette and the restrained inner card mood.
- Rare is blue, uncommon is green, common is muted iron/bronze.
- Gold is reserved for major UI emphasis such as the Fight button or future higher rarities.
- The card body/frame is a raster template asset, not a CSS imitation; DOM only overlays unit art, text, stats, and icons.

## Files

- \`templates/card-template-{common,uncommon,rare}.png\`
- \`frames/card-frame-{common,uncommon,rare}.svg\`
- \`medallions/card-medallion-{common,uncommon,rare}.svg\`
- \`archetypes/archetype-{support,tank,damage}.svg\`
- \`abilities/ability-{abilityId}.svg\`
`;
}

function svg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
${body.trim()}
</svg>
`;
}

function hexToUnit(hex, channel) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized.slice(channel * 2, channel * 2 + 2), 16);
  return (value / 255).toFixed(3);
}
