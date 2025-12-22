
import React, { useState, useRef, useEffect } from 'react';
import { RecipeResult, Comment } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  incrementDownloadCount, 
  updateRating, 
  updateVoteCounts, 
  signInWithGoogle, 
  signOut, 
  fetchComments, 
  addComment 
} from '../services/supabase.ts';
import { User } from '@supabase/supabase-js';

interface Props {
  result: RecipeResult;
  user: User | null;
  canGoBack: boolean;
  canGoForward: boolean;
  onReset: () => void;
  onRegenerate: () => void;
  onViewAlternative: (dishName: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onSaveContext: () => void;
}

const ResultView: React.FC<Props> = ({ 
  result, 
  user,
  canGoBack, 
  canGoForward, 
  onReset, 
  onRegenerate, 
  onViewAlternative, 
  onGoBack, 
  onGoForward,
  onSaveContext
}) => {
  const [tab, setTab] = useState<'easy' | 'gourmet'>('easy');
  const [isDownloading, setIsDownloading] = useState(false);
  const [rating, setRating] = useState<number>(0);
  
  // Vote State for Toggle UI (Local state to track current session's vote)
  const [myVote, setMyVote] = useState<'success' | 'fail' | null>(null);
  const [voteCounts, setVoteCounts] = useState({ success: 0, fail: 0 });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const isDBSaved = !!result.id;

  // Initialize data
  useEffect(() => {
    if (result.id) {
      fetchComments(result.id).then(setComments);
    } else {
      setComments([]);
    }
    setRating(0);
    setMyVote(null);
    setVoteCounts({ 
        success: result.vote_success || 0, 
        fail: result.vote_fail || 0 
    });
  }, [result.id, result.vote_success, result.vote_fail]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogin = async () => {
    onSaveContext();
    await signInWithGoogle();
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsDownloading(true);

    try {
      if (result.id) {
        await incrementDownloadCount(result.id);
      }

      const canvas = await html2canvas(contentRef.current, {
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width * 0.264583;
      const imgHeight = canvas.height * 0.264583;

      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'l' : 'p',
        unit: 'mm',
        format: [imgWidth, imgHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${result.dishName}_레시피.pdf`);

    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("PDF 저장 중 오류가 발생했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRating = async (score: number) => {
    if (!user) {
      if (confirm("별점을 남기려면 로그인이 필요합니다. 로그인 하시겠습니까?")) {
        handleLogin();
      }
      return;
    }

    setRating(score);
    if (result.id) {
      await updateRating(result.id, score);
      showToast(`${score}점 별점이 저장되었습니다! ⭐`);
    }
  };

  // Toggle Logic for Voting
  const handleFeedback = async (type: 'success' | 'fail') => {
    if (!user) {
      if (confirm("투표를 하려면 로그인이 필요합니다. 로그인 하시겠습니까?")) {
        handleLogin();
      }
      return;
    }
    
    if (!result.id) return;

    let successDelta = 0;
    let failDelta = 0;

    // Case 1: Cancel Vote (Toggle off)
    if (myVote === type) {
        setMyVote(null);
        if (type === 'success') {
            successDelta = -1;
            setVoteCounts(prev => ({ ...prev, success: Math.max(0, prev.success - 1) }));
            showToast("투표가 취소되었습니다.");
        } else {
            failDelta = -1;
            setVoteCounts(prev => ({ ...prev, fail: Math.max(0, prev.fail - 1) }));
            showToast("투표가 취소되었습니다.");
        }
    } 
    // Case 2: New Vote (Empty -> Type)
    else if (myVote === null) {
        setMyVote(type);
        if (type === 'success') {
            successDelta = 1;
            setVoteCounts(prev => ({ ...prev, success: prev.success + 1 }));
            showToast("성공 투표가 반영되었습니다! 😋");
        } else {
            failDelta = 1;
            setVoteCounts(prev => ({ ...prev, fail: prev.fail + 1 }));
            showToast("실패 투표가 반영되었습니다. 🥲");
        }
    } 
    // Case 3: Switch Vote (Success <-> Fail)
    else {
        setMyVote(type);
        if (type === 'success') {
            // Fail -> Success
            failDelta = -1;
            successDelta = 1;
            setVoteCounts(prev => ({ 
                success: prev.success + 1, 
                fail: Math.max(0, prev.fail - 1) 
            }));
            showToast("성공으로 변경되었습니다! 😋");
        } else {
            // Success -> Fail
            successDelta = -1;
            failDelta = 1;
            setVoteCounts(prev => ({ 
                success: Math.max(0, prev.success - 1), 
                fail: prev.fail + 1 
            }));
            showToast("실패로 변경되었습니다. 🥲");
        }
    }

    // Update DB
    await updateVoteCounts(result.id, successDelta, failDelta);
  };

  const handleSubmitComment = async () => {
    if (!user) {
      if (confirm("댓글을 작성하려면 로그인이 필요합니다. 로그인 하시겠습니까?")) {
        handleLogin();
      }
      return;
    }
    if (!newComment.trim() || !result.id) return;

    setIsSubmittingComment(true);
    const added = await addComment(result.id, user.id, user.email || '익명', newComment);
    if (added) {
      setComments(prev => [added, ...prev]);
      setNewComment('');
      showToast("댓글이 등록되었습니다! 💬");
    } else {
      alert("댓글 작성에 실패했습니다.");
    }
    setIsSubmittingComment(false);
  };

  return (
    <div className="animate-fadeIn space-y-8 pb-10 pt-10 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
          <div className="bg-slate-800/90 text-white px-6 py-3 rounded-full shadow-xl text-sm font-bold flex items-center gap-2 backdrop-blur-sm">
            <span>✅</span>
            {toastMessage}
          </div>
        </div>
      )}

      {/* Login Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 relative z-10">
        {user ? (
          <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {user.email?.split('@')[0]}님 환영합니다
            <button 
                onClick={signOut} 
                className="text-slate-400 underline ml-2 py-2 px-2 hover:text-slate-600 transition-colors cursor-pointer"
            >
                로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400 font-bold">
                로그인하고 커뮤니티에 참여해보세요!
            </span>
            <button
                onClick={handleLogin}
                className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-full font-bold text-slate-600 shadow-sm hover:text-[#ff5d01] hover:border-[#ff5d01] transition-all active:scale-95 cursor-pointer"
            >
                🔑 로그인
            </button>
          </div>
        )}
      </div>

      {/* Content to be Captured */}
      <div ref={contentRef} className="bg-white p-4 rounded-[32px]">
        <div className="text-center space-y-6">
          <div className="flex justify-center gap-2 items-center">
            <div className="inline-block px-4 py-1.5 bg-orange-50 text-[#ff5d01] text-xs font-black rounded-full uppercase tracking-widest">
              Recipe Completed
            </div>
            {isDBSaved ? (
              <div className="inline-block px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-full flex items-center gap-1">
                <span>☁️</span> 저장됨
              </div>
            ) : (
               <div className="inline-block px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-full flex items-center gap-1">
                <span>⚠️</span> 로컬
              </div>
            )}
          </div>
          
          {result.imageUrl && (
            <div className="w-full h-64 rounded-[32px] overflow-hidden shadow-lg mb-6 border border-orange-50 relative group">
              <img 
                src={result.imageUrl} 
                alt={result.dishName} 
                className="w-full h-full object-cover"
                crossOrigin="anonymous" // CORS issue for html2canvas
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <span className="text-white/80 text-xs font-medium">Generated by Gemini Nano Banana</span>
              </div>
            </div>
          )}

          <h2 className="text-3xl font-black text-slate-900 leading-tight">
            {result.dishName}
          </h2>
          <div className="relative px-6">
            <p className="text-slate-500 italic text-lg font-medium leading-relaxed">
              "{result.comment}"
            </p>
          </div>
        </div>

        {/* 재료 목록 섹션 */}
        {result.ingredientsList && (
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-50 mt-6">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-xl">🛒</span> 필요 재료
            </h3>
            <div 
              className="prose prose-sm prose-slate max-w-none text-slate-600 font-medium ingredients-list"
              dangerouslySetInnerHTML={{ __html: result.ingredientsList }}
            />
          </div>
        )}

        <div 
          className="bg-[#F2F4F6] p-1.5 rounded-2xl flex mt-8 mb-6 border border-slate-100"
          data-html2canvas-ignore="true"
        >
          <button
            onClick={() => setTab('easy')}
            className={`flex-1 py-3 text-center text-sm font-black rounded-xl transition-all ${
              tab === 'easy' ? 'bg-white text-[#ff5d01] shadow-sm' : 'text-slate-400'
            }`}
          >
            ⚡ 간편 조리법
          </button>
          <button
            onClick={() => setTab('gourmet')}
            className={`flex-1 py-3 text-center text-sm font-black rounded-xl transition-all ${
              tab === 'gourmet' ? 'bg-white text-[#ff5d01] shadow-sm' : 'text-slate-400'
            }`}
          >
            ✨ 꿀팁 & 킥
          </button>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50">
          <h3 className="text-xl font-black text-slate-900 mb-8 brand-orange-text">
            {tab === 'easy' ? '간편 조리법' : '셰프의 특별 레시피'}
          </h3>
          <div 
            className="recipe-content prose prose-slate max-w-none text-slate-800 font-medium"
            dangerouslySetInnerHTML={{ __html: tab === 'easy' ? result.easyRecipe : result.gourmetRecipe }}
          />
        </div>

        <div className="space-y-4 mt-8">
          <h3 className="text-lg font-black text-slate-900">다른 추천 메뉴</h3>
          <div className="grid gap-3">
            {result.similarRecipes.map((recipe, idx) => (
              <button 
                key={idx} 
                onClick={() => onViewAlternative(recipe.title)}
                className="w-full text-left bg-orange-50/30 p-6 rounded-3xl border border-orange-100 flex flex-col gap-3 hover:bg-orange-50 active:scale-95 transition-all group"
              >
                <div>
                  <h4 className="text-lg font-black text-orange-900 flex items-center justify-between">
                    {recipe.title}
                    <span className="text-xs bg-white/50 text-[#ff5d01] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      레시피 보기 ➔
                    </span>
                  </h4>
                  <p className="text-sm text-orange-700/70 font-medium leading-relaxed mt-1">{recipe.reason}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {result.referenceLinks && result.referenceLinks.length > 0 && (
          <div className="space-y-4 pt-8">
            <h3 className="text-lg font-black text-slate-900">참고 링크</h3>
            <div className="flex flex-col gap-2">
              {result.referenceLinks.map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-4 bg-slate-50 border border-slate-100 text-slate-600 text-sm font-bold rounded-2xl flex justify-between items-center hover:bg-slate-100 transition-colors"
                >
                  <span>🔗 {link.title}</span>
                  <span className="text-slate-400">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-center mt-8 text-slate-300 text-xs font-mono">
           Powered by 웅이 연구소
        </div>
      </div>
      
      {/* Community & Feedback Section */}
      <div className="mx-4 bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-slate-900">이 레시피 어떠셨나요?</h3>
          <p className="text-xs text-slate-400">
            {user ? '당신의 의견을 남겨주세요!' : '로그인 후 평가와 댓글을 남길 수 있어요.'}
          </p>
        </div>
        
        {/* Actions */}
        <div className="space-y-4">
            {/* Stars */}
            <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                key={star}
                onClick={() => handleRating(star)}
                className={`text-3xl transition-transform active:scale-125 ${star <= rating ? 'grayscale-0' : 'grayscale opacity-30'} ${!isDBSaved && 'cursor-not-allowed opacity-20'}`}
                >
                ⭐
                </button>
            ))}
            </div>

            {/* Vote Buttons */}
            <div className="flex gap-2">
            <button
                onClick={() => handleFeedback('success')}
                className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 ${
                myVote === 'success' 
                ? 'border-green-500 bg-green-50 text-green-600 shadow-md shadow-green-100' 
                : 'border-slate-100 text-slate-400 hover:border-green-200 hover:text-green-500'
                } ${!isDBSaved && 'opacity-50 cursor-not-allowed'}`}
                disabled={!isDBSaved}
            >
                <span>😋 성공했어요!</span>
                <span className="text-[10px] font-medium opacity-80">{voteCounts.success}</span>
            </button>
            <button
                onClick={() => handleFeedback('fail')}
                className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 ${
                myVote === 'fail' 
                ? 'border-red-500 bg-red-50 text-red-600 shadow-md shadow-red-100' 
                : 'border-slate-100 text-slate-400 hover:border-red-200 hover:text-red-500'
                } ${!isDBSaved && 'opacity-50 cursor-not-allowed'}`}
                disabled={!isDBSaved}
            >
                <span>🥲 망했어요..</span>
                <span className="text-[10px] font-medium opacity-80">{voteCounts.fail}</span>
            </button>
            </div>
        </div>

        <hr className="border-slate-100" />

        {/* Comment List */}
        <div className="space-y-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                💬 요리 톡
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{comments.length}</span>
            </h4>
            
            {/* Comment Input */}
            {user ? (
                <div className="flex gap-2">
                    <textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="나만의 꿀팁이나 후기를 공유해주세요!"
                        rows={2}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#ff5d01] transition-colors resize-none"
                    />
                    <button 
                        onClick={handleSubmitComment}
                        disabled={isSubmittingComment || !newComment.trim()}
                        className="bg-[#ff5d01] text-white font-bold rounded-xl px-4 text-sm disabled:opacity-50"
                    >
                        등록
                    </button>
                </div>
            ) : (
                <button 
                    onClick={handleLogin}
                    className="w-full py-3 bg-slate-50 text-slate-400 text-sm font-bold rounded-xl border border-dashed border-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors"
                >
                    🔒 로그인하고 댓글 남기기
                </button>
            )}

            {/* Comments Display */}
            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {comments.length === 0 ? (
                    <p className="text-center text-xs text-slate-300 py-4">아직 작성된 후기가 없어요. 첫 번째 주인공이 되어보세요!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700">
                                    {comment.user_email?.split('@')[0] || '익명'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4">
        <div className="flex gap-2 w-full">
          {canGoBack && (
            <button
              onClick={onGoBack}
              className="flex-1 py-5 bg-orange-50 text-[#ff5d01] font-bold text-lg rounded-[24px] border border-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              ⬅️ 이전
            </button>
          )}
          {canGoForward && (
            <button
              onClick={onGoForward}
              className="flex-1 py-5 bg-orange-50 text-[#ff5d01] font-bold text-lg rounded-[24px] border border-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              다음 ➡️
            </button>
          )}
        </div>
        
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="w-full py-5 bg-slate-800 text-white font-bold text-lg rounded-[24px] shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isDownloading ? (
            <>⏳ 저장 및 집계 중...</>
          ) : (
            <>📄 레시피 PDF로 저장</>
          )}
        </button>

        <button
          onClick={onRegenerate}
          className="w-full py-6 bg-white border-2 border-[#ff5d01] text-[#ff5d01] font-bold text-xl rounded-[24px] shadow-sm active:scale-95 transition-all"
        >
          🔄 다른 레시피 추천받기
        </button>
        <button
          onClick={onReset}
          className="w-full py-6 bg-[#ff5d01] text-white font-bold text-xl rounded-[24px] shadow-xl shadow-orange-200 active:scale-95 transition-all"
        >
          🏠 처음부터 다시하기
        </button>
      </div>

      <div className="text-center py-6 text-slate-300 text-xs font-mono">
         Powered by 퓨전요리연구소
      </div>

      <style>{`
        .recipe-content ol { list-style: none; counter-reset: r-step; padding: 0; display: flex; flex-direction: column; gap: 1.5rem; }
        .recipe-content ol li { counter-increment: r-step; position: relative; padding-left: 3.5rem; font-size: 1.1rem; line-height: 1.6; }
        .recipe-content ol li::before {
          content: counter(r-step);
          position: absolute; left: 0; top: 0;
          width: 2.2rem; height: 2.2rem;
          background: #FFF3ED; color: #ff5d01;
          display: flex; align-items: center; justify-content: center;
          border-radius: 12px; font-weight: 900; font-size: 0.9rem;
        }
        .ingredients-list ul { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr; gap: 0.5rem; }
        .ingredients-list li { display: flex; align-items: center; gap: 0.5rem; background: #f8fafc; padding: 0.8rem 1rem; border-radius: 8px; font-size: 0.95rem; }
        .ingredients-list li::before { content: '•'; color: #ff5d01; font-weight: bold; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default ResultView;
