import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Sword, Shield, Trophy, User, Loader2, AlertCircle } from 'lucide-react';

// --- CONFIGURATION ---
// Replace these with your actual Supabase project details
const SUPABASE_URL = 'https://bjxmxihjcbgieaohqipw.supabase.co';
const SUPABASE_ANON_KEY =  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqeG14aWhqY2JnaWVhb2hxaXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTM5NzUsImV4cCI6MjA3OTIyOTk3NX0.O6EYhfmdk4EIgyStolIZ1lQwqD6W45KBxeoLqa-Laa8';

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MAX_HP = 100;
const DAMAGE_RANGE = 15;

export default function BattleArena() {
  // Auth State (Managed by Firebase)
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Game State (Managed by Supabase)
  const [battleId, setBattleId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. LISTEN TO FIREBASE AUTH
  // This automatically picks up the user from your existing login session
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. SUBSCRIBE TO SUPABASE REALTIME
  useEffect(() => {
    if (!battleId) return;

    // Create a subscription to listen for updates to THIS specific battle
    const channel = supabase
      .channel(`battle-${battleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'battles',
          filter: `id=eq.${battleId}`,
        },
        (payload) => {
          // Update local state instantly when DB changes
          setGameState(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId]);

  // 3. MATCHMAKING LOGIC
  const findOrCreateBattle = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Step A: Look for an open lobby (status = 'waiting') that isn't mine
      const { data: openBattles, error: searchError } = await supabase
        .from('battles')
        .select('*')
        .eq('status', 'waiting')
        .neq('player1_id', user.uid) // Don't join my own abandoned game
        .limit(1);

      if (searchError) throw searchError;

      if (openBattles && openBattles.length > 0) {
        // --- JOIN EXISTING GAME ---
        const battle = openBattles[0];
        
        const { data: joinedGame, error: joinError } = await supabase
          .from('battles')
          .update({
            player2_id: user.uid,
            player2_name: user.displayName || 'Player 2', // Use Firebase Display Name
            status: 'active',
            turn: 'player1' // Reset turn to P1
          })
          .eq('id', battle.id)
          .select()
          .single();

        if (joinError) throw joinError;

        setBattleId(joinedGame.id);
        setGameState(joinedGame);
      } else {
        // --- CREATE NEW GAME ---
        const { data: newGame, error: createError } = await supabase
          .from('battles')
          .insert([
            {
              player1_id: user.uid,
              player1_name: user.displayName || 'Player 1',
              hp1: MAX_HP,
              hp2: MAX_HP,
              status: 'waiting',
              turn: 'player1'
            }
          ])
          .select()
          .single();

        if (createError) throw createError;

        setBattleId(newGame.id);
        setGameState(newGame);
      }
    } catch (err) {
      console.error('Matchmaking error:', err);
      setError('Failed to enter the arena. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 4. BATTLE ACTIONS
  const attack = async () => {
    if (!gameState || !user) return;
    
    // Determine player roles
    const isPlayer1 = gameState.player1_id === user.uid;
    const myKey = isPlayer1 ? 'player1' : 'player2';
    const opponentKey = isPlayer1 ? 'player2' : 'player1';
    
    // Validate Turn
    if (gameState.turn !== myKey) return;

    // Calculate Damage
    const damage = Math.floor(Math.random() * DAMAGE_RANGE) + 5; // 5-20 dmg
    const targetHpKey = isPlayer1 ? 'hp2' : 'hp1';
    const newHp = Math.max(0, gameState[targetHpKey] - damage);
    
    const updates = {
      [targetHpKey]: newHp,
      turn: opponentKey // Switch turn
    };

    // Check Win Condition
    if (newHp === 0) {
      updates.status = 'finished';
      updates.winner = myKey;
    }

    // Optimistic Update (makes UI feel instant)
    setGameState(prev => ({ ...prev, ...updates }));

    // Send to DB
    const { error } = await supabase
      .from('battles')
      .update(updates)
      .eq('id', battleId);

    if (error) {
      console.error("Attack failed:", error);
      // Revert optimistic update? In a simple game, we might just let the next sub update fix it
    }
  };

  // --- RENDERING HELPERS ---

  if (authLoading) return <div className="flex h-64 items-center justify-center text-white"><Loader2 className="animate-spin mr-2"/> Checking ID...</div>;

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-900 text-white rounded-xl p-6 border border-gray-700">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold">Authentication Required</h2>
      <p className="text-gray-400 mt-2">Please log in to Teenverse to access the Battle Arena.</p>
    </div>
  );

  // Helper to determine if it's my turn
  const isPlayer1 = gameState?.player1_id === user.uid;
  const isMyTurn = gameState?.status === 'active' && gameState?.turn === (isPlayer1 ? 'player1' : 'player2');
  const myHp = isPlayer1 ? gameState?.hp1 : gameState?.hp2;
  const opHp = isPlayer1 ? gameState?.hp2 : gameState?.hp1;
  const opName = isPlayer1 ? gameState?.player2_name : gameState?.player1_name;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 text-white font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
          <Sword className="text-pink-500" /> BATTLE ARENA
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <User className="w-4 h-4" />
          {user.displayName || 'Unknown Warrior'}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* VIEW: LOBBY */}
      {!gameState && (
        <div className="text-center py-12">
          <div className="bg-gray-800/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Ready to Fight?</h2>
          <p className="text-gray-400 mb-8">Join the queue to battle other Teenverse players.</p>
          
          <button
            onClick={findOrCreateBattle}
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sword />}
            {loading ? 'Entering Arena...' : 'FIND MATCH'}
          </button>
        </div>
      )}

      {/* VIEW: WAITING ROOM */}
      {gameState && gameState.status === 'waiting' && (
        <div className="text-center py-12 animate-pulse">
          <Loader2 className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-bold">Searching for Opponent...</h3>
          <p className="text-gray-500 mt-2">Waiting for another player to join.</p>
        </div>
      )}

      {/* VIEW: ACTIVE BATTLE */}
      {gameState && (gameState.status === 'active' || gameState.status === 'finished') && (
        <div className="space-y-8">
          
          {/* Opponent Status */}
          <div className="bg-gray-800 rounded-lg p-4 relative overflow-hidden">
            <div className="flex justify-between items-end mb-2 relative z-10">
              <span className="font-bold text-red-400 text-lg">{opName || 'Waiting...'}</span>
              <span className="font-mono">{opHp} / {MAX_HP} HP</span>
            </div>
            <div className="w-full bg-gray-900 h-4 rounded-full overflow-hidden relative z-10">
              <div 
                className="h-full bg-red-600 transition-all duration-500 ease-out"
                style={{ width: `${(opHp / MAX_HP) * 100}%` }}
              />
            </div>
          </div>

          {/* VS Badge */}
          <div className="flex justify-center -my-4 relative z-20">
            <div className="bg-black border-2 border-gray-700 rounded-full w-12 h-12 flex items-center justify-center font-black text-gray-500">
              VS
            </div>
          </div>

          {/* My Status */}
          <div className="bg-gray-800 rounded-lg p-4 relative overflow-hidden">
             <div className="flex justify-between items-end mb-2 relative z-10">
              <span className="font-bold text-green-400 text-lg">YOU</span>
              <span className="font-mono">{myHp} / {MAX_HP} HP</span>
            </div>
            <div className="w-full bg-gray-900 h-4 rounded-full overflow-hidden relative z-10">
              <div 
                className="h-full bg-green-600 transition-all duration-500 ease-out"
                style={{ width: `${(myHp / MAX_HP) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Area */}
          <div className="mt-8 pt-4 border-t border-gray-800 text-center">
            {gameState.status === 'finished' ? (
              <div className="space-y-4">
                <div className="text-3xl font-black uppercase tracking-wider">
                  {gameState.winner === (isPlayer1 ? 'player1' : 'player2') 
                    ? <span className="text-yellow-400">Victory!</span> 
                    : <span className="text-red-500">Defeat</span>}
                </div>
                <button 
                  onClick={() => { setGameState(null); setBattleId(null); }}
                  className="text-gray-400 hover:text-white underline"
                >
                  Return to Lobby
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">
                  {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
                </div>
                <button
                  onClick={attack}
                  disabled={!isMyTurn}
                  className={`w-full py-4 text-xl font-black rounded-lg transition-all duration-200 
                    ${isMyTurn 
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg hover:shadow-red-900/50 transform hover:-translate-y-1' 
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                >
                  {isMyTurn ? 'ATTACK!' : 'WAITING...'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}