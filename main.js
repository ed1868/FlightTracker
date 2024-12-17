const axios = require('axios');
const nodemailer = require('nodemailer');

// Configuration
const FROM_LOCATION = 'Bali (DPS)'; 
const TO_LOCATION = 'Miami (MIA)';
const DEPARTURE_DATE = 'January 4, 2025';  // Adjust as needed
const PRICE_THRESHOLD = 2000; 
const EMAIL_TO = 'your_email@example.com';
const SERPAPI_KEY = 'YOUR_SERPAPI_KEY'; // Your SerpApi key

// Create email transporter
// Make sure to use real credentials or a service like Gmail OAuth, Mailgun, etc.
let transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false, 
  auth: {
    user: "your_email_username",
    pass: "your_email_password"
  }
});

async function checkFlights() {
  try {
    // Build query for SerpApi: 
    // Reference: https://serpapi.com/google-flights-api
    // We'll search flights in a natural language manner.
    const query = `Flights from ${FROM_LOCATION} to ${TO_LOCATION} on ${DEPARTURE_DATE}`;

    const params = {
      engine: 'google_flights',
      q: query,
      api_key: SERPAPI_KEY,
    };

    const url = 'https://serpapi.com/search.json';

    const response = await axios.get(url, { params });
    const data = response.data;

    // flight_results structure may vary, check the SerpApi documentation for updates.
    const flights = data.flight_results || [];

    // Filter for flights under the threshold
    const cheapFlights = flights.filter(flight => {
      // flight.price may come formatted with currency symbols; parse it as needed
      // Example format: "$1,200"
      const priceStr = flight.price || "";
      const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
      return numericPrice && numericPrice < PRICE_THRESHOLD;
    });

    if (cheapFlights.length > 0) {
      console.log(`Found ${cheapFlights.length} flights under $${PRICE_THRESHOLD}. Sending email...`);
      await sendEmail(cheapFlights);
    } else {
      console.log(`No flights under $${PRICE_THRESHOLD} found at this time.`);
    }

  } catch (error) {
    console.error('Error checking flights:', error);
  }
}

async function sendEmail(flights) {
  let flightDetails = flights.map((f, i) => {
    const airline = f.airline || 'N/A';
    const departureTime = f.departure || 'N/A';
    const arrivalTime = f.arrival || 'N/A';
    const price = f.price || 'N/A';
    const duration = f.duration || 'N/A';
    const flightLink = f.link || 'N/A';

    return `Flight ${i+1}:
- Airline: ${airline}
- Departs: ${departureTime}
- Arrives: ${arrivalTime}
- Duration: ${duration}
- Price: ${price}
- More info: ${flightLink}
`;
  }).join('\n');

  const mailOptions = {
    from: '"Flight Tracker" <your_email@example.com>',
    to: EMAIL_TO,
    subject: `Cheap Flight Alert: ${FROM_LOCATION} to ${TO_LOCATION}`,
    text: `Yo,\n\nJust found some flights cheaper than $${PRICE_THRESHOLD} on ${DEPARTURE_DATE}:\n\n${flightDetails}\n\nSafe travels!`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}

// Run the check once when the script is invoked
checkFlights();
