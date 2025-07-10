import axios from 'axios';

const API_KEY = 'dc0479667cmshbda54742229f13cp1c2a67jsn3f2af203a328'; // Replace with your RapidAPI key
const HOST = 'booking-com15.p.rapidapi.com';

/**
 * Fetch hotels from Booking.com API
 * @param {string} destinationId - The destination ID from searchDestination endpoint
 * @param {string} checkinDate - Format: YYYY-MM-DD
 * @param {string} checkoutDate - Format: YYYY-MM-DD
 * @param {number} adults - Number of adults
 * @returns {Promise<Array>} - List of hotels
 */
export const searchHotels = async (destinationId, checkinDate, checkoutDate, adults = 2) => {
  const url = `https://${HOST}/api/v1/hotels/searchHotels`;

  try {
    const response = await axios.get(url, {
      params: {
        dest_id: destinationId,
        dest_type: 'city',
        checkin_date: checkinDate,
        checkout_date: checkoutDate,
        adults_number: adults,
        order_by: 'price',
        locale: 'en-gb',
        currency: 'INR',
      },
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': HOST,
      },
    });

    return response.data?.data || []; // Safely return hotel list
  } catch (error) {
    console.error('❌ Error fetching hotels:', error.message);
    return [];
  }
};
