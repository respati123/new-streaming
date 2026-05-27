# Refactor Donation Alert to Holographic Trading Card UI

## Context
The user requested a complete visual overhaul of the Donation Alert UI. They selected the "Holographic Trading Card" concept. The layout needs to change from a top-center horizontal bar to a top-right vertical card, featuring a massive floating avatar.

## Implementation Steps

### 1. Update Component Wrapper
In `fe/src/components/overlay/Alerts.tsx`:
- Change wrapper classes: `absolute top-10 right-12 z-30 pointer-events-none`
- Change container classes to: `backdrop-blur-md px-6 pt-20 pb-8 animate-slide-in-right relative flex flex-col items-center text-center min-w-[320px] max-w-[380px] rounded-2xl`

### 2. Avatar Styling (Pop-out effect)
- Change avatar container: `absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32`
- Ensure the image uses `rounded-full object-cover` and retains the glowing shadow.

### 3. Typography Hierarchy
- **Header**: "NEW DONATION" in small, tracked-out glowing text (`tracking-[0.3em] text-accent`).
- **Name**: The donor's name (`d.youtubeName || d.name`) in `text-2xl font-bold text-primary`.
- **Amount**: Massive glow `text-4xl text-accent glow-text`.
- **Message**: Rendered inside a stylized blockquote with a top-border or subtle background fill.

## Verification
1. Trigger a test donation via the dashboard (`/`).
2. Verify the card slides in from the right.
3. Verify the avatar overlaps the top edge smoothly.
4. Verify the text hierarchy matches a "Trading Card" aesthetic.
