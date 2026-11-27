import { useCallback, useEffect, useState } from 'react';
import { DEMO_WEATHER } from '../lib/defaults';
import { fetchWeather } from '../lib/weather';
import type { WeatherData } from '../types';

const WEATHER_REFRESH_MS = 15 * 60 * 1000;

export function useWeather(city: string) {
  const [weather, setWeather] = useState<WeatherData>(() => ({
    ...DEMO_WEATHER,
    city: city || '广州',
  }));
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async (force: boolean) => {
      setLoading(true);
      const data = await fetchWeather(city, { force, signal: controller.signal });
      if (active && !controller.signal.aborted) {
        setWeather(data);
        setLoading(false);
      }
    };

    void load(nonce > 0);
    const timer = window.setInterval(() => {
      void load(true);
    }, WEATHER_REFRESH_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [city, nonce]);

  return { weather, loading, refresh };
}
