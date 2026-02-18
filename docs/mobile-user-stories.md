# Mobile App - User Stories

## Authentication

### Account Login

- As a returning user, I can sign in with my email and password so that I can access my tournaments (account creation is web-only)
- As a user, I can see clear error messages for invalid credentials, non-existent accounts, or rate limiting
- As a user, I can switch between "Account Login" and "Scorer Login" modes

### Temporary Scorer Login

- As a temporary scorer, I can sign in with a 6-character tournament code (auto-formatted to uppercase), my username, and 4-6 digit PIN
- As a temporary scorer, I can see the tournament name appear when the code is validated
- As a temporary scorer, I can see validation errors if the code or credentials are incorrect

---

## Dashboard (Authenticated Users)

- As a user, I can see a welcome message with my first name
- As a user, I can see a count of my active tournaments and a live match count badge
- As a user, I can view tournaments as cards with name, status, and stats
- As a user, I can tap a tournament to view its match list
- As a user, I can pull-to-refresh for real-time updates
- As a user, I can see a message with a link to settings if I have no active tournaments

---

## Tournament Match List

- As a scorer, I can view all matches in a tournament with a status filter (All, Live, Scheduled, Pending, Completed)
- As a scorer, I can see a tournament info card with status, format, and participant count
- As a scorer, I can see match cards with round, match number, court, status badge, and participant names
- As a scorer, I can see live matches with current score and a pulsing live indicator
- As a scorer, I can see completed matches with final scores
- As a scorer, I can tap a match to navigate to its detail view
- As a scorer, I can pull-to-refresh for real-time updates

---

## Match Detail View

- As a scorer, I can view match info: participants, score, court, round, scheduled/started/completed times
- As a scorer, I can see the winner highlighted after match completion
- As a scorer, I can see a detailed tennis score breakdown (sets, games, points)
- As a scorer, I can tap "Start Scoring" or "Continue Scoring" to enter the scoring interface
- As a scorer, I can see a disabled message if the tournament is not active

---

## Tennis Match Scoring

### First Server Setup

- As a scorer, I can select which player serves first before starting the match
- As a scorer, I can see a "Who serves first?" prompt with a button for each player

### Portrait Scoring

- As a scorer, I can score points by tapping large two-zone areas (Player 1 top, Player 2 bottom)
- As a scorer, I can see the central scoreboard with current game points, games in set, and set history
- As a scorer, I can see a serving indicator dot above the current server's points

### Landscape Scoring

- As a scorer, I can score points using left/right tap zones optimized for horizontal orientation
- As a scorer, I can see a centered floating scoreboard over both zones

### Score Display

- As a scorer, I can see current game points (0, 15, 30, 40, AD, Deuce)
- As a scorer, I can see games in the current set and complete set history
- As a scorer, I can see tiebreak indicators with mode label (regular or match tiebreak)
- As a scorer, I can see game status messages: "Deuce", "Advantage [Player]", "Deciding Point"

### Feedback

- As a scorer, I can feel haptic feedback (medium impact) when scoring a point
- As a scorer, I can see a flash animation on the tapped zone for visual confirmation
- As a scorer, I can feel a warning haptic on match point with a confirmation dialog before the final point

### Undo

- As a scorer, I can undo the last scored point (up to 10 actions of history)
- As a scorer, I can see the undo button disabled when no history is available

### Match Completion

- As a scorer, I can see a completion screen with the winner's name and final set-by-set score
- As a scorer, I can tap "Back to Match" to return to the match detail view

### Screen Behavior

- As a scorer, the screen stays awake during scoring so the display doesn't turn off mid-match

---

## Temporary Scorer Dashboard

- As a temporary scorer, I can see a "TEMP SCORER" badge, my assigned name, and the tournament name
- As a temporary scorer, I can filter matches by status (All, Live, Scheduled, Pending, Completed)
- As a temporary scorer, I can see a session expiry warning when less than 2 hours remain
- As a temporary scorer, I can receive an alert if my session expires or access is revoked
- As a temporary scorer, I can end my session early with a confirmation dialog

---

## Quick Bracket Generator

### Configuration

- As a user, I can set a bracket title (default: "Tournament Bracket")
- As a user, I can select a bracket size (4, 8, 16, 32, 64)
- As a user, I can select Single Elimination or Double Elimination format
- As a user, I can tap "Generate bracket" to build the structure

### Editing

- As a user, I can tap participant slots to edit names via a modal
- As a user, I can see seeds displayed in small circles next to participant names
- As a user, I can see "TBD" for unassigned slots
- As a user, I can see Winners rounds, Losers rounds, and Grand Final for double elimination

### Reset

- As a user, I can tap "Start Over" to reset and reconfigure the bracket

---

## Settings & Profile

### Profile

- As a user, I can update my display name
- As a user, I can see my email (read-only) and verification status
- As a user, I can see my auto-generated avatar from my initials
- As a user, I can see my "Member since" date

### Theme

- As a user, I can choose between System, Light, and Dark themes
- As a user, I can see my selection highlighted and applied immediately
- As a user, I can also toggle the theme from the navigation menu

### Account Actions

- As a user, I can sign out with a confirmation dialog
- As a user, I can permanently delete my account with a confirmation dialog

---

## Admin Panel (Site Admins Only)

- As a site admin, I can access the admin panel from the navigation menu
- As a site admin, I can view recent users with name, email, admin badge, tournament count, and logging status
- As a site admin, I can view all site admins with grant dates
- As a site admin, I can view system settings: max tournaments per user, registration status, maintenance mode

---

## Navigation

- As a user, I can open a slide-out navigation drawer from the header hamburger icon
- As a user, I can navigate to Dashboard, Quick Bracket, Settings, and Admin (if admin)
- As a user, I can see my name and email in the navigation drawer
- As a user, I can toggle the theme from the navigation drawer
- As a user, I can see the current screen highlighted in the menu

---

## Offline & Real-Time

- As a user, I can see an offline banner when network is unavailable
- As a user, I can see live score updates without manually refreshing (Convex real-time subscriptions)
- As a user, I can pull-to-refresh on match lists and dashboards

---

## Orientation Support

- As a user, I can use the app in both portrait and landscape orientations
- As a scorer, I can see optimized scoring layouts for each orientation
- As a user, safe areas (notch, home indicator) are respected in all orientations

---

## Session & Security

- As a user, my auth session persists across app restarts
- As a temporary scorer, my session token is stored in encrypted SecureStore
- As a temporary scorer, expired sessions automatically redirect to sign-in
