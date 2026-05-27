# Character Sprite Sheet Prompts

## Template Prompt

```
A pixel art sprite sheet on a solid bright chroma-key green background (#00FF00).
The sheet is an 8x4 grid layout (8 columns, 4 rows), total image size exactly 1024x1024 pixels.
Each cell is 128x256 pixels (width x height).

Layout:
- Row 1 (top): 8 frames of IDLE animation
  - Frame 1-3: character standing upright, very subtle breathing sway
  - Frame 4-5: slight weight shift to one side
  - Frame 6-8: return to center, loopable

- Row 2: 8 frames of WALKING animation — full anatomical gait cycle
  - Frame 1 (Contact L): LEFT foot strikes ground, RIGHT foot behind, LEFT arm forward
  - Frame 2 (Down L): body weight drops, LEFT knee bends slightly
  - Frame 3 (Passing): feet cross center, body upright, arms at neutral
  - Frame 4 (Up L): body rises, LEFT foot pushing off, RIGHT foot swinging forward
  - Frame 5 (Contact R): RIGHT foot strikes ground, LEFT foot behind, RIGHT arm forward
  - Frame 6 (Down R): body weight drops, RIGHT knee bends slightly
  - Frame 7 (Passing): feet cross center again, body upright, arms at neutral
  - Frame 8 (Up R): body rises, RIGHT foot pushing off, LEFT foot swinging forward
  - CRITICAL: Each frame MUST show a distinctly different leg/arm position.

- Row 3: 8 frames of JUMPING animation
  - Frame 1-2: anticipation crouch (knees bent, body coiled)
  - Frame 3-4: ascent (body rising, feet leaving ground, arms up)
  - Frame 5 (peak): body fully extended at highest point
  - Frame 6-7: descent (body falling, arms adjusting)
  - Frame 8: landing impact (knees bent, body compressed)

- Row 4 (bottom): 8 frames of ATTACKING animation
  - Frame 1-2: wind-up stance (weight back, arm cocked)
  - Frame 3-5: attack motion (arm/weapon swings forward aggressively)
  - Frame 6: full extension at point of impact
  - Frame 7-8: recovery (return to neutral stance)

Character: [DESKRIPSI KARAKTER]

Style: 16-bit retro pixel art, character facing 3/4 angle sideways (slight side-scrolling game view),
clean flat colors, no anti-aliasing, no blur, no shadows outside the sprite, no gradients.
Each frame must be perfectly centered within its 128x256 cell with consistent uniform padding.
The full character body (head to feet) must fit within the cell height.
STRICT: background must be solid flat green (#00FF00) with absolutely ZERO color variation.
STRICT: walking row MUST demonstrate a full, natural alternating-leg gait cycle across all 8 frames.
```

---

## Char 1 — The Streamer (Default)

```
a young male streamer wearing a black hoodie with a red logo, dark jeans, white sneakers,
and a gaming headset around his neck. Spiky dark hair, confident expression.
```

## Char 2 — The Elf Mage

```
a female elf mage with long silver hair, pointed ears, wearing a dark blue robe with
golden trim and a small magical staff. Purple glowing eyes, elegant posture.
```

## Char 3 — The Robot

```
a small cute robot character with a round metallic body, glowing blue visor eyes,
small antenna on head, silver and white color scheme with orange accent bolts.
```

## Char 4 — The Ninja

```
a male ninja warrior wearing a dark grey sleeveless outfit with a red sash belt,
black mask covering lower face, short black hair, carrying a katana on the back.
```

## Char 5 — The Cat Girl

```
a cute anime cat girl with pink twin-tail hair, cat ears, wearing a white and pink
school uniform with a black ribbon, cat tail visible, cheerful smile.
```

---

## Cara Pakai:
1. Copy template prompt + character description
2. Generate gambar ukuran **1024x1024** dengan AI image generator
3. Simpan file sebagai `char_{nomor}.png`
4. Jalankan: `python3 /tmp/slice_8x4.py -o web/public/images/characters/char_{nomor} -n char_{nomor} char_{nomor}.png`
5. Atau manual: `python3 /tmp/slice_8x4.py` (edit default di script)
