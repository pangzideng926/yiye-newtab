import { useWeather } from '../../hooks/useWeather';

interface WeatherWidgetProps {
  city: string;
}

export function WeatherWidget({ city }: WeatherWidgetProps) {
  const { weather, loading, refresh } = useWeather(city);

  return (
    <div className="wcard">
      <div className="wh">
        <span>天气</span>
        <div className="wh-right">
          {weather.isDemo ? (
            <span className="badge" title={weather.error}>
              示例数据
            </span>
          ) : (
            <span className="badge live">实时</span>
          )}
          <button
            type="button"
            className="w-refresh"
            onClick={refresh}
            title="刷新天气"
            aria-label="刷新天气"
            data-no-drag="1"
          >
            {loading ? '…' : '↻'}
          </button>
        </div>
      </div>
      <div className="wb">
        {weather.error && <div className="homedash-hint">{weather.error}</div>}
        <div className="wx-now">
          <div>
            <div className="wx-city">
              {weather.city} · {weather.condition}
            </div>
            <div className="wx-temp">
              {weather.temp}
              <small>°</small>
            </div>
            <div className="wx-meta">
              湿度 {weather.humidity}% · {weather.wind}
            </div>
          </div>
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
            style={{ opacity: 0.9 }}
          >
            <path d="M7 17h10a4 4 0 0 0 0-8 6 6 0 0 0-11-2A4 4 0 0 0 7 17z" />
          </svg>
        </div>
        <div className="wx-days">
          {weather.days.map((d) => (
            <div key={d.day}>
              {d.day}
              <b>{d.range}</b>
              {d.condition}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
