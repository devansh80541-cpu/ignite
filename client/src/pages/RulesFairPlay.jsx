import React from 'react';
import { ShieldCheck, AlertTriangle, Scale, Lock, HeartHandshake } from 'lucide-react';

export default function RulesFairPlay() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px 80px 20px' }}>
      
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
          OFFICIAL RULEBOOK
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          RULES & FAIR PLAY CODE 2026
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Commitment to competitive integrity, skill-based gameplay, and player safety.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 1. GENERAL TOURNAMENT REGULATIONS */}
        <div className="glass-card-static" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Scale size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff' }}>
              1. GENERAL COMPETITIVE REGULATIONS
            </h2>
          </div>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.8 }}>
            <li><strong>Eligibility:</strong> Players must be at least 18 years of age and hold an active Free Fire account.</li>
            <li><strong>Device Policy:</strong> All tournaments are strictly <strong>Mobile Only (Android / iOS)</strong> unless explicitly branded as "Emulator Allowed". Emulators (Bluestacks, LDPlayer, Gameloop, etc.) are strictly prohibited.</li>
            <li><strong>Room Credentials:</strong> Custom match Room ID and Password will be posted 15 minutes prior to match start. Players must join their allocated slot on time.</li>
            <li><strong>No-Show Policy:</strong> Failure to join the Free Fire room before the host launches the match will result in forfeiture of the entry fee.</li>
          </ul>
        </div>

        {/* 2. ANTI-CHEAT & PROHIBITED CONDUCT */}
        <div className="glass-card-static" style={{ padding: '28px', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <AlertTriangle size={22} color="#ef4444" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff' }}>
              2. ANTI-CHEAT & PROHIBITED CONDUCT
            </h2>
          </div>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.8 }}>
            <li><strong>Third-Party Tools:</strong> Use of aimbots, wallhacks, auto-headshot injectors, recoil scripts, or modified APKs results in an immediate permanent ban and confiscation of wallet balance.</li>
            <li><strong>Teaming:</strong> Teaming up with opponents in Solo Battle Royale or feeding kills in Lone Wolf is strictly forbidden and results in zero points and account review.</li>
            <li><strong>Proof of Victory:</strong> Players are strongly encouraged to record their final elimination screen and kill count in case of match dispute.</li>
          </ul>
        </div>

        {/* 3. SCORING & PRIZE DISTRIBUTION */}
        <div className="glass-card-static" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <ShieldCheck size={22} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff' }}>
              3. SCORING & PRIZE PAYOUT POLICY
            </h2>
          </div>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.8 }}>
            <li>Placement Points are assigned based on official Free Fire Esports scoring tables (1st Place +12 pts, 2nd +9 pts, 3rd +8 pts).</li>
            <li>Each confirmed elimination awards +1 Kill Point plus any active Kill Bounties.</li>
            <li>Prize money is credited automatically to your in-app wallet within 10 minutes of match completion and results verification.</li>
          </ul>
        </div>

        {/* 4. RESPONSIBLE PLAY & REFUNDS */}
        <div className="glass-card-static" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <HeartHandshake size={22} color="#10b981" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff' }}>
              4. RESPONSIBLE PLAY & REFUND POLICY
            </h2>
          </div>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.8 }}>
            <li><strong>Tournament Cancellation:</strong> If a tournament is cancelled by administration (e.g. server outage), 100% of the entry fee is immediately refunded to your wallet balance.</li>
            <li><strong>Responsible Gaming:</strong> Play for fun and esports skill improvement. Never play beyond your financial means.</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
