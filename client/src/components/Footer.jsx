import React from 'react';
import { ShieldCheck, Award, HeartHandshake, Lock } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer style={{
      background: 'var(--bg-dark)',
      borderTop: '1px solid var(--border-subtle)',
      padding: '50px 20px 80px 20px',
      color: 'var(--text-muted)',
      fontSize: '0.85rem',
      marginTop: '60px'
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* TOP BADGES ROW */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          paddingBottom: '30px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 77, 0, 0.1)', border: '1px solid var(--border-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color="var(--primary)" />
            </div>
            <div>
              <div className="font-heading" style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>100% SECURE VAULT</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Verified transaction security</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 197, 61, 0.1)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} color="var(--prize-gold)" />
            </div>
            <div>
              <div className="font-heading" style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>GUARANTEED PRIZES</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Instant verified payouts</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid var(--border-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartHandshake size={18} color="var(--secondary)" />
            </div>
            <div>
              <div className="font-heading" style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>STRICT FAIR PLAY</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Zero emulator tolerance</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={18} color="var(--text-main)" />
            </div>
            <div>
              <div className="font-heading" style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>ADMIN AUDITED</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Immutable ledger review</div>
            </div>
          </div>
        </div>

        {/* MAIN FOOTER */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          marginBottom: '30px'
        }}>
          <div>
            <img src="/ignite-logo.png" alt="IGNITE ESPORTS" style={{ height: '32px', width: 'auto', objectFit: 'contain', marginBottom: '8px' }} />
            <div className="font-heading" style={{ fontSize: '0.75rem', color: 'var(--primary)', letterSpacing: '0.1em', marginBottom: '8px' }}>
              ENTER. COMPETE. DOMINATE.
            </div>
            <p className="font-body" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Premier competitive esports tournament platform for Free Fire players. Secure your slot, battle for victory, and receive verified rewards.
            </p>
          </div>

          <div>
            <div className="font-heading" style={{ color: 'var(--text-main)', marginBottom: '10px', fontSize: '0.85rem' }}>
              DISCIPLINES
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
              <li><button onClick={() => onNavigate('battle_royale')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>50-Slot Battle Royale</button></li>
              <li><button onClick={() => onNavigate('clash_squad')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Clash Squad 4v4</button></li>
              <li><button onClick={() => onNavigate('lone_wolf')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Lone Wolf 1v1 Duels</button></li>
              <li><button onClick={() => onNavigate('leaderboard')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Player Rankings</button></li>
            </ul>
          </div>

          <div>
            <div className="font-heading" style={{ color: 'var(--text-main)', marginBottom: '10px', fontSize: '0.85rem' }}>
              PLAYER SERVICES
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
              <li><button onClick={() => onNavigate('wallet')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Add Money (UPI)</button></li>
              <li><button onClick={() => onNavigate('wallet')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cashout Winnings</button></li>
              <li><button onClick={() => onNavigate('my_tournaments')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Match Room Credentials</button></li>
              <li><button onClick={() => onNavigate('support')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Support Center</button></li>
            </ul>
          </div>

          <div>
            <div className="font-heading" style={{ color: 'var(--text-main)', marginBottom: '10px', fontSize: '0.85rem' }}>
              RULES & COMPLIANCE
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
              <li><button onClick={() => onNavigate('rules_fairplay')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Anti-Cheat Code</button></li>
              <li><button onClick={() => onNavigate('rules_fairplay')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Tournament Rulebook</button></li>
              <li><button onClick={() => onNavigate('rules_fairplay')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Terms & Policies</button></li>
            </ul>
          </div>
        </div>

        {/* LEGAL */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '18px', fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
          <p>
            Disclaimer: Free Fire is a registered trademark of Garena International. IGNITE ESPORTS is an independent competitive esports platform and is not affiliated with Garena. © {new Date().getFullYear()} IGNITE ESPORTS. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
