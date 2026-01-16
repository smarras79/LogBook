# ✈️ Flight Tracker

A modern, responsive web application for aviation enthusiasts to track and manage their flight history. Built with React and featuring persistent storage, automatic distance calculations, and beautiful visualizations.

![Flight Tracker](https://img.shields.io/badge/React-18.x-blue) ![Status](https://img.shields.io/badge/status-active-success)

## 📋 Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [Technical Details](#technical-details)
- [Airport Codes](#airport-codes)
- [Storage & Data](#storage--data)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## ✨ Features

### Core Functionality
- **Flight Logging** - Add, edit, and delete flight records
- **Automatic Distance Calculation** - Uses Haversine formula for accurate great-circle distances
- **Dual Unit Display** - Shows distances in both miles and kilometers
- **Service Class Tracking** - Track Economy, Premium Economy, Business, and First Class flights
- **Date Management** - Record and sort flights by date

### Statistics & Insights
- **Total Flights Counter** - Track your total number of flights
- **Miles Flown Calculator** - Real-time calculation of total distance traveled
- **Earth Circumference Metric** - See how many times you've flown around the Earth (24,901 miles)
- **Visual Dashboard** - Clean statistics cards with key metrics

### User Experience
- **Modern UI/UX** - Clean, minimalist design inspired by contemporary SaaS applications
- **Persistent Storage** - All data automatically saved and preserved across sessions
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations** - Polished transitions and micro-interactions
- **Airport Reference** - Built-in database of 35+ major international airports

## 🎥 Demo

The application features:
- A clean header with "Add Flight" button
- Three statistics cards showing Total Flights, Miles Flown, and Times Around Earth
- A list of flight cards with route visualization
- Modal form for adding/editing flights
- Airport codes reference section

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher) or **yarn** (v1.22.0 or higher)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## 🚀 Installation

### Step 1: Set Up Your Project

Create a new React application using Create React App:

```bash
npx create-react-app flight-tracker
cd flight-tracker
```

### Step 2: Install Dependencies

Install the required dependencies:

```bash
npm install lucide-react
```

**Dependencies:**
- `react` - Core React library (included with Create React App)
- `lucide-react` - Icon library for UI elements

### Step 3: Add the Flight Tracker Component

Replace the contents of `src/App.js` with the `flight-tracker.jsx` file:

```bash
# Copy the flight-tracker.jsx content to src/App.js
```

Or manually:
1. Open `src/App.js`
2. Delete all existing content
3. Copy the entire contents of `flight-tracker.jsx`
4. Paste into `src/App.js`
5. Save the file

### Step 4: Update Index Files (Optional)

For a cleaner setup, update `src/index.css` with minimal styling:

```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}
```

### Step 5: Start the Development Server

Launch the application:

```bash
npm start
```

The application will automatically open in your browser at `http://localhost:3000`

## 📖 Usage Guide

### Adding a Flight

1. Click the **"Add Flight"** button in the top-right corner
2. Fill in the required information:
   - **Origin Airport** - Enter the 3-letter IATA code (e.g., JFK)
   - **Destination Airport** - Enter the 3-letter IATA code (e.g., LAX)
   - **Flight Date** - Select the date you flew
   - **Class of Service** - Choose from Economy, Premium Economy, Business, or First
3. Click **"Add Flight"** to save

The application will automatically:
- Calculate the distance between airports using the Haversine formula
- Display the distance in both miles and kilometers
- Update your total statistics
- Sort the flight into chronological order

### Editing a Flight

1. Locate the flight card you want to edit
2. Click the **pencil icon** (Edit button) on the right side
3. Modify any fields in the modal form
4. Click **"Update Flight"** to save changes

### Deleting a Flight

1. Locate the flight card you want to delete
2. Click the **trash icon** (Delete button) on the right side
3. The flight will be immediately removed and statistics updated

### Understanding Your Statistics

**Total Flights**
- Shows the total number of flights you've logged
- Updates automatically as you add or remove flights

**Miles Flown**
- Displays total distance traveled in miles
- Shows converted value in kilometers below
- Calculated using great-circle distance (shortest path on Earth's surface)

**Times Around Earth**
- Shows how many Earth circumferences you've completed
- Based on Earth's circumference of 24,901 miles
- Fun metric to visualize your travel distance

### Viewing Flight Details

Each flight card displays:
- **Route** - Origin and destination airports with city names
- **Distance** - Miles and kilometers traveled
- **Service Class** - The cabin class you flew
- **Date** - When the flight occurred
- **Visual Route** - Simple arrow diagram showing direction

## 🔧 Technical Details

### Technology Stack

- **Frontend Framework:** React 18.x
- **Styling:** Custom CSS with Tailwind-inspired utility classes
- **Icons:** Lucide React
- **Storage:** Browser's localStorage API (via window.storage wrapper)
- **Font:** Inter (Google Fonts)

### Distance Calculation

The application uses the **Haversine formula** to calculate great-circle distances between airports:

```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
```

This formula calculates the shortest distance over the Earth's surface, accounting for its spherical shape.

### Data Structure

Each flight is stored as an object with the following structure:

```javascript
{
  id: 1234567890,                    // Unique timestamp ID
  origin: "JFK",                      // Origin airport code
  destination: "LAX",                 // Destination airport code
  date: "2024-01-15",                // Flight date (ISO format)
  serviceClass: "Economy",           // Service class
  distanceMiles: 2475,               // Calculated distance in miles
  distanceKm: 3983,                  // Calculated distance in kilometers
  originAirport: {                   // Origin airport details
    name: "John F. Kennedy International",
    city: "New York",
    lat: 40.6413,
    lon: -73.7781
  },
  destAirport: {                     // Destination airport details
    name: "Los Angeles International",
    city: "Los Angeles",
    lat: 33.9416,
    lon: -118.4085
  },
  timestamp: 1234567890              // Creation timestamp
}
```

## ✈️ Airport Codes

The application includes 35 major international airports. Use these 3-letter IATA codes when logging flights:

### North America
- **JFK** - New York, John F. Kennedy International
- **LAX** - Los Angeles International
- **ORD** - Chicago, O'Hare International
- **SFO** - San Francisco International
- **MIA** - Miami International
- **ATL** - Atlanta, Hartsfield-Jackson
- **DEN** - Denver International
- **SEA** - Seattle-Tacoma International
- **BOS** - Boston Logan International
- **IAD** - Washington Dulles International
- **MCO** - Orlando International
- **LAS** - Las Vegas McCarran International
- **PHX** - Phoenix Sky Harbor International
- **YYZ** - Toronto Pearson International
- **YVR** - Vancouver International

### Europe
- **LHR** - London Heathrow
- **CDG** - Paris, Charles de Gaulle
- **FRA** - Frankfurt Airport
- **AMS** - Amsterdam Schiphol
- **MAD** - Madrid Barajas
- **FCO** - Rome Fiumicino
- **IST** - Istanbul Airport

### Asia & Middle East
- **DXB** - Dubai International
- **HND** - Tokyo Haneda
- **SIN** - Singapore Changi
- **ICN** - Seoul Incheon
- **PEK** - Beijing Capital
- **PVG** - Shanghai Pudong
- **HKG** - Hong Kong International
- **BKK** - Bangkok Suvarnabhumi
- **DEL** - Delhi, Indira Gandhi
- **DOH** - Doha, Hamad International

### Other Regions
- **SYD** - Sydney, Kingsford Smith
- **MEL** - Melbourne Airport
- **GRU** - São Paulo Guarulhos
- **EZE** - Buenos Aires Ezeiza

### Adding Custom Airports

To add more airports, edit the `airports` object in the source code:

```javascript
const airports = {
  'ABC': { 
    name: 'Airport Full Name', 
    city: 'City Name', 
    lat: 12.3456,    // Latitude
    lon: -78.9012    // Longitude
  },
  // ... add more airports
};
```

## 💾 Storage & Data

### How Data is Stored

- **Storage Method:** Browser's localStorage via window.storage API
- **Storage Key:** `flights-data`
- **Data Format:** JSON string containing array of flight objects
- **Automatic Saving:** All changes are immediately persisted

### Data Persistence

✅ Your data will persist:
- Between page refreshes
- After closing and reopening the browser
- Across browser sessions

❌ Your data will be lost if:
- You clear browser cache/storage
- You use browser's "Clear Data" function
- You switch to a different browser
- You use Incognito/Private browsing mode

### Exporting Your Data

To backup your flight data:

1. Open browser Developer Tools (F12)
2. Go to the "Console" tab
3. Run this command:
   ```javascript
   copy(localStorage.getItem('flights-data'))
   ```
4. Paste the copied data into a text file and save it

### Importing Data

To restore your flight data:

1. Open browser Developer Tools (F12)
2. Go to the "Console" tab
3. Run this command (replace `YOUR_DATA_HERE` with your backup):
   ```javascript
   localStorage.setItem('flights-data', 'YOUR_DATA_HERE')
   ```
4. Refresh the page

## 🐛 Troubleshooting

### "Invalid airport codes" Error

**Problem:** Getting an error when adding a flight.

**Solutions:**
- Ensure you're using supported 3-letter airport codes (see Airport Codes section)
- Check that codes are exactly 3 letters
- Verify codes match the provided airport list
- Codes are case-insensitive (JFK = jfk = Jfk)

### Flights Not Saving

**Problem:** Flights disappear after refresh.

**Solutions:**
- Check if browser's localStorage is enabled
- Verify you're not in Incognito/Private browsing mode
- Check browser storage settings allow localStorage
- Try a different browser
- Check browser console (F12) for error messages

### Distance Calculation Seems Wrong

**Problem:** Distance doesn't match expected value.

**Explanation:**
- The app calculates **great-circle distance** (shortest path over Earth's surface)
- This differs from actual flight paths (which avoid restricted airspace, follow jet streams, etc.)
- Great-circle distance is the theoretical minimum, actual flights are typically 5-15% longer

### UI Not Displaying Correctly

**Problem:** Layout is broken or elements overlap.

**Solutions:**
- Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
- Ensure you're using a modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- Check browser zoom level (should be 100%)
- Try a different browser
- Verify all CSS is loading (check Network tab in DevTools)

### Application Won't Start

**Problem:** `npm start` fails or shows errors.

**Solutions:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force

# Try using yarn instead
npm install -g yarn
yarn install
yarn start
```

## 🏗️ Building for Production

To create an optimized production build:

```bash
npm run build
```

This creates a `build` folder with static files ready for deployment.

### Deployment Options

**Vercel** (Recommended)
```bash
npm install -g vercel
vercel
```

**Netlify**
```bash
npm run build
# Drag and drop the 'build' folder to netlify.com
```

**GitHub Pages**
```bash
npm install --save-dev gh-pages

# Add to package.json:
"homepage": "https://yourusername.github.io/flight-tracker",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}

# Deploy
npm run deploy
```

## 🔮 Future Enhancements

Potential features for future versions:

- [ ] Visual map integration (Google Maps / Mapbox)
- [ ] Export to CSV/Excel
- [ ] Flight statistics charts and graphs
- [ ] Airline tracking
- [ ] Flight number logging
- [ ] Aircraft type tracking
- [ ] Seat number/preferences
- [ ] Multi-user support with authentication
- [ ] Cloud sync across devices
- [ ] Mobile app versions
- [ ] Photo uploads for each flight
- [ ] Airport lounges visited
- [ ] Loyalty program integration

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs** - Open an issue describing the problem
2. **Suggest Features** - Share ideas for improvements
3. **Add Airports** - Submit pull requests with additional airport codes
4. **Improve Documentation** - Help make instructions clearer
5. **Fix Issues** - Submit pull requests with bug fixes

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

If you encounter issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [Usage Guide](#usage-guide)
3. Search existing issues on GitHub
4. Open a new issue with detailed information

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- Airport coordinate data from various public sources
- Inspired by aviation tracking applications

---

**Happy Flying! ✈️**

*Built with ❤️ for aviation enthusiasts*
