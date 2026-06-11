# **ResQ UI/UX Architecture Document**

## **1. Global Design System (Accessibility & Theming)**

### **1.1 Color Palette (WCAG 2.1 AAA Compliant)**
Colors must not be the only indicator of meaning. Every color state is accompanied by an icon or text label.
*   **Primary Action (Safe/Navigate):** Blue (`#1D4ED8` on light, `#3B82F6` on dark).
*   **Danger / SOS:** Crimson Red (`#B91C1C` on light, `#EF4444` on dark). Used strictly for active hazards and the SOS button.
*   **Warning / Low Stock:** Amber (`#D97706`).
*   **Safe / Success:** Emerald Green (`#047857`).
*   **Neutral / Backgrounds:**
    *   *Light Mode:* Background `#F8FAFC`, Surface `#FFFFFF`, Text `#0F172A`.
    *   *Dark Mode:* Background `#0F172A`, Surface `#1E293B`, Text `#F8FAFC`.

### **1.2 Typography & Readability**
*   **Font Family:** *Inter* or *System-UI*. Clean, sans-serif, high legibility.
*   **Sizing:** Base font size is **16px** (never smaller than 14px for meta-text).
*   **Hierarchy:** Heavy weights (800) for critical data (distances, severities). Regular weights (400) for descriptions.

### **1.3 Iconography (lucide-react)**
To ensure visual consistency, cross-OS uniformity, and instant load times, the application uses **lucide-react** (SVG format) exclusively. Emojis and heavy icon fonts (like FontAwesome) are strictly avoided.
*   **Implementation:** Inline SVGs (via `@heroicons/react`). No external web fonts to download, saving critical bandwidth.
*   **States:**
    *   **Outline (24x24px, 1.5px stroke):** Used for default, unselected, or secondary states.
    *   **Solid (24x24px):** Used for active navigation tabs, selected states, and high-priority alerts to draw the eye.
*   **Accessibility:** All `<svg>` elements used decoratively must have `aria-hidden="true"`. Standalone icon buttons must have `<title>` tags and `aria-label` attributes.

### **1.5 Interaction Ergonomics**
*   **Touch Targets:** Minimum **48x48px** for mobile buttons. 8px minimum spacing between clickable elements.
*   **Destructive Actions:** No irreversible actions without explicit confirmation. SOS requires a **3-second long press** accompanied by severe haptic feedback (vibrations) to prevent accidental pocket-dials.

---

## **2. PWA, Offline & State Resilience Architecture**

The UI must never present a "Blank White Screen" or a generic browser "Dinosaur" offline page.

### **2.1 The App Shell (Cached UI)**
*   The header, bottom navigation bar, and empty map grid are cached via the PWA Service Worker. They load instantly regardless of network status.

### **2.2 Connection State UI**
*   **Online:** Invisible.
*   **Offline / Connection Lost:** A persistent, high-contrast, black banner appears at the very top of the screen:
    *   *UI Text:* `[Heroicon: ExclamationTriangle] Offline. Showing cached data from 10:42 AM.`
*   **Reconnecting:** Banner turns blue:
    *   *UI Text:* `[Heroicon: ArrowPath] Reconnecting...`
    *   *On Success:* Banner disappears instantly.

### **2.3 Offline Forms & "Store and Forward" UX**
If a user submits a report while offline:
*   **Immediate Feedback:** Form instantly clears.
*   **Toast Message:** `Report saved locally. Will transmit when signal is restored.`
*   **Outbox UI:** A small badge appears on the "Report" tab showing `[1 Pending]`.

### **2.4 Zero-Data & Empty States**
Never leave a screen empty.
*   *Empty Map/No Hazards:* Display a green card over the map: `[Heroicon: CheckCircle] No verified hazards in your 5km radius.`
*   *Empty Camp List:* `No resource camps deployed nearby. View survival guide.`

---

## **3. Citizen App (Mobile PWA) - Routes & Layout**

