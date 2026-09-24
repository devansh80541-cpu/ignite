import React from 'react';

const GRID_STYLES = `
/* ===== SLOT GRID 50 — TACTICAL HUD LAYOUT ===== */

.sg50-wrapper {
  width: 100%;
}

.sg50-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-secondary);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  border: 1px solid var(--border-subtle);
}

.sg50-legend-title {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-main);
}

.sg50-legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
}

.sg50-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sg50-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

/* ===== MAIN GRID ===== */
.sg50-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}

/* ===== INDIVIDUAL SLOT CARD ===== */
.sg50-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 4px 8px;
  border-radius: var(--radius-sm);
  cursor: default;
  overflow: hidden;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  min-height: 62px;
}

/* Subtle scanline overlay */
.sg50-slot::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(255,255,255,0.01) 3px,
    rgba(255,255,255,0.01) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* Corner accent marks */
.sg50-slot::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 5px;
  border-top: 1.5px solid transparent;
  border-left: 1.5px solid transparent;
  pointer-events: none;
  z-index: 2;
  transition: border-color 0.2s ease;
}

.sg50-slot-num {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 3px;
  letter-spacing: 0.04em;
  position: relative;
  z-index: 2;
}

.sg50-slot-label {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  position: relative;
  z-index: 2;
}

/* ===== STATE: AVAILABLE ===== */
.sg50-slot.sg50-available {
  cursor: pointer;
  border-color: rgba(0, 229, 255, 0.2);
  background: linear-gradient(180deg, rgba(0, 229, 255, 0.04) 0%, var(--bg-surface) 100%);
}
.sg50-slot.sg50-available::after {
  border-top-color: var(--secondary);
  border-left-color: var(--secondary);
}
.sg50-slot.sg50-available .sg50-slot-num {
  color: var(--secondary);
}
.sg50-slot.sg50-available .sg50-slot-label {
  color: rgba(0, 229, 255, 0.7);
}
.sg50-slot.sg50-available:hover {
  border-color: var(--secondary);
  background: linear-gradient(180deg, rgba(0, 229, 255, 0.1) 0%, rgba(0, 229, 255, 0.03) 100%);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.15), inset 0 0 20px rgba(0, 229, 255, 0.05);
  transform: translateY(-2px) scale(1.03);
}

/* ===== STATE: SELECTED ===== */
.sg50-slot.sg50-selected {
  cursor: pointer;
  border-color: var(--prize-gold);
  background: linear-gradient(180deg, rgba(255, 197, 61, 0.12) 0%, rgba(255, 197, 61, 0.04) 100%);
  box-shadow: 0 0 14px rgba(255, 197, 61, 0.2), inset 0 0 16px rgba(255, 197, 61, 0.06);
}
.sg50-slot.sg50-selected::after {
  border-top-color: var(--prize-gold);
  border-left-color: var(--prize-gold);
}
.sg50-slot.sg50-selected .sg50-slot-num {
  color: var(--prize-gold);
}
.sg50-slot.sg50-selected .sg50-slot-label {
  color: var(--prize-gold);
  font-weight: 700;
}

/* ===== STATE: MY SLOT ===== */
.sg50-slot.sg50-mine {
  border-color: var(--primary);
  background: linear-gradient(180deg, rgba(255, 77, 0, 0.12) 0%, rgba(255, 77, 0, 0.03) 100%);
  box-shadow: 0 0 14px rgba(255, 77, 0, 0.2), inset 0 0 16px rgba(255, 77, 0, 0.06);
}
.sg50-slot.sg50-mine::after {
  border-top-color: var(--primary);
  border-left-color: var(--primary);
}
.sg50-slot.sg50-mine .sg50-slot-num {
  color: var(--primary);
}
.sg50-slot.sg50-mine .sg50-slot-label {
  color: var(--primary);
  font-weight: 700;
}

/* ===== STATE: OCCUPIED ===== */
.sg50-slot.sg50-occupied {
  border-color: rgba(255, 255, 255, 0.04);
  background: var(--bg-dark);
  opacity: 0.65;
}
.sg50-slot.sg50-occupied .sg50-slot-num {
  color: var(--text-dim);
}
.sg50-slot.sg50-occupied .sg50-slot-label {
  color: var(--text-dim);
}

/* ===== STATE: LOCKED ===== */
.sg50-slot.sg50-locked {
  border-color: rgba(255, 255, 255, 0.04);
  background: var(--bg-dark);
  opacity: 0.4;
}
.sg50-slot.sg50-locked .sg50-slot-num {
  color: var(--text-dim);
}
.sg50-slot.sg50-locked .sg50-slot-label {
  color: var(--text-dim);
}

/* ===== FILL PROGRESS BAR ===== */
.sg50-fill-bar-track {
  width: 100%;
  height: 4px;
  background: var(--bg-dark);
  border-radius: 2px;
  margin-top: 12px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}
.sg50-fill-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 900px) {
  .sg50-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 5px;
  }
  .sg50-slot {
    padding: 8px 3px 7px;
    min-height: 56px;
  }
  .sg50-slot-num {
    font-size: 0.62rem;
  }
  .sg50-slot-label {
    font-size: 0.52rem;
  }
}

@media (max-width: 480px) {
  .sg50-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
  }
  .sg50-slot {
    padding: 6px 2px 5px;
    min-height: 50px;
  }
  .sg50-slot-num {
    font-size: 0.58rem;
  }
  .sg50-slot-label {
    font-size: 0.48rem;
  }
  .sg50-legend {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
`;

