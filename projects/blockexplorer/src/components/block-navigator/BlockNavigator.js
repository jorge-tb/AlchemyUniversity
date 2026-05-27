import { CrystalCube } from '../crystal-cube/CrystalCube';
import './BlockNavigator.css';

export function BlockNavigator({ number, latest, onPrev, onNext }) {
  const canPrev = number > 0;
  const canNext = number < latest;

  const slots = [];
  if (canPrev && number - 2 >= 0)       slots.push({ id: number - 2, slot: 'off-left' });
  if (canPrev)                          slots.push({ id: number - 1, slot: 'left',  onClick: onPrev });
                                        slots.push({ id: number,     slot: 'center' });
  if (canNext)                          slots.push({ id: number + 1, slot: 'right', onClick: onNext });
  if (canNext && number + 2 <= latest)  slots.push({ id: number + 2, slot: 'off-right' });

  return (
    <nav className="block-navigator" aria-label="Block navigation">
      <div className="bn-stage">
        <svg className="bn-track" viewBox="0 0 320 140" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="bn-track-left" x1="50" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#7898e6" stopOpacity="0" />
              <stop offset="100%" stopColor="#7898e6" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="bn-track-right" x1="160" y1="0" x2="270" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#7898e6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#7898e6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {canPrev && <path className="bn-track-path" d="M 50 62 Q 105 68 160 70" stroke="url(#bn-track-left)" />}
          {canNext && <path className="bn-track-path" d="M 160 70 Q 215 68 270 62" stroke="url(#bn-track-right)" />}
        </svg>
        {slots.map(({ id, slot, onClick }) => {
          const label =
            slot === 'left'  ? `Go to previous block ${id}` :
            slot === 'right' ? `Go to next block ${id}` :
            slot === 'center' ? `Current block ${id}` :
            undefined;
          return (
            <button
              key={id}
              type="button"
              className="bn-slot"
              data-slot={slot}
              aria-label={label}
              aria-hidden={slot.startsWith('off-') ? 'true' : undefined}
              tabIndex={onClick ? 0 : -1}
              disabled={!onClick}
              onClick={onClick}
            >
              <CrystalCube />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
