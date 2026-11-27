import type { ReactNode } from 'react';
import { useHomedash } from '../../hooks/useHomedash';
import { daysUntil } from '../../lib/url';
import type { HomedashDataMap, HomedashKind } from '../../lib/homedash';

interface HomedashWidgetBaseProps {
  homedashUrl: string;
  homedashToken: string;
  onOpenSettings: () => void;
}

function HomedashShell<K extends HomedashKind>({
  kind,
  title,
  homedashUrl,
  homedashToken,
  onOpenSettings,
  renderList,
}: HomedashWidgetBaseProps & {
  kind: K;
  title: string;
  renderList: (items: HomedashDataMap[K]) => ReactNode;
}) {
  const { result, loading, refresh } = useHomedash(kind, homedashUrl, homedashToken);

  const isDemo = result.status === 'error';
  const isLive = result.status === 'ok';

  return (
    <div className="wcard">
      <div className="wh">
        <span>{title}</span>
        <div className="wh-right">
          {isDemo && <span className="badge">示例数据</span>}
          {isLive && <span className="badge live">已连接</span>}
          {result.status !== 'unconfigured' && (
            <button
              type="button"
              className="w-refresh"
              onClick={refresh}
              title="刷新"
              aria-label={`刷新${title}`}
              data-no-drag="1"
            >
              {loading ? '…' : '↻'}
            </button>
          )}
        </div>
      </div>
      <div className="wb">
        {result.status === 'unconfigured' && (
          <div className="homedash-empty">
            <div>在设置中配置 homedash 地址后显示</div>
            <button type="button" className="btn" onClick={onOpenSettings} data-no-drag="1">
              去设置
            </button>
          </div>
        )}
        {result.status === 'error' && (
          <>
            <div className="homedash-hint">{result.message}</div>
            {renderList(result.fallback)}
          </>
        )}
        {result.status === 'ok' && renderList(result.data)}
      </div>
    </div>
  );
}

export function DevicesWidget(props: HomedashWidgetBaseProps) {
  return (
    <HomedashShell
      {...props}
      kind="devices"
      title="家用设备"
      renderList={(devices) =>
        devices.map((d) => (
          <div key={`${d.name}-${d.ip}`} className="dev">
            <div className="top">
              <span>{d.name}</span>
              <span className={d.online ? 'status-on' : 'status-off'}>
                {d.online ? '● 在线' : '离线'}
              </span>
            </div>
            <div className="ip">{d.ip}</div>
            <div className="meters">
              {(
                [
                  ['CPU', d.cpu],
                  ['内存', d.mem],
                  ['磁盘', d.disk],
                ] as const
              ).map(([label, val]) => (
                <div key={label} className="meter">
                  <span>
                    {label} {val}%
                  </span>
                  <div className="bar">
                    <i style={{ width: `${Math.min(100, Math.max(0, val))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      }
    />
  );
}

export function VpsWidget(props: HomedashWidgetBaseProps) {
  return (
    <HomedashShell
      {...props}
      kind="vps"
      title="VPS 到期"
      renderList={(list) =>
        list.map((v) => {
          const days = daysUntil(v.expire);
          const cls = days <= 7 ? 'urgent' : days <= 30 ? 'warn' : '';
          const label = days < 0 ? '已到期' : days === 0 ? '今天到期' : `${days} 天`;
          return (
            <div key={`${v.place}-${v.ip}`} className={`vps ${cls}`}>
              <div>
                <div>
                  {v.place} · {v.vendor}
                </div>
                <div className="s">
                  {v.ip} · {v.quota}
                </div>
              </div>
              <span className={`days ${cls}`}>{label}</span>
            </div>
          );
        })
      }
    />
  );
}

export function DownloadsWidget(props: HomedashWidgetBaseProps) {
  return (
    <HomedashShell
      {...props}
      kind="downloads"
      title="下载进度"
      renderList={(list) =>
        list.map((d) => (
          <div key={d.name} className="dl">
            <div className="nm" title={d.name}>
              {d.name}
            </div>
            <div className="track">
              <i style={{ width: `${Math.min(100, Math.max(0, d.progress))}%` }} />
            </div>
            <div className="sub">
              <span>
                {d.progress}% · {d.speed}
              </span>
              <span>{d.eta}</span>
            </div>
          </div>
        ))
      }
    />
  );
}
