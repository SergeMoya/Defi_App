import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

interface PriceData {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export const getPriceData = async (): Promise<PriceData> => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids: 'bitcoin,ethereum,ripple,cardano,polkadot', // Add more coins as needed
        vs_currencies: 'usd',
        include_24hr_change: 'true',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching price data:', error);
    return {};
  }
};