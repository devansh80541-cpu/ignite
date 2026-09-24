import React, { useState, useEffect } from 'react';
import apiRequest from '../api/client.js';
import TournamentCard from '../components/TournamentCard.jsx';
import {
  Trophy, Users, Swords, Target, Crosshair, ArrowRight,
  Zap, Award, ChevronRight, PlayCircle
} from 'lucide-react';

export default function Home({ onNavigate, onSelectTournament }) {
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState({
    totalPlayers: 12480,
    activeTournaments: 24,
    matchesPlayed: 48392,
    totalPrizePool: 840000
  });
  const [podium, setPodium] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [tournRes, leaderRes] = await Promise.all([
          apiRequest('/tournaments'),
          apiRequest('/leaderboard')
        ]);
        if (tournRes.tournaments && tournRes.tournaments.length > 0) {
          setTournaments(tournRes.tournaments);
        }
        if (leaderRes.platformStats) {
          setStats(prev => ({
            ...prev,
            ...leaderRes.platformStats
          }));
        }
        if (leaderRes.podium) {
          setPodium(leaderRes.podium);
        }
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const featuredTournaments = tournaments.slice(0, 3);
  const liveTournaments = tournaments.filter(t => t.status === 'live');

  return (
    <div style={{ paddingBottom: '60px' }}>
      
      {/* 9. HERO SECTION */}
      <section style={{
        position: 'relative',
        padding: '80px 20px 90px 20px',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 77, 0, 0.12) 0%, rgba(10, 14, 23, 1) 70%)'
      }}>
        {/* Subtle grid & scanline details */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(0, 229, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.6,
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          
          {/* Tactical HUD Header Tag */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 77, 0, 0.08)',
            border: '1px solid var(--border-orange)',
            padding: '4px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            color: 'var(--primary)',
            marginBottom: '20px',
            letterSpacing: '0.15em'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
            COMPETITIVE ESPORTS PLATFORM
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontFamily: "'Teko', sans-serif",
            fontSize: 'clamp(3rem, 9vw, 6.5rem)',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '0.04em',
            lineHeight: 0.95,
            textTransform: 'uppercase',
            marginBottom: '18px'
          }}>
            DOMINATE THE <span style={{ color: 'var(--primary)' }}>BATTLEFIELD</span>
          </h1>

          {/* Supporting Copy */}
          <p className="font-body" style={{
            fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
            color: 'var(--text-muted)',
            maxWidth: '680px',
            margin: '0 auto 32px auto',
            lineHeight: 1.55
          }}>
            Enter competitive tournaments, secure your slot, battle for the top position, and turn every match into a victory.
          </p>

          {/* Hero CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center', alignItems: 'center' }}>
            <button
              onClick={() => onNavigate('tournaments')}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '1rem' }}
            >
              <span>JOIN TOURNAMENT</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => onNavigate('tournaments')}
              className="btn-secondary"
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
            >
              <span>EXPLORE MATCHES</span>
            </button>
          </div>

        </div>
      </section>

      {/* 10. HERO STAT STRIP */}
      <section style={{ maxWidth: '1240px', margin: '-28px auto 60px auto', padding: '0 20px', position: 'relative', zIndex: 5 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}>
          {/* STAT 1: TOTAL PLAYERS */}
          <div className="tactical-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 77, 0, 0.1)', border: '1px solid var(--border-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {Number(stats.totalPlayers).toLocaleString()}+
              </div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>TOTAL PLAYERS</div>
            </div>
          </div>

          {/* STAT 2: ACTIVE TOURNAMENTS */}
          <div className="tactical-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid var(--border-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="var(--secondary)" />
            </div>
            <div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {stats.activeTournaments}
              </div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ACTIVE TOURNAMENTS</div>
            </div>
          </div>

          {/* STAT 3: MATCHES PLAYED */}
          <div className="tactical-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={20} color="var(--text-main)" />
            </div>
            <div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {Number(stats.matchesPlayed).toLocaleString()}+
              </div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>MATCHES PLAYED</div>
            </div>
          </div>

          {/* STAT 4: TOTAL PRIZE POOL */}
          <div className="tactical-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderColor: 'var(--border-gold)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 197, 61, 0.1)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} color="var(--prize-gold)" />
            </div>
            <div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.45rem', fontWeight: 700, color: 'var(--prize-gold)', lineHeight: 1.1 }}>
                ₹{(Number(stats.totalPrizePool) / 100000).toFixed(1)}L+
              </div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', fontWeight: 500, color: 'var(--prize-gold)', letterSpacing: '0.1em' }}>TOTAL PRIZE POOL</div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FEATURED TOURNAMENTS */}
      <section style={{ maxWidth: '1240px', margin: '0 auto 70px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.15em' }}>PRO ARENA</div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '2rem', color: 'var(--text-main)', letterSpacing: '0.06em' }}>FEATURED TOURNAMENTS</h2>
          </div>
          <button
            onClick={() => onNavigate('tournaments')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--secondary)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <span>VIEW ALL</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '18px'
        }}>
          {featuredTournaments.map(t => (
            <TournamentCard
              key={t.id}
              tournament={t}
              onSelect={(id) => onSelectTournament(id)}
            />
          ))}
        </div>
      </section>

      {/* 15. BATTLE MODES */}
      <section style={{ maxWidth: '1240px', margin: '0 auto 80px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', fontWeight: 600, color: 'var(--secondary)', letterSpacing: '0.15em' }}>DISCIPLINE SELECTOR</div>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '2.2rem', color: 'var(--text-main)', letterSpacing: '0.06em' }}>CHOOSE YOUR BATTLE</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {/* BATTLE ROYALE CARD */}
          <div
            className="tactical-card mode-card"
            style={{
              padding: '28px 24px',
              borderColor: 'var(--border-orange)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease'
            }}
            onClick={() => onNavigate('battle_royale')}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 77, 0, 0.12)', border: '1px solid var(--border-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Crosshair size={26} color="var(--primary)" />
            </div>
            <h3 style={{ fontFamily: "'Teko', sans-serif", fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px', letterSpacing: '0.04em' }}>
              BATTLE ROYALE
            </h3>
            <div className="font-hud" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em', marginBottom: '12px' }}>
              50 PLAYER SLOTS
            </div>
            <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px', flex: 1 }}>
              Drop in. Survive. Dominate. Enter 50-slot custom rooms with kill bounties and top Booyah rewards.
            </p>
            <button className="btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>
              <span>EXPLORE BR SLOTS</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* CLASH SQUAD CARD */}
          <div
            className="tactical-card mode-card"
            style={{
              padding: '28px 24px',
              borderColor: 'var(--border-cyan)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease'
            }}
            onClick={() => onNavigate('clash_squad')}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 229, 255, 0.12)', border: '1px solid var(--border-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Swords size={26} color="var(--secondary)" />
            </div>
            <h3 style={{ fontFamily: "'Teko', sans-serif", fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px', letterSpacing: '0.04em' }}>
              CLASH SQUAD
            </h3>
            <div className="font-hud" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', letterSpacing: '0.08em', marginBottom: '12px' }}>
              TEAM COMPETITION
            </div>
            <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px', flex: 1 }}>
              Coordinate. Push. Eliminate. 4v4 tactical squad elimination brackets with round-based rounds.
            </p>
            <button className="btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>
              <span>VIEW SQUAD BRACKETS</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* LONE WOLF CARD */}
          <div
            className="tactical-card mode-card"
            style={{
              padding: '28px 24px',
              borderColor: 'var(--border-orange)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease'
            }}
            onClick={() => onNavigate('lone_wolf')}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 51, 85, 0.12)', border: '1px solid rgba(255, 51, 85, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <Target size={26} color="var(--danger-red)" />
            </div>
            <h3 style={{ fontFamily: "'Teko', sans-serif", fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px', letterSpacing: '0.04em' }}>
              LONE WOLF
            </h3>
            <div className="font-hud" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger-red)', letterSpacing: '0.08em', marginBottom: '12px' }}>
              1V1 DUELS
            </div>
            <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px', flex: 1 }}>
              No teammates. No excuses. High-stakes 1v1 cage duels for pure gun skill dominance.
            </p>
            <button className="btn-primary" style={{ width: '100%', background: 'var(--danger-red)', borderColor: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
              <span>ENTER 1V1 ARENA</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 17. HOW IT WORKS */}
      <section style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '60px 20px',
        marginBottom: '70px'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.15em' }}>TACTICAL PIPELINE</div>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '2rem', color: 'var(--text-main)', letterSpacing: '0.06em' }}>HOW IT WORKS</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            position: 'relative'
          }}>
            {/* STEP 01 */}
            <div className="tactical-card" style={{ padding: '24px', background: 'var(--bg-surface)' }}>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>
                01
              </div>
              <h4 style={{ fontFamily: "'Teko', sans-serif", fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                REGISTER
              </h4>
              <p className="font-body" style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Create your IGNITE ESPORTS account and complete your player profile with your Free Fire UID.
              </p>
            </div>

            {/* STEP 02 */}
            <div className="tactical-card" style={{ padding: '24px', background: 'var(--bg-surface)' }}>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '10px' }}>
                02
              </div>
              <h4 style={{ fontFamily: "'Teko', sans-serif", fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                JOIN THE BATTLE
              </h4>
              <p className="font-body" style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Select a tournament, secure your slot in the 50-player grid, and enter the lobby.
              </p>
            </div>

            {/* STEP 03 */}
            <div className="tactical-card" style={{ padding: '24px', background: 'var(--bg-surface)' }}>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: 'var(--prize-gold)', marginBottom: '10px' }}>
                03
              </div>
              <h4 style={{ fontFamily: "'Teko', sans-serif", fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                WIN & EARN
              </h4>
              <p className="font-body" style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Compete, finish at the top position, and receive your verified winnings into your wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 18. LIVE MATCHES */}
      {liveTournaments.length > 0 && (
        <section style={{ maxWidth: '1240px', margin: '0 auto 70px auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span className="badge-live">LIVE NOW</span>
            <h2 className="font-heading" style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>IN-PROGRESS MATCHES</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {liveTournaments.map(t => (
              <div key={t.id} className="tactical-card" style={{ padding: '16px', borderLeft: '3px solid var(--danger-red)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="font-hud" style={{ fontSize: '0.75rem', color: 'var(--danger-red)' }}>MATCH #{t.id}</span>
                  <span className="badge-live">LIVE</span>
                </div>
                <h4 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '6px' }}>{t.name}</h4>
                <div className="font-hud" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {t.filled_slots || 0}/{t.max_slots || 50} PLAYERS • STARTED {t.start_time}
                </div>
                <button
                  onClick={() => onSelectTournament(t.id)}
                  className="btn-secondary"
                  style={{ width: '100%', padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <PlayCircle size={14} /> VIEW MATCH
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 19 & 20. LEADERBOARD PREVIEW & WINNERS REWARDS */}
      <section style={{ maxWidth: '1240px', margin: '0 auto 60px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.7rem', fontWeight: 600, color: 'var(--prize-gold)', letterSpacing: '0.15em' }}>HALL OF FAME</div>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '2rem', color: 'var(--text-main)', letterSpacing: '0.06em' }}>TOP PLAYERS</h2>
        </div>

        {podium.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            alignItems: 'flex-end'
          }}>
            {/* Rank 2 */}
            {podium[1] && (
              <div className="tactical-card" style={{ padding: '20px', textAlign: 'center', borderTop: '3px solid #9AA7B8' }}>
                <div className="font-hud" style={{ fontSize: '0.8rem', color: '#9AA7B8', fontWeight: 700, marginBottom: '8px' }}>RANK #2</div>
                <img src={podium[1].avatar} alt={podium[1].username} style={{ width: '56px', height: '56px', borderRadius: '4px', margin: '0 auto 10px auto', objectFit: 'cover' }} />
                <h4 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{podium[1].in_game_name || podium[1].username}</h4>
                <div className="font-hud" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--prize-gold)', margin: '6px 0' }}>
                  ₹{Number(podium[1].total_earnings || 0).toLocaleString()}
                </div>
                <div className="font-hud" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {podium[1].total_wins || 0} WINS • {podium[1].total_kills || 0} KILLS
                </div>
              </div>
            )}

            {/* Rank 1 GOLD */}
            {podium[0] && (
              <div className="tactical-card" style={{ padding: '26px', textAlign: 'center', borderTop: '4px solid var(--prize-gold)', background: 'rgba(255, 197, 61, 0.04)' }}>
                <div className="font-hud" style={{ fontSize: '0.85rem', color: 'var(--prize-gold)', fontWeight: 800, marginBottom: '8px' }}>👑 RANK #1</div>
                <img src={podium[0].avatar} alt={podium[0].username} style={{ width: '70px', height: '70px', borderRadius: '4px', margin: '0 auto 10px auto', border: '2px solid var(--prize-gold)', objectFit: 'cover' }} />
                <h4 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--prize-gold)' }}>{podium[0].in_game_name || podium[0].username}</h4>
                <div className="font-hud" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--prize-gold)', margin: '6px 0' }}>
                  ₹{Number(podium[0].total_earnings || 0).toLocaleString()}
                </div>
                <div className="font-hud" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  {podium[0].total_wins || 0} WINS • {podium[0].total_kills || 0} KILLS
                </div>
              </div>
            )}

            {/* Rank 3 */}
            {podium[2] && (
              <div className="tactical-card" style={{ padding: '20px', textAlign: 'center', borderTop: '3px solid #CD7F32' }}>
                <div className="font-hud" style={{ fontSize: '0.8rem', color: '#CD7F32', fontWeight: 700, marginBottom: '8px' }}>RANK #3</div>
                <img src={podium[2].avatar} alt={podium[2].username} style={{ width: '56px', height: '56px', borderRadius: '4px', margin: '0 auto 10px auto', objectFit: 'cover' }} />
                <h4 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{podium[2].in_game_name || podium[2].username}</h4>
                <div className="font-hud" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--prize-gold)', margin: '6px 0' }}>
                  ₹{Number(podium[2].total_earnings || 0).toLocaleString()}
                </div>
                <div className="font-hud" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {podium[2].total_wins || 0} WINS • {podium[2].total_kills || 0} KILLS
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="tactical-card" style={{ padding: '24px', textAlign: 'center' }}>
            <div className="font-hud" style={{ fontSize: '0.85rem', color: 'var(--prize-gold)', fontWeight: 700, marginBottom: '4px' }}>RECENT WINNER</div>
            <div className="font-heading" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>TITANOP — 1ST PLACE</div>
            <div className="font-hud" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--prize-gold)', marginTop: '4px' }}>₹5,000</div>
          </div>
        )}
      </section>

      <style>{`
        .mode-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}
