import { useEffect, useState } from 'react';
import { toLunar } from '../lib/lunar';

interface ClockHeroProps {
  showClock: boolean;
  showDate: boolean;
  showLunar: boolean;
  nowOverride?: Date;
}

export function ClockHero({ showClock, showDate, showLunar, nowOverride }: ClockHeroProps) {
  const [now, setNow] = useState<Date>(() => nowOverride ?? new Date());

  useEffect(() => {
    if (nowOverride) {
      setNow(nowOverride);
      return;
    }
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [nowOverride]);

  if (!showClock && !showDate && !showLunar) {
    return <div className="hero" />;
  }

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const weekday = '日一二三四五六'[now.getDay()];
  const dateText = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekday}`;
  const lunar = showLunar ? toLunar(now.getFullYear(), now.getMonth() + 1, now.getDate()) : null;

  return (
    <div className="hero">
      {showClock && <div className="clock-digits">{`${hh}:${mm}`}</div>}
      {(showDate || lunar) && (
        <div className="date-line">
          {showDate && <span>{dateText}</span>}
          {showDate && lunar && <span className="dot">·</span>}
          {lunar && <span className="lunar">{lunar.text}</span>}
        </div>
      )}
    </div>
  );
}
