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
