import { useEffect, useState } from 'react';
import { lettersOf } from '../lib/url';
import type { IconKind } from '../types';
import { SvgIcon } from './SvgIcon';

interface TileFaceProps {
  name: string;
  color?: string;
  icon?: IconKind | null;
  iconUrl?: string;
}

export function TileFace({ name, color, icon, iconUrl }: TileFaceProps) {
  const [imgStatus, setImgStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  useEffect(() => {
    setImgStatus('idle');
  }, [iconUrl]);

  const showImg = Boolean(iconUrl && imgStatus !== 'err');
  const imgReady = Boolean(iconUrl && imgStatus === 'ok');

  return (
    <div className="face" style={{ background: color || '#5b7c99' }}>
      {showImg && (
        <img
          className={`fav ${imgReady ? 'ok' : ''}`}
          src={iconUrl}
          alt=""
          onLoad={() => setImgStatus('ok')}
          onError={() => setImgStatus('err')}
        />
      )}
      {!imgReady &&
        (icon ? (
          <SvgIcon kind={icon} />
        ) : (
          <span className="letters">{lettersOf(name || '?')}</span>
        ))}
    </div>
  );
}
