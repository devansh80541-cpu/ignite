import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext.jsx';
import apiRequest from '../../api/client.js';
import confetti from 'canvas-confetti';
import {
  Swords, Trophy, Award, CheckCircle2, Play, Square, Save, Send,
  Users, Crosshair, Sparkles
} from 'lucide-react';

export default function AdminMatches() {
  const { success, error, info } = useNotification();

  const [tournaments, setTournaments] = useState([]);
  const [selectedTournId, setSelectedTournId] = useState('');
  const [selectedTournDetails, setSelectedTournDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Results Form state: array of { userId, playerName, ffUid, position, kills, prizeAmount }
  const [resultsRows, setResultsRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTournaments() {
      try {
        setLoading(true);
        const res = await apiRequest('/tournaments?status=all');
        const list = res.tournaments || [];
        setTournaments(list);
        if (list.length > 0) {
          setSelectedTournId(list[0].id);
        }
      } catch (err) {
        error(err.message, 'Failed to fetch tournaments');
      } finally {
        setLoading(false);
      }
    }
    loadTournaments();
  }, []);

  useEffect(() => {
    if (!selectedTournId) return;

    async function loadTournDetails() {
      try {
        const data = await apiRequest(`/tournaments/${selectedTournId}`);
        setSelectedTournDetails(data);

        // Pre-fill results rows with all registered players
        const regPlayers = (data.slots || []).filter(s => s.status === 'occupied');
        const existingResults = data.results || [];

        if (existingResults.length > 0) {
          setResultsRows(existingResults.map(r => ({
            userId: r.user_id,
            playerName: r.player_name,
            ffUid: r.player_ff_uid,
            position: r.position,
            kills: r.kills,
            prizeAmount: r.prize_amount
          })));
        } else if (regPlayers.length > 0) {
          setResultsRows(regPlayers.map((p, idx) => ({
            userId: p.userId,
            playerName: p.playerName,
            ffUid: p.playerUid,
            position: idx + 1,
            kills: 0,
            prizeAmount: idx === 0 ? (data.tournament.first_prize || (data.tournament.prize_pool * 0.5)) :
                        idx === 1 ? (data.tournament.second_prize || (data.tournament.prize_pool * 0.25)) :
                        idx === 2 ? (data.tournament.third_prize || (data.tournament.prize_pool * 0.15)) : 0
          })));
        } else {
          setResultsRows([]);
        }
      } catch (err) {
        error(err.message, 'Failed to load tournament details');
      }
    }
    loadTournDetails();
  }, [selectedTournId]);

  const handleRowChange = (index, field, value) => {
    setResultsRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveResults = async (isFinalize) => {
    if (resultsRows.length === 0) {
      error('No players to score.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiRequest(`/admin/tournaments/${selectedTournId}/results`, {
        method: 'POST',
        body: JSON.stringify({
          results: resultsRows,
          isFinalizeAndPayout: isFinalize
        })
      });

      if (isFinalize) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      }

      success(res.message, isFinalize ? '🏆 Tournaments & Prizes Finalized' : 'Results Draft Saved');
      const data = await apiRequest(`/tournaments/${selectedTournId}`);
      setSelectedTournDetails(data);
    } catch (err) {
      error(err.message, 'Results Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          MATCH CONTROL & RESULTS SYSTEM
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Score tournament matches, enter player eliminations, calculate placement points, and distribute prize pools.
        </p>
      </div>

      {/* TOURNAMENT SELECTOR */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffd700', fontFamily: 'var(--font-heading)' }}>
          SELECT TOURNAMENT:
        </label>
        <select
          value={selectedTournId}
          onChange={(e) => setSelectedTournId(e.target.value)}
          className="input-dark"
          style={{ maxWidth: '400px' }}
        >
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.status.toUpperCase()})
            </option>
          ))}
        </select>

        {selectedTournDetails && (
          <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto', fontSize: '0.85rem' }}>
            <span style={{ color: '#94a3b8' }}>Mode: <strong>{selectedTournDetails.tournament.mode.toUpperCase()}</strong></span>
            <span style={{ color: '#10b981' }}>Prize Pool: <strong>₹{Number(selectedTournDetails.tournament.prize_pool).toLocaleString()}</strong></span>
            <span style={{ color: '#ffb703' }}>Registered: <strong>{selectedTournDetails.registeredCount} Players</strong></span>
          </div>
        )}
      </div>

      {/* RESULTS ENTRY TABLE */}
      {selectedTournDetails && (
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>
                ENTER PLACEMENT & KILL RESULTS
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Scoring Rule: 1st Place = 12 pts, 2nd = 9 pts, 3rd = 8 pts (+1 pt per Kill). Finalizing credits winner wallets automatically.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleSaveResults(false)}
                disabled={submitting}
                className="btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                <Save size={16} />
                <span>Save Draft</span>
              </button>

              <button
                onClick={() => handleSaveResults(true)}
                disabled={submitting || selectedTournDetails.tournament.status === 'completed'}
                className="btn-primary"
                style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #ffd700, #ff9800)', color: '#07090e', fontWeight: 900 }}
              >
                <Award size={18} />
                <span>FINALIZE & DISTRIBUTE PRIZES</span>
              </button>
            </div>
          </div>

          {resultsRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No registered players in this tournament to score.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '10px', width: '90px' }}>Rank / Pos</th>
                    <th style={{ padding: '10px' }}>Player Name / IGN</th>
                    <th style={{ padding: '10px' }}>Free Fire UID</th>
                    <th style={{ padding: '10px', width: '100px' }}>Kills</th>
                    <th style={{ padding: '10px', width: '150px' }}>Prize Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: row.position === 1 ? 'rgba(255, 215, 0, 0.06)' : 'transparent' }}>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={row.position}
                          onChange={(e) => handleRowChange(idx, 'position', parseInt(e.target.value, 10) || 1)}
                          className="input-dark"
                          style={{ padding: '6px', textAlign: 'center', fontWeight: 800, color: row.position === 1 ? '#ffd700' : '#fff' }}
                        />
                      </td>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#fff' }}>
                        {row.playerName}
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'monospace', color: '#94a3b8' }}>
                        {row.ffUid || '—'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="number"
                          min="0"
                          value={row.kills}
                          onChange={(e) => handleRowChange(idx, 'kills', parseInt(e.target.value, 10) || 0)}
                          className="input-dark"
                          style={{ padding: '6px', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={row.prizeAmount}
                          onChange={(e) => handleRowChange(idx, 'prizeAmount', parseFloat(e.target.value) || 0)}
                          className="input-dark"
                          style={{ padding: '6px', fontWeight: 800, color: '#10b981' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
