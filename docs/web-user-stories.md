# Web App - User Stories

## Authentication & Onboarding

### Sign Up (`/sign-up`)

- As a new user, I can create an account with my email, first name, last name, and password (8+ characters) so that I can start managing tournaments
- As a new user, I can see that registration is disabled if a site admin has turned it off

### Sign In (`/sign-in`)

- As a returning user, I can sign in with my email and password so that I can access my tournaments
- As a user with incorrect credentials, I can see clear error messages distinguishing between invalid password, non-existent account, and rate limiting

### Landing Page (`/`)

- As a visitor, I can view the landing page with feature highlights so that I understand what ScoreForge offers
- As a signed-in user, I can navigate directly to the dashboard from the landing page

---

## Dashboard (`/dashboard`)

- As a tournament operator, I can view a dashboard showing all tournaments I own or am assigned to
- As an operator, I can see real-time stats: total tournaments, active tournaments, live matches, and draft tournaments
- As an operator, I can filter tournaments by status (All, Active, Draft, Completed)
- As an operator, I can search and sort tournaments in the tournament table
- As an operator, I can click "New Tournament" to begin creation (if within my creation limit)
- As a user who has hit the tournament limit, I can see a message indicating the maximum allowed

---

## Tournament Creation (`/tournaments/new`)

- As an organizer, I can create a tournament through a guided 5-step wizard (Basics, Rules, Format, Courts, Review)
- As an organizer, I can enter a tournament name, optional description, and bracket name in the Basics step
- As an organizer, I can configure tennis scoring rules (advantage/no-ad, best of 3/5) in the Rules step
- As an organizer, I can select a format (Single Elimination, Double Elimination, Round Robin) in the Format step
- As an organizer, I can select a participant type (Individual, Doubles, Team) in the Format step
- As an organizer, I can set maximum participants using presets (4, 8, 16, 32, 64) or a custom number
- As an organizer, I can add courts from presets (Stadium, Grandstand, Court 1-4) or enter custom names
- As an organizer, I can review all settings before confirming creation
- As an organizer, I can navigate between wizard steps and see which are complete

---

## Tournament Detail (`/tournaments/[id]`)

### Overview

- As a tournament user, I can view the tournament name, status, format, description, and start date
- As a tournament owner, I can copy the tournament ID to clipboard
- As a tournament owner, I can start, complete, or cancel a tournament
- As a tournament owner, I can download match scores as CSV
- As a tournament owner, I can download scoring logs as CSV (if enabled)

### Bracket Selector

- As a user, I can view and switch between all brackets in the tournament
- As a tournament owner, I can click "Manage Brackets" to add, edit, reorder, or delete brackets

### Bracket Tab (`?tab=bracket`)

- As a user, I can view the bracket visualization showing all matches in a tree structure
- As a user, I can see match participants, scores, status, and scheduled times
- As a tournament owner in draft, I can click "Generate Bracket" to auto-create matches from participants
- As a tournament owner in draft, I can generate a blank bracket with placeholder participants
- As a tournament owner, I can print the bracket for physical display

### Matches Tab (`?tab=matches`)

- As a user, I can view all matches sorted by status (Live, Scheduled, Pending, Completed, Bye)
- As a user, I can see match participants, score, court, and status badge
- As a user, I can click a match to navigate to its detail page
- As a tournament owner, I can create one-off (ad-hoc) matches with custom participants and optional court

### Participants Tab (`?tab=participants`)

- As a user, I can view all participants with their seed numbers
- As a tournament owner in draft, I can add participants manually or via CSV upload
- As a user, I can see both player names for doubles participants
- As a user, I can see an empty state prompting to add participants when none exist

### Standings Tab (`?tab=standings`, Round Robin only)

- As a user, I can view standings ranked by Wins, Losses, Draws, Points, and Point Differential
- As a user, I can see medal indicators (Gold, Silver, Bronze) for the top 3
- As a user, I can see standings update as matches complete

### Scorers Tab (`?tab=scorers`, Owner only)

- As a tournament owner, I can view the scorer code for temporary PIN-based access
- As a tournament owner, I can add account-based scorers by searching for users
- As a tournament owner, I can remove account-based scorers
- As a tournament owner, I can create temporary scorers with auto-generated PINs (24-hour sessions)
- As a tournament owner, I can view temporary scorers with their name, PIN, and active status
- As a tournament owner, I can reset, deactivate, reactivate, or delete temporary scorers

---

## Participant Addition (`/tournaments/[id]/participants/add`)

- As a tournament owner, I can add individual participants by name
- As a tournament owner, I can add doubles participants by entering both player names
- As a tournament owner, I can add team participants by team name
- As a tournament owner, I can bulk-import participants via CSV with flexible column headers
- As a tournament owner, I can select which bracket to add participants to
- As a tournament owner, I can preview CSV participants before confirming

---

## Match Detail (`/matches/[id]`)

- As a user, I can view match info: participants, status, court, round, and score
- As a user, I can see bye matches showing the participant who automatically advances
- As a scorer, I can select the first server to initialize a tennis match
- As a scorer, I can enter the full-screen scoring interface for live tennis matches
- As a scorer, I can score individual points (0, 15, 30, 40, deuce, advantage)
- As a scorer, I can undo the last scored point (up to 10 actions of history)
- As a scorer, I can see tiebreaks handled automatically at 6-6
- As a scorer, I can complete a match and see the winner with final score summary
- As a scorer, I can navigate to the next match from the completion screen

---

## Bracket Print (`/tournaments/[id]/bracket/print`)

- As a tournament owner, I can view a print-optimized bracket page
- As a tournament owner, I can select which bracket to print
- As a tournament owner, I can print using the browser's print function

---

## Quick Bracket (`/brackets/quick`)

- As any visitor, I can generate a printable bracket without an account
- As a user, I can select bracket size (4, 8, 16, 32, 64, or custom)
- As a user, I can select Single Elimination or Double Elimination format
- As a user, I can edit participant names by clicking on bracket slots
- As a user, I can print the bracket or reset to start over
- As a user, I can see rounds grouped with proper visual hierarchy

---

## Settings (`/settings`)

- As a user, I can update my display name
- As a user, I can view my email address (read-only)
- As a user, I can see my auto-generated avatar based on initials
- As a user, I can create, copy, and delete API keys for programmatic access
- As a user, I can delete my account with a confirmation requiring me to type "DELETE"
- As a user, I can sign out

---

## Site Administration (`/admin`)

### Users Tab

- As a site admin, I can view all platform users with search and pagination
- As a site admin, I can see user details: name, email, join date, tournament count
- As a site admin, I can delete users

### Admins Tab

- As a site admin, I can view all administrators
- As a site admin, I can grant or revoke admin privileges

### Settings Tab

- As a site admin, I can toggle public registration on/off
- As a site admin, I can set tournament creation limits per user
- As a site admin, I can enable/disable maintenance mode

---

## Cross-App Features

### Theme

- As a user, I can toggle between system, light, and dark themes (synced to my Convex preferences)

### Notifications

- As a user, I can see toast notifications for success, error, and informational events

### Confirmation Dialogs

- As a user, I see confirmation dialogs before destructive actions (delete, cancel, etc.)

### Responsive Design

- As a user, I can access all features on mobile, tablet, and desktop screen sizes