export default function SlotGrid50({ slots, selectedSlot, onSelectSlot, isRegistered, userSlot }) {
  const totalSlots = slots.length;
  const occupiedCount = slots.filter(s => s.status === 'occupied').length;
  const fillPercent = totalSlots > 0 ? Math.round((occupiedCount / totalSlots) * 100) : 0;

  return (
    <div className="sg50-wrapper">
      <style>{GRID_STYLES}</style>

      {/* LEGEND BAR */}
      <div className="sg50-legend">
        <div className="sg50-legend-title">
          ⬡ BATTLE GRID — {occupiedCount}/{totalSlots} FILLED
        </div>

        <div className="sg50-legend-items">
          <div className="sg50-legend-item">
            <span className="sg50-legend-dot" style={{ background: 'var(--secondary)' }} />
            <span style={{ color: 'var(--secondary)' }}>OPEN</span>
          </div>
          <div className="sg50-legend-item">
            <span className="sg50-legend-dot" style={{ background: 'var(--prize-gold)' }} />
            <span style={{ color: 'var(--prize-gold)' }}>SELECTED</span>
          </div>
          <div className="sg50-legend-item">
            <span className="sg50-legend-dot" style={{ background: 'var(--primary)' }} />
            <span style={{ color: 'var(--primary)' }}>YOUR SLOT</span>
          </div>
          <div className="sg50-legend-item">
            <span className="sg50-legend-dot" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-subtle)' }} />
            <span style={{ color: 'var(--text-dim)' }}>TAKEN</span>
          </div>
        </div>
      </div>

      {/* FILL PROGRESS BAR */}
      <div className="sg50-fill-bar-track">
        <div className="sg50-fill-bar-fill" style={{ width: `${fillPercent}%` }} />
      </div>

      {/* GRID — 10 columns x 5 rows on desktop, 5 columns x 10 rows on mobile */}
      <div className="sg50-grid" style={{ marginTop: '12px' }}>
        {slots.map((slot) => {
          const num = slot.slotNumber < 10 ? `0${slot.slotNumber}` : `${slot.slotNumber}`;
          const isMySlot = slot.isMe || (userSlot && userSlot === slot.slotNumber);
          const isSelected = selectedSlot === slot.slotNumber;
          const isOccupied = slot.status === 'occupied';
          const isAvailable = slot.status === 'available' && !isRegistered;

          let stateClass = '';
          if (isMySlot) stateClass = 'sg50-mine';
          else if (isSelected) stateClass = 'sg50-selected';
          else if (isOccupied) stateClass = 'sg50-occupied';
          else if (isAvailable) stateClass = 'sg50-available';
          else stateClass = 'sg50-locked';

          let label = 'FREE';
          if (isMySlot) label = '◆ YOU';
          else if (isSelected) label = '● SELECT';
          else if (isOccupied) label = slot.playerName || 'TAKEN';

          return (
            <div
              key={slot.slotNumber}
              className={`sg50-slot ${stateClass}`}
              onClick={() => {
                if (isAvailable && !isRegistered) {
                  onSelectSlot(slot.slotNumber);
                }
              }}
              title={isOccupied ? `Occupied by: ${slot.playerName}` : `Slot ${num} — Available`}
            >
              <div className="sg50-slot-num">{num}</div>
              <div className="sg50-slot-label">{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
