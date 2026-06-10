import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, RotateCcw, SkipForward, Sparkles, CheckCircle2, XCircle, Trophy } from "lucide-react";

const LEVELS = ["beginner", "intermediate", "advanced", "expert"];

export default function PuzzleArena() {
  const { refreshUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const level = params.get("level") || "beginner";

  const [puzzle, setPuzzle] = useState(null); // {id, scrambled, length, definition, difficulty, points_reward, category}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // selection state: array of {letter, sourceIndex}
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null); // {correct, answer, definition, points_earned, new_points, next_level_unlocked}
  const [submitting, setSubmitting] = useState(false);

  const fetchPuzzle = useCallback(async (lvl) => {
    setLoading(true);
    setError("");
    setFeedback(null);
    setSelected([]);
    try {
      const { data } = await api.get(`/puzzles/next?level=${lvl}`);
      setPuzzle(data.puzzle);
      if (!data.puzzle) setError(data.message || "No more puzzles in this level.");
    } catch (e) {
      setError(e.response?.data?.detail || "Could not load puzzle.");
      setPuzzle(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPuzzle(level);
  }, [level, fetchPuzzle]);

  const pickLetter = (sourceIndex) => {
    if (feedback?.correct) return;
    if (selected.find((s) => s.sourceIndex === sourceIndex)) return;
    if (!puzzle) return;
    if (selected.length >= puzzle.length) return;
    setSelected((s) => [...s, { letter: puzzle.scrambled[sourceIndex], sourceIndex }]);
  };

  const undoLast = () => {
    if (feedback?.correct) return;
    setSelected((s) => s.slice(0, -1));
  };

  const clearAll = () => {
    if (feedback?.correct) return;
    setSelected([]);
  };

  const submit = async () => {
    if (!puzzle || submitting) return;
    if (selected.length !== puzzle.length) return;
    setSubmitting(true);
    const answer = selected.map((s) => s.letter).join("");
    try {
      const { data } = await api.post("/puzzles/submit", { puzzle_id: puzzle.id, answer });
      setFeedback(data);
      if (data.correct) {
        refreshUser();
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const tryAgain = () => {
    setSelected([]);
    setFeedback(null);
  };

  const changeLevel = (lvl) => {
    setParams({ level: lvl });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-semibold" data-testid="play-back-link">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="flex items-center gap-2">
          {LEVELS.map((lv) => (
            <button
              key={lv}
              onClick={() => changeLevel(lv)}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full transition-all ${
                level === lv
                  ? `tier-dot-${lv} text-white`
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
              data-testid={`tier-switch-${lv}`}
            >
              {lv}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
        {loading && <div className="text-center text-slate-400 overline py-20">Loading puzzle…</div>}

        {!loading && error && (
          <div className="text-center py-12" data-testid="play-no-puzzles">
            <Trophy size={36} className="mx-auto text-amber-500 mb-3" />
            <h2 className="text-xl font-bold mb-2">{error}</h2>
            <p className="text-slate-500 text-sm mb-6">Try a different level or check back later.</p>
            <Link to="/dashboard" className="btn-primary inline-flex">Back to dashboard</Link>
          </div>
        )}

        {!loading && !error && puzzle && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full tier-dot-${puzzle.difficulty}`} />
                <span className={`overline tier-text-${puzzle.difficulty}`}>{puzzle.difficulty}</span>
                {puzzle.category && <span className="text-xs text-slate-400">· {puzzle.category}</span>}
              </div>
              <div className="font-mono font-bold text-emerald-600 text-sm" data-testid="puzzle-reward">+{puzzle.points_reward} pts</div>
            </div>

            {/* Definition */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8" data-testid="puzzle-definition">
              <p className="overline mb-2">Definition</p>
              <p className="text-slate-800 leading-relaxed">{puzzle.definition}</p>
            </div>

            {/* Slots */}
            <div className={`flex flex-wrap gap-2 sm:gap-3 justify-center mb-6 ${feedback && !feedback.correct ? "animate-shake" : ""} ${feedback?.correct ? "animate-pop" : ""}`} data-testid="puzzle-slots">
              {Array.from({ length: puzzle.length }).map((_, i) => {
                const tile = selected[i];
                return (
                  <div key={i} className={`slot-tile ${tile ? "filled" : ""}`}>
                    {tile?.letter || ""}
                  </div>
                );
              })}
            </div>

            {/* Source tiles */}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-8" data-testid="puzzle-tiles">
              {puzzle.scrambled.split("").map((letter, i) => {
                const used = !!selected.find((s) => s.sourceIndex === i);
                return (
                  <button
                    key={i}
                    onClick={() => pickLetter(i)}
                    disabled={used || !!feedback?.correct}
                    className={`anagram-tile ${used ? "is-used" : ""}`}
                    data-testid={`puzzle-tile-${i}`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
              <button
                onClick={undoLast}
                disabled={selected.length === 0 || feedback?.correct}
                className="btn-secondary inline-flex items-center gap-2 text-sm"
                data-testid="puzzle-undo-button"
              >
                <RotateCcw size={14} /> Undo
              </button>
              <button
                onClick={clearAll}
                disabled={selected.length === 0 || feedback?.correct}
                className="btn-secondary inline-flex items-center gap-2 text-sm"
                data-testid="puzzle-clear-button"
              >
                Clear
              </button>
              {!feedback?.correct && (
                <button
                  onClick={submit}
                  disabled={selected.length !== puzzle.length || submitting}
                  className="btn-action inline-flex items-center gap-2"
                  data-testid="puzzle-submit-button"
                >
                  <Sparkles size={16} /> {submitting ? "Checking…" : "Submit Answer"}
                </button>
              )}
              <button
                onClick={() => fetchPuzzle(level)}
                className="btn-secondary inline-flex items-center gap-2 text-sm"
                data-testid="puzzle-skip-button"
              >
                <SkipForward size={14} /> Skip
              </button>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={`mt-6 rounded-xl p-5 border animate-slide-down ${
                feedback.correct
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`} data-testid={`feedback-${feedback.correct ? "correct" : "incorrect"}`}>
                <div className="flex items-start gap-3">
                  {feedback.correct
                    ? <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    : <XCircle size={22} className="text-red-600 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${feedback.correct ? "text-emerald-700" : "text-red-700"}`}>
                      {feedback.correct ? `Correct! +${feedback.points_earned} pts` : "Not quite — try again"}
                    </h3>
                    {feedback.correct && feedback.next_level_unlocked && (
                      <p className="mt-1 text-sm font-semibold text-amber-600">
                        🎉 You unlocked the {feedback.next_level_unlocked} tier!
                      </p>
                    )}
                    <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                      <span className="font-mono font-bold text-slate-900">{feedback.answer}</span> — {feedback.definition}
                    </p>
                    <div className="mt-4 flex gap-2">
                      {feedback.correct ? (
                        <button onClick={() => fetchPuzzle(level)} className="btn-primary text-sm" data-testid="feedback-next-button">
                          Next puzzle →
                        </button>
                      ) : (
                        <>
                          <button onClick={tryAgain} className="btn-primary text-sm" data-testid="feedback-retry-button">
                            Try again
                          </button>
                          <button onClick={() => fetchPuzzle(level)} className="btn-secondary text-sm" data-testid="feedback-skip-button">
                            Skip this one
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
