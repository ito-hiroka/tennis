// src/components/SoccerField.tsx
'use client'; // ← これ重要！今後、画面操作(クリックなど)を追加するためです。

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

// SoccerField という名前のコンポーネント（部品）を定義します
export default function SoccerField() {
  // プレイヤーの位置を状態として管理（縦方向のみ）
  const [player1Pos, setPlayer1Pos] = useState({ top: 180, left: 50 });
  const [player2Pos, setPlayer2Pos] = useState({ top: 180, left: 510 });
  
  // ボールの位置と方向を状態として管理
  const [ballPos, setBallPos] = useState({ top: 190, left: 280 });
  const [ballDirection, setBallDirection] = useState(() => {
    // 初期速度をランダムに設定（速度アップ）
    return { 
      dx: Math.random() < 0.5 ? -3.5 - Math.random() : 3.5 + Math.random(), 
      dy: (Math.random() - 0.5) * 2.5 
    };
  });
  const [rallyCount, setRallyCount] = useState(0); // ラリーカウントを追加
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [matchOver, setMatchOver] = useState(false);
  const [matchWinner, setMatchWinner] = useState('');
  const [waitingForNextRound, setWaitingForNextRound] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  
  // 得点が4.5点以上になったらゲームセット
  useEffect(() => {
    if (score.player1 >= 4.5) {
      setMatchOver(true);
      setMatchWinner('プレイヤー1');
      setWaitingForNextRound(false); // ポップアップを表示しない
      setGameOver(false); // ゲームオーバー状態を解除
      setShowOptions(false);
    } else if (score.player2 >= 4.5) {
      setMatchOver(true);
      setMatchWinner('プレイヤー2');
      setWaitingForNextRound(false); // ポップアップを表示しない
      setGameOver(false); // ゲームオーバー状態を解除
      setShowOptions(false);
    }
  }, [score]);
  
  // ボールを返す関数
  const hitBall = useCallback((player: 'player1' | 'player2') => {
    if (waitingForNextRound || matchOver) return false;
    
    // ボールがプレイヤーの近くにあるか確認
    const playerPos = player === 'player1' ? player1Pos : player2Pos;
    const distToBall = Math.sqrt(
      Math.pow(playerPos.top + 5 - ballPos.top - 3, 2) + 
      Math.pow(playerPos.left + 5 - ballPos.left - 3, 2)
    );
    
    // ボールが近くにある場合のみ反射させる
    if (distToBall < 50) {
      // ラリーカウントを増やす
      setRallyCount(prev => prev + 1);
      
      // ラリーが続くほど速くなる確率が上がる
      const speedUpProbability = Math.min(0.3 + (rallyCount * 0.05), 0.8); // 最大80%まで確率上昇
      
      // 方向を反転させる（ラリーが続くほど速くなりやすい）
      setBallDirection(prev => {
        // ラリーカウントに応じてスピードブーストも上昇
        const baseBoost = Math.min(0.4 + (rallyCount * 0.1), 1.5); // 最大1.5まで上昇
        const speedBoost = Math.random() < speedUpProbability ? baseBoost + 1.0 : baseBoost; 
        
        return {
          dx: player === 'player1' 
            ? Math.abs(prev.dx) + speedBoost 
            : -Math.abs(prev.dx) - speedBoost,
          dy: (Math.random() - 0.5) * (3 + Math.min(rallyCount * 0.3, 3)) // Y軸の変化量も増加
        };
      });
      
      return true;
    }
    return false;
  }, [ballPos, player1Pos, player2Pos, waitingForNextRound, matchOver, rallyCount]);
  
  // キーボード操作でプレイヤーを移動とボールを返す
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // マッチオーバー時の選択肢操作
      if (matchOver && showOptions) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          setSelectedOption(prev => prev === 0 ? 1 : 0);
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (selectedOption === 0) {
            // 新しいゲームを始める
            setGameOver(false);
            setMatchOver(false);
            setScore({ player1: 0, player2: 0 });
            setRallyCount(0); // ラリーカウントをリセット
            setBallPos({ top: 190, left: 280 });
            setBallDirection({ 
              dx: Math.random() < 0.5 ? -3.5 - Math.random() : 3.5 + Math.random(),
              dy: (Math.random() - 0.5) * 2.5
            });
            setPlayer1Pos({ top: 180, left: 50 });
            setPlayer2Pos({ top: 180, left: 510 });
            setShowOptions(false);
          } else {
            // このページに止まる
            setShowOptions(false);
          }
        }
        return;
      }
      
      // マッチオーバー時にEnterキーで選択肢を表示
      if (matchOver && !showOptions && (e.key === 'Enter' || e.key === ' ')) {
        setShowOptions(true);
        setSelectedOption(0);
        return;
      }
      
      // 次のラウンド待ち時間中にEnterキーで次のラウンドを開始
      if (waitingForNextRound && (e.key === 'Enter' || e.key === ' ')) {
        setGameOver(false);
        setWaitingForNextRound(false);
        setRallyCount(0); // ラリーカウントをリセット
        setBallPos({ top: 190, left: 280 });
        setBallDirection({ 
          dx: Math.random() < 0.5 ? -3.5 - Math.random() : 3.5 + Math.random(),
          dy: (Math.random() - 0.5) * 2.5
        });
        return;
      }
      
      // ゲーム中の操作
      if (!gameOver && !matchOver && !waitingForNextRound) {
        // プレイヤー1の縦移動（WS）
        if (e.key === 'w') {
          setPlayer1Pos(prev => ({ ...prev, top: Math.max(10, prev.top - 15) }));
        } else if (e.key === 's') {
          setPlayer1Pos(prev => ({ ...prev, top: Math.min(350, prev.top + 15) }));
        }
        
        // プレイヤー2の縦移動（上下矢印）
        if (e.key === 'ArrowUp') {
          setPlayer2Pos(prev => ({ ...prev, top: Math.max(10, prev.top - 15) }));
        } else if (e.key === 'ArrowDown') {
          setPlayer2Pos(prev => ({ ...prev, top: Math.min(350, prev.top + 15) }));
        }
        
        // ボールを返す
        if (e.key === ' ') {
          // プレイヤー1がボールを返す（スペースキー）
          hitBall('player1');
        } else if (e.key === 'Enter') {
          // プレイヤー2がボールを返す
          hitBall('player2');
        }
      }
      
      // Rキーでゲームを完全リセット
      if (e.key === 'r') {
        setGameOver(false);
        setMatchOver(false);
        setWaitingForNextRound(false);
        setScore({ player1: 0, player2: 0 });
        setRallyCount(0); // ラリーカウントをリセット
        setBallPos({ top: 190, left: 280 });
        setBallDirection({ 
          dx: Math.random() < 0.5 ? -3.5 - Math.random() : 3.5 + Math.random(),
          dy: (Math.random() - 0.5) * 2.5
        });
        setPlayer1Pos({ top: 180, left: 50 });
        setPlayer2Pos({ top: 180, left: 510 });
        setShowOptions(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, hitBall, matchOver, waitingForNextRound, showOptions, selectedOption]);
  
  // ボールの自動移動
  useEffect(() => {
    if (gameOver || matchOver || waitingForNextRound) return;
    
    const moveInterval = setInterval(() => {
      setBallPos(prev => {
        const newTop = prev.top + ballDirection.dy;
        const newLeft = prev.left + ballDirection.dx;
        
        // 上下の壁での反射
        let newDy = ballDirection.dy;
        if (newTop <= 0 || newTop >= 374) {
          newDy = -newDy;
          setBallDirection(prev => ({ ...prev, dy: newDy }));
        }
        
        // ゲームオーバー判定
        if (newLeft <= 0) {
          // プレイヤー1が負け、プレイヤー2が得点
          setWinner('プレイヤー2');
          setRallyCount(0); // ラリーカウントをリセット
          setScore(prev => {
            const newScore = { ...prev, player2: prev.player2 + 0.5 }; // 0.5点加算
            
            // 勝利判定（4.5点以上で勝ち）
            if (newScore.player2 >= 4.5) {
              setMatchOver(true);
              setMatchWinner('プレイヤー2');
            } else {
              setGameOver(true);
              setWaitingForNextRound(true);
            }
            
            return newScore;
          });
          clearInterval(moveInterval);
        } else if (newLeft >= 574) {
          // プレイヤー2が負け、プレイヤー1が得点
          setWinner('プレイヤー1');
          setRallyCount(0); // ラリーカウントをリセット
          setScore(prev => {
            const newScore = { ...prev, player1: prev.player1 + 0.5 }; // 0.5点加算
            
            // 勝利判定（4.5点以上で勝ち）
            if (newScore.player1 >= 4.5) {
              setMatchOver(true);
              setMatchWinner('プレイヤー1');
            } else {
              setGameOver(true);
              setWaitingForNextRound(true);
            }
            
            return newScore;
          });
          clearInterval(moveInterval);
        }
        
        return {
          top: Math.max(0, Math.min(374, newTop)),
          left: Math.max(0, Math.min(574, newLeft))
        };
      });
    }, 30); // 30ミリ秒ごとに更新
    
    return () => clearInterval(moveInterval);
  }, [ballDirection, gameOver, matchOver, waitingForNextRound]);

  return (
    // ↓ これがサッカーフィールド本体になります
    // className="..." は Tailwind CSS で見た目を指定しています
    // relative: この要素を基準に中の要素の位置を決める指定
    // w-[600px] h-[400px]: 幅 600px, 高さ 400px
    // bg-green-500: 背景色を緑に
    // border-4 border-white: 白い枠線を太さ4でつける
    <div className={`relative w-[600px] h-[400px] ${matchOver ? 'bg-black' : 'bg-green-500 border-4 border-white'}`}>
      {/* スコア表示 - マッチオーバー時も表示 */}
      <div className={`absolute -top-12 left-0 w-full flex justify-between text-lg font-bold ${matchOver ? 'text-white' : 'text-black'}`}>
        <div>ねこ博士: {score.player1}</div>
        <div>白とりさん: {score.player2}</div>
      </div>
      
      {/* ラリー回数表示 - 位置を調整 */}
      {!matchOver && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-sm font-bold text-white bg-black bg-opacity-50 px-2 py-1 rounded">
          ラリー: {rallyCount}
        </div>
      )}
      
      {/* ゲーム説明 - マッチオーバー時は非表示、位置を調整 */}
      {!matchOver && (
        <div className="absolute -bottom-40 left-1/2 transform -translate-x-1/2 text-sm text-black bg-white px-4 py-2 rounded-md shadow-md w-[650px] text-center">
          <p className="font-bold mb-1">操作方法：</p>
          <p>ねこ博士: W/Sキーで上下移動、スペースキーでボールを返す</p>
          <p>白とりさん: 上下矢印キーで移動、Enterキーでボールを返す</p>
          <p>5点先取したプレイヤーの勝ちです！ゲームオーバー時はRキーでリスタート</p>
        </div>
      )}
      
      {/* 中央線 - マッチオーバー時は非表示 */}
      {!matchOver && (
        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white bg-opacity-50 border-dashed"></div>
      )}
      
      {/* ラウンドオーバー表示 - ポップアップスタイル */}
      {gameOver && waitingForNextRound && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black p-6 rounded-xl shadow-lg z-10 w-[400px] text-center">
          <div className="text-2xl font-bold mb-3">{winner === 'プレイヤー1' ? 'ねこ博士' : '白とりさん'}がポイント獲得！</div>
          <div className="text-base mb-4">スコア: {score.player1} - {score.player2}</div>
          <div className="bg-blue-500 text-white py-2 px-4 rounded-lg mx-auto w-fit cursor-pointer hover:bg-blue-600" 
               onClick={() => {
                 setGameOver(false);
                 setWaitingForNextRound(false);
                 setRallyCount(0); // ラリーカウントをリセット
                 setBallPos({ top: 190, left: 280 });
                 setBallDirection({ 
                   dx: Math.random() < 0.5 ? -3.5 - Math.random() : 3.5 + Math.random(),
                   dy: (Math.random() - 0.5) * 2.5
                 });
               }}>
            次のラウンドを始める (Enter/Space)
          </div>
        </div>
      )}
      
      {/* フィールド内のアイテムはマッチオーバー時に非表示 */}
      {!matchOver && (
        <>
          {/* プレイヤー1 (左側) - 猫のキャラクター */}
          <div
            className="absolute"
            style={{ 
              top: `${player1Pos.top - 25}px`, 
              left: `${player1Pos.left - 25}px`,
              width: '55px',  // 半分のサイズに縮小
              height: '55px'  // 半分のサイズに縮小
            }}
          >
            {/* Next.jsのImageコンポーネントの代わりに通常のimgタグを使用 */}
            <img
              src="/images/cat.png"
              alt="ねこ博士"
              className="w-full h-full object-contain"
              style={{ transform: 'scale(1)' }}
            />
          </div>

          {/* プレイヤー2 (右側) - ニワトリのキャラクター */}
          <div
            className="absolute"
            style={{ 
              top: `${player2Pos.top - 25}px`, 
              left: `${player2Pos.left - 25}px`,
              width: '55px',  // 半分のサイズに縮小
              height: '55px'  // 半分のサイズに縮小
            }}
          >
            {/* Next.jsのImageコンポーネントの代わりに通常のimgタグを使用 */}
            <img
              src="/images/chicken.png"
              alt="白とりさん"
              className="w-full h-full object-contain"
              style={{ transform: 'scale(1)' }}
            />
          </div>

          {/* ボール */}
          <div
            className="absolute w-6 h-6 bg-white rounded-full"
            style={{ top: `${ballPos.top}px`, left: `${ballPos.left}px` }}
          ></div>
        </>
      )}
      
      {/* マッチオーバー表示 - ポップアップ無し */}
      {matchOver && !showOptions && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-4xl font-bold">
          <div className="p-4 rounded-lg bg-black bg-opacity-50">
            {matchWinner === 'プレイヤー1' ? 'ねこ博士' : '白とりさん'}の勝利！🏆 {score.player1} - {score.player2}
          </div>
          <div className="mt-4 text-xl bg-black bg-opacity-50 p-2 rounded">
            Enter/Spaceキーで続行
          </div>
        </div>
      )}
      
      {/* ゲーム終了時の選択肢 */}
      {matchOver && showOptions && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-xl shadow-lg w-[450px] text-center">
            <div className="text-3xl font-bold mb-6 text-gray-800">{matchWinner === 'プレイヤー1' ? 'ねこ博士' : '白とりさん'}の勝利！🏆</div>
            <div className="text-xl mb-8 text-gray-700">最終スコア: {score.player1} - {score.player2}</div>
            
            <div className="flex flex-col space-y-4">
              <button 
                className={`px-8 py-3 rounded-lg text-white ${selectedOption === 0 ? 'bg-blue-600' : 'bg-gray-500'}`}
                onClick={() => {
                  setGameOver(false);
                  setMatchOver(false);
                  setScore({ player1: 0, player2: 0 });
                  setRallyCount(0); // ラリーカウントをリセット
                  setBallPos({ top: 190, left: 280 });
                  setBallDirection({ 
                    dx: Math.random() < 0.5 ? -3.5 - Math.random() : 3.5 + Math.random(),
                    dy: (Math.random() - 0.5) * 2.5
                  });
                  setPlayer1Pos({ top: 180, left: 50 });
                  setPlayer2Pos({ top: 180, left: 510 });
                  setShowOptions(false);
                }}
              >
                新しいゲームを始める
              </button>
              <button 
                className={`px-8 py-3 rounded-lg text-white ${selectedOption === 1 ? 'bg-blue-600' : 'bg-gray-500'}`}
                onClick={() => setShowOptions(false)}
              >
                このページに止まる
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              上下の矢印キーで選択し、Enterキーで決定
            </div>
          </div>
        </div>
      )}
    </div>
  );
}