### **3.1 Global Layout**
*   **Top Header:** Reverse-geocoded location (e.g., `[Heroicon: MapPin] Pimpri-Chinchwad`). `[Heroicon: UserCircle]` for settings.
*   **Bottom Navigation Bar (Fixed):**
    *   `[Heroicon: Home]` Home
    *   `[Heroicon: Map]` Map
    *   `[Heroicon: PlusCircle]` Report
    *   `[Heroicon: BuildingStorefront]` Camps
    *   *(Active tabs use the Solid variant; inactive tabs use Outline)*
*   **Floating SOS Button:** Fixed above the bottom nav, right side. Red square button featuring `[Heroicon: Signal]`.

### **3.2 Screen: `/home` (Context-Aware Dashboard)**
*   **Safe State:** Shows large buttons for Preparedness Guides, Emergency Contacts, and Weather Forecast.
*   **Danger State (Hazard < 5km away):** The top 50% of the screen is replaced by a solid Red or Amber alert box.
    *   *Text:* `FLOOD WARNING - 1.2km away.`
    *   *Primary CTA:* `[View on Map]`, `[Find Safe Route]`.

### **3.3 Screen: `/map` (Live Vector Map)**
*   **UI Elements:** Muted gray map background. Danger zones are bright red polygons. Resource camps use high-contrast solid lucide-react (e.g., `BuildingOffice` for shelters).
*   **Interaction:** Tapping a hazard instantly snaps up a **Bottom-Sheet Drawer**.
*   **Drawer Component:**
    *   *Header:* Hazard Type & Distance.
    *   *Body:* Static image (if uploaded), verified timestamp, description.
    *   *Action:* `[Avoid Area]` or `[Report Update]`.

### **3.4 Screen: `/report` (Step-by-Step Wizard)**
Scrolling long forms causes cognitive overload. The report UI is a 3-step wizard.
*   **Step 1:** Grid of 6 massive square buttons using 48x48px Solid lucide-react: `[Fire]`, `[Water]`, `[BuildingOffice]`, etc.
*   **Step 2:** Exact location. Auto-fills via GPS. Shows map snippet. `[Confirm Location]`.
*   **Step 3:** Photo & Description. `[Heroicon: Camera]` button.
    *   *Edge-AI Validation:* If the client-side CNN rejects the image, show instant inline error: `Image does not match disaster criteria. Please retake or skip.`
*   **Submit:** Massive blue button. Instant transition to `/home` with success banner.

### **3.5 Screen: `/camps` (Resource Finder)**
*   **Layout:** List view of nearest camps sorted by distance.
*   **Cards:**
    *   *Title:* Camp Name (e.g., "City Hall Shelter").
    *   *Badges:* Type (`[Heroicon: Briefcase] Medical`), Status (Green `Fully Stocked` or Amber `Low Stock`).
    *   *Action:* `[Get Safe Route]`.

---

## **4. Authority / Admin App (Desktop) - Routes & Layout**

Authorities operate on wide screens and need dense information without clicking through menus.

### **4.1 Global Layout**
*   **Left Sidebar (Fixed, Dark):** Navigation links utilizing Outline lucide-react (`Command Center`, `Triage`, `Logistics`, `Broadcast`).
*   **Top Bar:** Current active personnel count, System Health (Redis/Postgres status), Global Search (`[Heroicon: MagnifyingGlass]`).

### **4.2 Screen: `/command-center` (The Master View)**
A strict split-screen layout.
*   **Left Pane (65% width):** Live Map.
    *   Displays anonymized citizen clusters, responder GPS tracking, and active SOS signals (solid red `[Heroicon: ExclamationCircle]`).
    *   *Filter toggles:* Checkboxes to show/hide specific hazard types.
*   **Right Pane (35% width):** Live Event Feed.
    *   Auto-updating list of incoming reports and system alerts.
    *   Clicking an event in the feed instantly centers the map on that coordinate.

