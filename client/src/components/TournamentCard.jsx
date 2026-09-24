import React from 'react';
import { Trophy, Users, Calendar, Clock, MapPin, Swords, Target, Crosshair, ChevronRight } from 'lucide-react';

export default function TournamentCard({ tournament, onSelect }) {
  const {
    id, name, mode, entry_fee, prize_pool, first_prize, max_slots, filled_slots,
    date, start_time, map, status, banner_img
  } = tournament;

  const totalSlots = max_slots || 50;
  const currentFilled = filled_slots || 0;
  const fillPercent = Math.min(100, Math.round((currentFilled / totalSlots) * 100));

  const getModeIcon = () => {
    switch (mode) {
      case 'battle_royale': return <Crosshair size={14} color="var(--primary)" />;
      case 'clash_squad': return <Swords size={14} color="var(--secondary)" />;
      case 'lone_wolf': return <Target size={14} color="var(--primary)" />;
      default: return <Trophy size={14} color="var(--primary)" />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'battle_royale': return '50-SLOT BATTLE ROYALE';
      case 'clash_squad': return 'CLASH SQUAD';
      case 'lone_wolf': return '1V1 LONE WOLF';
      default: return 'TOURNAMENT';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'live':
        return <span className="badge-live">LIVE</span>;
      case 'open':
        return <span className="badge-open">OPEN</span>;
      case 'full':
        return <span className="badge-cyan">FILLED {currentFilled}/{totalSlots}</span>;
      case 'completed':
        return <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>COMPLETED</span>;
      case 'cancelled':
        return <span style={{ color: 'var(--danger-red)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>CANCELLED</span>;
      default:
        return <span className="badge-open">{status ? status.toUpperCase() : 'OPEN'}</span>;
    }
  };

  return (
    <div
      className="tactical-card"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={() => onSelect(id)}
    >
      {/* BANNER HEADER */}
      <div style={{
        height: '130px',
        position: 'relative',
        backgroundImage: `linear-gradient(to bottom, rgba(10,14,23,0.3), #131A26), url(${banner_img || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        {/* TOP ROW: MODE & STATUS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(10, 14, 23, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-main)'
          }}>
            {getModeIcon()}
            <span>{getModeLabel()}</span>
          </div>

          <div>{getStatusBadge()}</div>
        </div>

        {/* PRIZE POOL EMBLEM (PRIORITY 1) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(19, 26, 38, 0.9)',
          border: '1px solid var(--border-gold)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          alignSelf: 'flex-start'
        }}>
          <Trophy size={16} color="var(--prize-gold)" />
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--prize-gold)', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>PRIZE POOL</div>
            <div className="font-hud" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--prize-gold)', lineHeight: 1 }}>
              ₹{Number(prize_pool).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* CARD CONTENT */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        
        {/* TOURNAMENT NAME (PRIORITY 2) */}
        <h3 className="font-heading" style={{
          fontSize: '1.05rem',
          color: 'var(--text-main)',
          marginBottom: '10px',
          lineHeight: 1.2
        }}>
          {name}
        </h3>

        {/* METADATA GRID (PRIORITY 3) */}
        <div className="font-hud" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          marginBottom: '12px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={13} color="var(--text-dim)" />
            <span>{date}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} color="var(--text-dim)" />
            <span>{start_time} IST</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={13} color="var(--text-dim)" />
            <span>{map || 'Bermuda'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: 'var(--prize-gold)', fontWeight: 600 }}>1st:</span>
            <span>₹{Number(first_prize || (prize_pool * 0.5)).toLocaleString()}</span>
          </div>
        </div>

        {/* SLOT PROGRESS BAR */}
        <div style={{ marginBottom: '14px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={12} /> SLOTS
            </span>
            <span className="font-hud" style={{ fontWeight: 700, color: currentFilled >= totalSlots ? 'var(--danger-red)' : 'var(--secondary)' }}>
              {currentFilled} / {totalSlots} PLAYERS
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--bg-dark)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${fillPercent}%`,
              height: '100%',
              background: currentFilled >= totalSlots ? 'var(--danger-red)' : 'var(--primary)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: 'var(--font-heading)' }}>ENTRY FEE</div>
            <div className="font-hud" style={{ fontSize: '0.95rem', fontWeight: 700, color: Number(entry_fee) === 0 ? 'var(--secondary)' : 'var(--text-main)' }}>
              {Number(entry_fee) === 0 ? 'FREE' : `₹${Number(entry_fee).toFixed(2)}`}
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <span>SECURE SLOT</span>
            <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
