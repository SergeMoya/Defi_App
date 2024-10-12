import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
}

export interface PriceData {
  [key: string]: {
    id: string;
    name: string;
    symbol: string;
    usd: number;
    usd_24h_change: number;
    image: string;
    rank: number;
  };
}

export const getTopCoins = async (count: number = 10): Promise<CoinData[]> => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: count,
        page: 1,
        sparkline: false,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    return [];
  }
};

export const getPriceData = async (): Promise<PriceData> => {
  try {
    const topCoins = await getTopCoins(20);
    const priceData: PriceData = {};

    topCoins.forEach((coin) => {
      priceData[coin.symbol.toLowerCase()] = {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        usd: coin.current_price,
        usd_24h_change: coin.price_change_percentage_24h,
        image: coin.image,
        rank: coin.market_cap_rank,
      };
    });

    return priceData;
  } catch (error) {
    console.error('Error fetching price data:', error);
    return {};
  }
};