### **4.3 Screen: `/triage` (Report Moderation)**
*   **Layout:** Dense data table.
*   **Columns:** Timestamp, Image Thumbnail, Type, AI-Confidence Score, Location, Actions.
*   **Interaction:**
    *   Row click expands an inline-panel (Accordion) showing full details.
    *   Actions: `[Heroicon: Check] Verify`, `[Heroicon: XMark] Reject`.
    *   Clicking `[Verify]` instantly changes row background to Green and removes it from the "Pending" view.

### **4.4 Screen: `/logistics` (Camp Management)**
*   **Layout:** Data grid of all deployed resource camps.
*   **Key Feature - Inline Editing:** Stock status is an inline dropdown. Changing "Food" from `Full` to `Empty` requires no "Save" button. The selection fires an API call instantly, updating the database and syncing to all citizen maps via SSE.

### **4.5 Screen: `/broadcast` (Geo-Fenced Alerts)**
*   **Layout:** Map on the left, Form on the right.
*   **Interaction Flow:**
    1.  Admin selects the `[Heroicon: Square3Stack3D]` Draw Polygon tool on the map.
    2.  Admin clicks points to encircle a neighborhood.
    3.  Form calculates: `Targeting approximately 4,200 devices.`
    4.  Admin types alert message.
    5.  Admin clicks `[SEND OVERRIDE ALERT]`.
    6.  *Safety Check:* A modal appears: `Are you sure? This will trigger emergency alarms on 4,200 devices. [YES / CANCEL]`.

---

## **5. Common Components & Interaction Rules**

### **5.1 Forms & Input Ergonomics**
*   **Labels:** Always visible above the input field. *Never* use placeholders as labels.
*   **Validation:** Inline and instant. Red borders and explicit text below the field accompanied by `[Heroicon: ExclamationCircle]` (e.g., `Description must be at least 10 characters`), not generic messages.
*   **Keyboard Accessibility:** Every action is reachable via the `Tab` key. Focus states have a thick `3px` solid blue outline.

### **5.2 Cards (Information Display)**
*   **Design:** White surface, `1px` solid gray border (`#E2E8F0`). No drop-shadows (improves rendering performance and visual flatness).
*   **Content Hierarchy:**
    *   Top-left: Status badge.
    *   Center: Title (large).
    *   Bottom: Meta-data (distance, time).
    *   Bottom-right: Primary Action button.

### **5.3 Buttons**
*   **Primary:** Solid background, white text. Used for the *one* main action on a screen.
*   **Secondary:** Transparent background, solid border, colored text. Used for alternatives ("Cancel", "Skip").
*   **Disabled State:** Gray background, gray text. Must clearly look unclickable. Do not use tooltips on disabled buttons (inaccessible to touch/mobile).

### **5.4 Feedback & Error States**
*   **Silent Failures are forbidden.**
*   If an API call fails (e.g., 500 server error):
    *   *Bad UX:* Screen does nothing.
    *   *ResQ UX:* Instant top-anchored red banner: `[Heroicon: XCircle] System error. Could not save camp status. Please retry.`
*   **Destructive Actions (Admin):** Deleting a camp or resolving an SOS requires typing the word "CONFIRM" in a prompt to prevent accidental data loss.

---

## **6. Accessibility (WCAG 2.1 AA Compliance)**

*   **Screen Readers (ARIA):**
    *   All map markers have visually hidden `aria-labels` (e.g., `<span class="sr-only">Fire hazard, 2 kilometers away</span>`).
    *   The live event feed uses `aria-live="polite"` so screen readers announce new reports automatically.
*   **Color Independence:** A user with monochrome color-blindness must be able to use the app. A danger zone is not just "red", it is shaded with a hash-pattern. A safe route is not just "green", it is a thick line with directional arrows.
*   **Zoom/Scaling:** The UI layout cannot break if the user has their OS font-size set to 200%. Containers must use flexible heights, wrapping text to new lines instead of truncating with ellipses `...` whenever possible.
