# Implement 10 Distinct Donation Alert Styles & Dashboard Selector

## Context
The user wants to choose from 10 different visual styles for Donation Alerts directly from the Dashboard. Each style must have unique positioning, animations, and aesthetics.

## Implementation Steps

### 1. Backend State Management
- Create `be/src/routes/alertStyle.ts` to manage the in-memory state of `activeAlertStyle` (1 to 10).
- Add endpoints: `GET /current` and `POST /set`.
- Broadcast a `style_changed` WebSocket event when updated.
- Mount this route in `be/src/index.ts`.

### 2. Frontend Component Factory
- Create directory `fe/src/components/alerts/styles/`.
- Build 10 distinct React components (e.g., `Style1Minimal.tsx`, `Style2Holographic.tsx`, ..., `Style10Glass.tsx`).
- Update `fe/src/components/overlay/Alerts.tsx` to fetch the current style on mount, listen to WebSocket changes, and dynamically render the chosen component using a `switch` statement.

### 3. Dashboard UI
- Add a "Donation Alert Styles" tab or section in the Dashboard.
- Display a 2x5 or 3x4 grid of buttons, each describing a theme.
- Make POST requests to `/api/alerts/style/set` when a style is clicked.

## Verification
- Open Dashboard and Overlay side-by-side.
- Click through all 10 styles in the Dashboard.
- Trigger a mock donation for each style and verify that the Overlay renders the correct position, animation, and aesthetic in real-time.
