# Display App - User Stories

## Project Management

- As a display operator, I can create a new scoreboard with custom dimensions so that I can design for specific monitor sizes
- As a display operator, I can open an existing scoreboard file (.sfb) so that I can reuse previous designs
- As a display operator, I can see recent scoreboard files for quick access
- As a display operator, I can save my scoreboard and save-as with a new name
- As a display operator, I can manage multiple scoreboard tabs in a single window
- As a display operator, I can see when a scoreboard has unsaved changes

---

## Scoreboard Designer

### Canvas

- As a designer, I can add components to the canvas: text, image, background, and tennis-specific elements
- As a designer, I can position and resize components by dragging on the canvas
- As a designer, I can select single or multiple components for editing
- As a designer, I can zoom in/out and pan across the canvas
- As a designer, I can auto-fit the scoreboard to the canvas view
- As a designer, I can undo recent changes (up to 50 steps)
- As a designer, I can set the scoreboard background color
- As a designer, I can set the scoreboard dimensions to match target monitor resolutions

### Grid & Alignment

- As a designer, I can enable a grid overlay for precise alignment
- As a designer, I can adjust the grid size
- As a designer, I can enable snap-to-grid so components align automatically

---

## Component Styling

- As a designer, I can edit text content for static labels and information
- As a designer, I can customize font size, color, and horizontal alignment (left, center, right)
- As a designer, I can set background colors and borders on components
- As a designer, I can enable auto-fit text so large text scales to fit component bounds
- As a designer, I can lock components to prevent accidental moves
- As a designer, I can set z-index to control which components appear on top
- As a designer, I can show and hide components during design

---

## Tennis-Specific Components

- As a designer, I can add a player name component to display individual player names
- As a designer, I can add a doubles name component to display both partners' names
- As a designer, I can add a game score component to display current points (0, 15, 30, 40, AD)
- As a designer, I can add a set score component to display games won in a specific set
- As a designer, I can add a match score component to display total sets won
- As a designer, I can add a serving indicator to show which player is currently serving
- As a designer, I can configure which player (1 or 2) each tennis component displays
- As a designer, I can customize the serving indicator color and size
- As a designer, I can select which set number to display for set score components

---

## Asset Management

- As a designer, I can import images (PNG, JPEG) to use as logos, sponsors, or graphics
- As a designer, I can select previously imported images for components
- As a designer, I can use images as scoreboard backgrounds
- As a designer, I can delete unused images from the asset library
- As a designer, I can see image dimensions and original filenames
- As a designer, I can copy components between different scoreboards via a global clipboard

---

## File Export & Import

- As a designer, I can export a scoreboard as a bundle (.sfbz) including all assets so that I can share designs
- As a designer, I can import a scoreboard bundle (.sfbz) so that I can load shared designs with all images included

---

## Live Data Connection

- As a tournament organizer, I can connect the display app to my Convex backend by entering a deployment URL and API key
- As a tournament organizer, I can see the connection status to know if the app is receiving live data
- As a tournament organizer, I can select a tournament from the connected backend
- As a tournament organizer, I can select a bracket within a tournament
- As a tournament organizer, I can select a specific match to display on the scoreboard
- As a tournament organizer, I can filter brackets by participant type (singles/doubles)
- As a tournament organizer, I can see tennis match data update automatically from live scoring
- As a tournament organizer, I can disconnect from the backend to stop receiving updates

---

## Display Output

- As a tournament organizer, I can activate a separate display window to show the scoreboard on a different monitor
- As a tournament organizer, I can run the display window in fullscreen mode for venue visibility
- As a tournament organizer, I can position the display window on a specific monitor in a multi-monitor setup
- As a tournament organizer, I can set custom position offsets to fine-tune placement
- As a tournament organizer, I can see live match data update automatically in the display window
- As a tournament organizer, I can close the display window with the Escape key

---

## Monitor Support

- As a tournament organizer, I can detect available monitors connected to my system
- As a tournament organizer, I can view a list of monitors with their resolutions and positions
- As a tournament organizer, I can create scoreboards with dimensions matching specific monitor resolutions

---

## Preferences & Persistence

- As a display operator, I can have my settings (Convex credentials, preferences) persist between sessions
- As a display operator, I can access a settings dialog to configure credentials and options
- As a display operator, I can see toast notifications for save status, connection status, and errors
