import { useState } from 'react';
import { DEMO_CALENDAR_EVENTS } from '../../lib/defaults';
import { daysUntil } from '../../lib/url';

export function CalendarWidget() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const today = new Date();

  const cells: Array<{ n: number; mute: boolean; today: boolean; mark: boolean }> = [];
  for (let i = 0; i < startOffset; i += 1) {
    cells.push({
      n: prevMonthDays - startOffset + 1 + i,
      mute: true,
      today: false,
      mark: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      n: d,
      mute: false,
      today: today.getFullYear() === year && today.getMonth() === month && today.getDate() === d,
      mark: DEMO_CALENDAR_EVENTS.some((ev) => ev.date === iso),
    });
  }

  const upcoming = DEMO_CALENDAR_EVENTS.filter((e) => daysUntil(e.date) >= 0).slice(0, 2);

  return (
    <div className="wcard">
      <div className="wh">
        <span>日历</span>
      </div>
      <div className="wb">
        <div className="cal-hd">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            aria-label="上个月"
            data-no-drag="1"
          >
            ‹
          </button>
          <b>
            {year}年{month + 1}月
          </b>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            aria-label="下个月"
            data-no-drag="1"
          >
            ›
          </button>
        </div>
        <div className="cal-grid">
          {'一二三四五六日'.split('').map((w) => (
            <div key={w} className="wk">
              {w}
            </div>
          ))}
          {cells.map((c, idx) => (
            <div
              key={idx}
              className={`day ${c.mute ? 'mute' : ''} ${c.today ? 'today' : ''} ${
                c.mark ? 'mark' : ''
              }`}
            >
              {c.n}
            </div>
          ))}
        </div>
        {upcoming.length > 0 && (
          <div className="cal-notes">
            {upcoming.map((e) => (
              <div key={e.date}>
                <span>{e.date.slice(5).replace('-', '/')}</span>
                {e.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
