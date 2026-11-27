import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchHomedashData } from './homedash';
import { clearWeatherCache, fetchWeather } from './weather';

describe('homedash 与天气客户端（Mock Fetch）', () => {
  beforeEach(() => {
    clearWeatherCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('homedash 未配置地址时不发起请求并返回 unconfigured', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const res = await fetchHomedashData('devices', { baseUrl: '' });
    expect(res).toEqual({ status: 'unconfigured' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('homedash 请求成功与鉴权/CORS 失败均返回可控结果且回退示例数据', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { name: '测试设备', ip: '192.0.2.55', online: true, cpu: 10, mem: 20, disk: 30 },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    vi.stubGlobal('fetch', fetchMock);

    const okRes = await fetchHomedashData('devices', {
      baseUrl: 'http://192.0.2.10:3000/',
      token: 'demo-token',
    });
    expect(okRes.status).toBe('ok');
    if (okRes.status === 'ok') {
      expect(okRes.data[0].name).toBe('测试设备');
    }

    const authFail = await fetchHomedashData('vps', { baseUrl: 'http://192.0.2.10:3000' });
    expect(authFail.status).toBe('error');
    if (authFail.status === 'error') {
      expect(authFail.message).toContain('鉴权失败');
      expect(authFail.fallback.length).toBeGreaterThan(0);
    }

    const corsFail = await fetchHomedashData('downloads', { baseUrl: 'http://192.0.2.10:3000' });
    expect(corsFail.status).toBe('error');
    if (corsFail.status === 'error') {
      expect(corsFail.message).toContain('CORS');
      expect(corsFail.fallback.length).toBeGreaterThan(0);
    }
  });

  it('天气客户端能解析 Open-Meteo 响应并在网络失败时回退示例数据', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            current: {
              temperature_2m: 24.6,
              relative_humidity_2m: 70,
              weather_code: 0,
              wind_speed_10m: 9,
            },
            daily: {
              time: ['2026-11-27', '2026-11-28'],
              weather_code: [0, 61],
              temperature_2m_max: [26, 22],
              temperature_2m_min: [18, 15],
            },
          }),
          { status: 200 },
        ),
      )
      .mockRejectedValueOnce(new Error('network error'));

    vi.stubGlobal('fetch', fetchMock);

    const live = await fetchWeather('广州', { force: true });
    expect(live.isDemo).toBe(false);
    expect(live.temp).toBe(25);
    expect(live.condition).toBe('晴');
    expect(live.days[1].condition).toBe('雨');

    const fallback = await fetchWeather('广州', { force: true });
    expect(fallback.isDemo).toBe(true);
    expect(fallback.error).toContain('示例数据');
  });
});
