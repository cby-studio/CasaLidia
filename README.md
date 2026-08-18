# Casa Lidia Room Availability

A small static web app for managing availability across 7 bed and breakfast rooms.

## Features

- Monthly and weekly availability calendars
- English and Romanian language switch
- Passcode access screen for casual privacy
- Mobile-friendly layout with a minimizable reservation panel
- Seven fixed rooms
- Single-day and multi-day bookings
- Tourist details: name, phone number, number of people, and notes
- Red unavailable cells for occupied room dates
- Click an available date to create a booking
- Click an occupied date or upcoming booking to edit it
- Browser local storage persistence

## Run

Open `index.html` in a browser.

No build step or dependencies are required.

This is a static app, so the access screen is intended for casual privacy. For strong protection on a public website, use server-side authentication.

## Files

- `index.html` - app markup
- `styles.css` - layout and visual design
- `script.js` - booking, calendar, and local storage logic
