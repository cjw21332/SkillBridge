import React, { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";
import { Plus, Search, Tag, Sparkles } from "lucide-react";

interface SkillItem {
  id?: string;
  name: string;
  category: string;
}

interface SkillAutocompleteInputProps {
  type: "TEACH" | "LEARN";
  onAddSkill: (skillName: string, category: string) => Promise<void>;
  placeholder?: string;
}

export const SkillAutocompleteInput: React.FC<SkillAutocompleteInputProps> = ({
  type,
  onAddSkill,
  placeholder = "Type to search or add a skill...",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<SkillItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("General");
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search query
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/skills?q=${encodeURIComponent(inputValue.trim())}&limit=8`);
        const data = Array.isArray(res.data) ? res.data : [];
        setSuggestions(data);
        setIsOpen(true);
      } catch (err) {
        console.error("Skill search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = async (skill: SkillItem) => {
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
    await onAddSkill(skill.name, skill.category || "General");
  };

  const handleManualAdd = async () => {
    if (!inputValue.trim()) return;
    const name = inputValue.trim();
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
    await onAddSkill(name, selectedCategory);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && isOpen) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        handleManualAdd();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const isTeach = type === "TEACH";
  const btnColor = isTeach
    ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
    : "bg-[var(--color-accent)] hover:opacity-90 text-white";

  return (
    <div className="relative w-full pt-1" ref={containerRef}>
      {/* Input Group */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          onClick={handleManualAdd}
          disabled={!inputValue.trim()}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs disabled:opacity-40 shrink-0 ${btnColor}`}
          title="Add Skill"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Scrollable Suggestion Dropdown (Theme-Aware: Light & Dark) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
              Suggested Skills
            </span>
            <span>{suggestions.length} found</span>
          </div>

          {/* Scrollable container with max height */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
            {suggestions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                <span>No exact matches found. Press </span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">"Add"</span>
                <span> to create as a custom skill!</span>
              </div>
            ) : (
              suggestions.map((skill, index) => (
                <button
                  key={skill.id || index}
                  type="button"
                  onClick={() => handleSelectSuggestion(skill)}
                  className="w-full px-3.5 py-2 flex items-center justify-between gap-2 text-left hover:bg-blue-50/70 dark:hover:bg-slate-700/60 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-[var(--color-primary)] truncate transition-colors">
                      {skill.name}
                    </span>
                  </div>

                  {skill.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                      {skill.category}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
