# Convex Backend - User Stories

## Authentication & User Management

### Auth

- As a new user, I can sign up with email and password
- As a registered user, I can sign in with email and password
- As an authenticated user, I can view my profile information (name, email, creation time)
- As an authenticated user, I can update my profile (name and avatar)
- As an authenticated user, I can delete my account and all associated data

### User Preferences

- As an authenticated user, I can set my theme preference (light, dark, system)
- As an authenticated user, I can retrieve my saved theme preference to sync across devices
- As an authenticated user, I can check my onboarding state

---

## Tournament Management

### Tournament Lifecycle

- As a tournament organizer, I can create a tournament with name, description, format, participant type, and tennis configuration
- As a tournament organizer, I can specify tennis settings (advantage scoring, sets to win, tiebreak rules)
- As a tournament organizer, I can set available courts for match scheduling
- As a tournament organizer, I can view all my tournaments (owned and scored) filtered by status
- As a tournament organizer, I can check if I've reached my tournament creation limit
- As a tournament organizer, I can update tournament details while in draft mode
- As a tournament organizer, I can delete a draft tournament and all associated data
- As a tournament organizer, I can cancel an active tournament (preserves audit trail)
- As a tournament organizer, I can start a tournament, activating it and generating initial bracket matches
- As a tournament organizer, I can view round-robin standings

### Multi-Tournament Brackets

- As a tournament organizer, I can create multiple brackets within a tournament (e.g., Men's Singles, Women's Doubles)
- As a tournament organizer, I can assign different format/config overrides per bracket
- As a tournament organizer, I can reorder brackets by display priority
- As a tournament organizer, I can update bracket details in draft status
- As a tournament organizer, I can delete empty draft brackets (but not the last one)
- As a tournament organizer, I can start individual brackets within an active tournament
- As a tournament organizer, I can generate matches for a specific bracket

---

## Bracket & Match Generation

### Bracket Generation

- As a tournament organizer, I can generate a bracket from participants using the configured format
- As a tournament organizer, I can regenerate a bracket while in draft mode
- As a tournament organizer, I can generate a blank bracket with placeholder participants (sizes: 2, 4, 8, 16, 32, 64, 128)
- As a tournament organizer, I can assign existing participants to specific seeds in a blank bracket
- As a tournament organizer, I can retrieve the full bracket structure with all matches and participants

### Bracket Formats

- As a tournament organizer using single elimination, winners advance to the next round
- As a tournament organizer using double elimination, winners advance to the winners bracket and losers to the losers bracket
- As a tournament organizer using round robin, every participant plays every other participant
- As the system, bye matches are automatically completed when only one participant feeds into a match

---

## Participants & Seeding

### Participant Management

- As a tournament organizer, I can add individual participants with a player name
- As a tournament organizer, I can add doubles participants with two player names
- As a tournament organizer, I can add team participants with a team name
- As a tournament organizer, I can view all participants with their stats (wins, losses, points)
- As a tournament organizer, I can update participant details before the tournament starts
- As a tournament organizer, I can remove participants before the tournament starts
- As a tournament organizer, I can get details for a specific participant

### Seeding & Placeholders

- As a tournament organizer, I can assign seed positions to participants for bracket placement
- As a tournament organizer, I can batch-update multiple participants' seeds at once
- As a tournament organizer, I can use placeholder participants in blank brackets
- As a tournament organizer, I can replace placeholder names with actual participant info

---

## Match Management

### Match Operations

- As a scorer, I can view all matches in a tournament filtered by status, round, court, or bracket
- As a scorer, I can view details for a specific match including participants and scores
- As a scorer, I can retrieve live matches across tournaments I own or score
- As a scorer, I can schedule a match with date/time and court assignment
- As a scorer, I can update a match's court assignment
- As a scorer, I can start a match (pending to live)
- As a scorer, I can update match scores
- As a tournament organizer, I can create one-off matches with ad-hoc participant names outside the bracket
- As a scorer, I can complete a match with a winner determination

### Match Progression

- As the system, winners advance to the next match in elimination brackets
- As the system, losers advance to the losers bracket in double elimination
- As the system, bye matches are auto-completed when only one participant is assigned
- As the system, tournaments are auto-completed when all matches finish

---

## Tennis-Specific Scoring

### Scoring

