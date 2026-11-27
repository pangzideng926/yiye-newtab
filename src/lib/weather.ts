import type { WeatherData, WeatherDay } from '../types';
import { DEMO_WEATHER } from './defaults';

const CITY_COORDS: Record<string, { name: string; lat: number; lon: number }> = {
  广州: { name: '广州', lat: 23.1291, lon: 113.2644 },
  北京: { name: '北京', lat: 39.9042, lon: 116.4074 },
  上海: { name: '上海', lat: 31.2304, lon: 121.4737 },
  深圳: { name: '深圳', lat: 22.5431, lon: 114.0579 },
  杭州: { name: '杭州', lat: 30.2741, lon: 120.1551 },
  成都: { name: '成都', lat: 30.5728, lon: 104.0668 },
  武汉: { name: '武汉', lat: 30.5928, lon: 114.3055 },
  南京: { name: '南京', lat: 32.0603, lon: 118.7969 },
  重庆: { name: '重庆', lat: 29.563, lon: 106.5516 },
  西安: { name: '西安', lat: 34.3416, lon: 108.9398 },
  苏州: { name: '苏州', lat: 31.2989, lon: 120.5853 },
  天津: { name: '天津', lat: 39.0842, lon: 117.201 },
  长沙: { name: '长沙', lat: 28.2282, lon: 112.9388 },
  厦门: { name: '厦门', lat: 24.4798, lon: 118.0894 },
  香港: { name: '香港', lat: 22.3193, lon: 114.1694 },
  台北: { name: '台北', lat: 25.033, lon: 121.5654 },
};

const WEATHER_CACHE = new Map<string, { at: number; data: WeatherData }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export function clearWeatherCache() {
  WEATHER_CACHE.clear();
}

export function mapWmoCode(code: number): string {
  if (code === 0) return '晴';
  if (code === 1 || code === 2) return '多云';
  if (code === 3) return '阴';
  if (code === 45 || code === 48) return '雾';
  if (code >= 51 && code <= 57) return '毛毛雨';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return '雨';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '雪';
  if (code >= 95) return '雷暴';
  return '多云';
}

function formatDayLabel(iso: string, index: number): string {
  if (index === 0) return '今天';
  if (index === 1) return '明天';
  const d = new Date(`${iso}T00:00:00`);
  const wk = '日一二三四五六'[d.getDay()];
  return `周${wk}`;
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 8000, signal?: AbortSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

async function resolveCityCoords(
  cityName: string,
  signal?: AbortSignal,
): Promise<{ name: string; lat: number; lon: number }> {
  const normalized = cityName.trim() || '广州';
  const builtin = CITY_COORDS[normalized];
  if (builtin) return builtin;

  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    normalized,
  )}&count=1&language=zh&format=json`;
  const geo = (await fetchJsonWithTimeout(geoUrl, 8000, signal)) as {
    results?: Array<{ name?: string; latitude?: number; longitude?: number }>;
  };
  const first = geo.results?.[0];
  if (first && typeof first.latitude === 'number' && typeof first.longitude === 'number') {
    return {
      name: first.name || normalized,
      lat: first.latitude,
      lon: first.longitude,
    };
  }
  throw new Error('未找到该城市');
}

/** 通过免 Key 的 Open-Meteo 获取实时天气与五日预报；失败时回退示例数据并提示友好信息 */
export async function fetchWeather(
  city = '广州',
  options: { force?: boolean; signal?: AbortSignal } = {},
): Promise<WeatherData> {
  const key = city.trim() || '广州';
  if (!options.force) {
    const cached = WEATHER_CACHE.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const coords = await resolveCityCoords(key, options.signal);
    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

    const raw = (await fetchJsonWithTimeout(forecastUrl, 8000, options.signal)) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
      daily?: {
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
      };
    };

    if (!raw.current || typeof raw.current.temperature_2m !== 'number') {
      throw new Error('天气数据格式异常');
    }

    const code = raw.current.weather_code ?? 0;
    const times = raw.daily?.time ?? [];
    const maxs = raw.daily?.temperature_2m_max ?? [];
    const mins = raw.daily?.temperature_2m_min ?? [];
    const codes = raw.daily?.weather_code ?? [];

    const days: WeatherDay[] = times.slice(0, 5).map((iso, idx) => ({
      day: formatDayLabel(iso, idx),
      range: `${Math.round(maxs[idx] ?? 0)}/${Math.round(mins[idx] ?? 0)}°`,
      condition: mapWmoCode(codes[idx] ?? 0),
      code: codes[idx] ?? 0,
    }));

    const data: WeatherData = {
      city: coords.name,
      temp: Math.round(raw.current.temperature_2m),
      condition: mapWmoCode(code),
      code,
      humidity: Math.round(raw.current.relative_humidity_2m ?? 0),
      wind: `风速 ${Math.round(raw.current.wind_speed_10m ?? 0)} km/h`,
      days: days.length ? days : DEMO_WEATHER.days,
      isDemo: false,
    };

    WEATHER_CACHE.set(key, { at: Date.now(), data });
    return data;
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      ...DEMO_WEATHER,
      city: key,
      isDemo: true,
      error: isAbort ? '天气请求超时，已显示示例数据' : '天气服务暂不可用，已显示示例数据',
    };
  }
}
