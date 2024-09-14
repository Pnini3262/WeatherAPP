import axios from 'axios';
import dotenv from 'dotenv'
dotenv.config();

const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};
const roundToNearestHour = (timeString) => {
    // Parse the input time string
    const [hours, minutes] = timeString.split(':').map(Number);

    // Determine if we should round up or down
    if (minutes >= 30) {
        // Round up to the next hour
        return `${(hours + 1) % 24}:00`;
    } else {
        // Round down to the current hour
        return `${hours.toString().padStart(2, '0')}:00`;
    }
};
function getHourFromTime(timeString) {
    // Split the time string by ':' and get the hour part
    const [hours] = timeString.split(':').map(Number);
    return hours;
}

const getTemperatures = (forecastData, cityTime) => {
    const temperatures = [];
    const currentHour =getHourFromTime(cityTime)    
    // Define the target hours for the 5-hour range
    const targetHours = [
        currentHour - 3,
        currentHour - 2,
        currentHour - 1,
        currentHour,
        currentHour + 1
    ];
    
    // Adjust for the range if it's below 0 or above 23
    const adjustedHours = targetHours.map(hour => {
        if (hour < 0) return hour + 24;
        if (hour > 23) return hour - 24;
        return hour;
    });

    forecastData.forEach(hourData => {
        const hourTime = new Date(hourData.time);
        const hour = hourTime.getHours();        
        if (adjustedHours.includes(hour)) {
            temperatures.push({
                time: formatHour(hourData.time),
                temperature: Math.round(hourData.temp_c) // Round temperature
            });
        }
    });
    return temperatures;
};

// Helper function to format hour as HH:00
function formatHour(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    return `${hours}:00`;
}


export const getWeather = async (req, res) => { 
    const city = req.query.city;
    // console.log('API Key:', process.env.API_KEY);
    // console.log('city:', city);
    if (!city) {
        return res.status(400).json({ message: 'City query parameter is required, try again to enter city' });
    }

    try {
        const apiKey = process.env.API_KEY;

        const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&hours=24`; 

        const response = await axios.get(url);

        if (response.status === 200) {
            const data = response.data;
             console.log('Response data:', response.data);

            const weatherData = response.data.forecast.forecastday[0].hour;
            // console.log("weatherData",weatherData);

            const date = new Date();
            console.log("date", date);
            
            const weatherDataObj = {
                city: data.location.name,
                country: data.location.country,
                formattedDate: formatDate(data.location.localtime.split(" ")[0]),
                roundhour: roundToNearestHour(data.location.localtime.split(" ")[1]),
                hour:(data.location.localtime.split(" ")[1]),
                temperature: `${Math.round(data.current.feelslike_c)}°`,
                condition: data.current.condition.text,
                humidity: `${data.current.humidity}%`,
                precip_mm: `${data.current.precip_mm} mm`,
                windchill_c: `${data.current.windchill_c} km/h`,
                temperatures: getTemperatures(weatherData,(data.location.localtime.split(" ")[1]) ), // Array of temperatures for the specified hours
                latitude: data.location.lat,
                longitude: data.location.lon
            };

            console.log("weatherDataObj", weatherDataObj);
            res.json(weatherDataObj); // Return the weather data as JSON response
        }

    } catch (error) {
        console.error('Error fetching weather data:', error);
    
        // Check for specific error response from API if available
        if (error.response) {
          // Handle known error status codes from the API
          const status = error.response.status;
          if (status === 400) {
            return res.status(400).json({ message: 'Bad request. Please check the query parameters.' });
          } else if (status === 403) {
            return res.status(403).json({ message: 'Forbidden. Check your API key and permissions.' });
          } else if (status === 404) {
            return res.status(404).json({ message: 'City not found. Please try again.' });
          }
        }
    
        // General error handler
        return res.status(500).json({ message: 'Failed to fetch weather data' });
      }
};