- As a scorer, I can initialize a tennis match with serve assignment and match configuration
- As a scorer, I can record points scored in a match
- As a scorer, I can track sets, games, and points according to tennis rules
- As a scorer, I can handle advantage scoring and deuce situations
- As a scorer, I can handle set tiebreaks and match tiebreaks
- As a scorer, I can undo the last scoring action to correct mistakes
- As a scorer, I can change server assignment
- As a scorer, I can view complete tennis state including all sets, games, and points
- As a scorer, I can access tennis state history (last 10 snapshots)

### Configuration

- As a tournament organizer, I can configure advantage or no-ad scoring mode
- As a tournament organizer, I can set best-of-3 or best-of-5 match format
- As a tournament organizer, I can configure tiebreak target points (7 or 10)
- As a tournament organizer, I can enable/disable match tiebreaks as a deciding set alternative

---

## Scorer Assignment

### Regular Scorers

- As a tournament organizer, I can assign scorers by email or user ID
- As a tournament organizer, I can view all scorers assigned to my tournament
- As a tournament organizer, I can remove a scorer from a tournament
- As a scorer, I can check if I'm assigned to a specific tournament
- As a scorer, I can access assigned tournaments and view all their matches

### Temporary Scorers (PIN-based)

- As a tournament organizer, I can generate a tournament-wide scorer code for temporary access
- As a temporary scorer, I can log in with a tournament code and PIN
- As a temporary scorer, I can score matches during a 24-hour session
- As the system, I enforce brute-force protection with rate limiting on login attempts
- As the system, I auto-deactivate all temporary scorers when a tournament completes

---

## API Key Management

- As an authenticated user, I can generate API keys for the public API (max 10 active)
- As an authenticated user, I can view my active API keys (prefix only)
- As an authenticated user, I can revoke an API key to immediately disable it
- As an authenticated user, I can rotate an API key (invalidate old, generate new)
- As an authenticated user, I can delete an API key permanently
- As an API consumer, I am rate-limited to 100 requests per minute per key
- As an API consumer, I can see rate limit info in response headers

---

## Public API (HTTP Endpoints)

- As an external system with a valid API key, I can fetch a single match by ID (`GET /api/public/match`)
- As an external system with a valid API key, I can list matches with filters (`GET /api/public/matches`)
- As an external system with a valid API key, I can list tournaments (`GET /api/public/tournaments`)
- As an external system with a valid API key, I can list brackets (`GET /api/public/brackets`)
- As the display app, I can subscribe to real-time match updates via `watchMatch` query
- As an external system, I can make CORS-enabled cross-origin requests

---

## Reporting & Exports

- As a tournament organizer, I can generate CSV exports of completed tennis match scores
- As a tournament organizer, I can filter match exports by bracket
- As a tournament organizer, I can check if a tournament has completed matches available for export
- As a tournament organizer, the CSV includes court, players, winner, set scores, and timestamps

---

## Site Administration

### Admin Management

- As a site admin, I can view all site administrators and who granted their access
- As a site admin, I can grant or revoke admin privileges (cannot revoke self or last admin)
- As the system, I can initialize the first site admin (one-time setup)

### User Management

- As a site admin, I can search users by name or email with pagination
- As a site admin, I can view user details including tournament count and admin status
- As a site admin, I can update a user's name
- As a site admin, I can enable/disable scoring logs for specific users

### System Settings

- As a site admin, I can configure maximum tournaments per user (default 50, unlimited for admins)
- As a site admin, I can enable/disable public registration
- As a site admin, I can enable/disable maintenance mode with a custom message
- As any user, I can check public system settings (maintenance status, registration allowed)

---

## Scheduled Jobs (Crons)

- As the system, I run hourly cleanup to remove expired temporary scorer sessions (24-hour expiry)
- As the system, I run hourly cleanup to remove expired rate limit records (15-minute windows)

---

## Data Integrity & Access Control

### Validation

- As the system, I validate all input lengths to prevent data corruption
- As the system, I prevent tournaments from starting without at least 2 participants
- As the system, I prevent bracket deletion if not empty or not the last bracket
- As the system, I prevent score updates on completed matches
- As the system, I prevent participant/seeding changes after tournament starts

### Access Control

- As the system, only tournament owners can manage tournament settings
- As the system, scorers can only view and score matches
- As the system, temporary scorers can only access their assigned tournament
- As the system, site admins can access all user management features
- As the system, I verify authorization for every operation

### Concurrency

- As the system, I use bracket version counters to prevent race conditions during generation
- As the system, failed concurrent bracket generations trigger automatic retries
