"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex";
import type { Id } from "@repo/convex/dataModel";
import { useState, useRef, useEffect } from "react";
import { Skeleton } from "./Skeleton";
import { toast } from "sonner";
import type { TournamentFormat, ParticipantType } from "@/app/lib/constants";

type Bracket = {
  _id: string;
  name: string;
  status: "draft" | "active" | "completed";
  participantCount: number;
  matchCount: number;
};

type BracketSelectorProps = {
  tournamentId: string;
  selectedBracketId: string | null;
  onSelectBracket: (bracketId: string) => void;
  showAddButton?: boolean;
};

export function BracketSelector({
  tournamentId,
  selectedBracketId,
  onSelectBracket,
  showAddButton,
}: BracketSelectorProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const createFormRef = useRef<HTMLDivElement>(null);
  const createBracket = useMutation(api.tournamentBrackets.createBracket);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newFormat, setNewFormat] = useState<TournamentFormat | "">("");
  const [newParticipantType, setNewParticipantType] = useState<ParticipantType | "">("");
  const [newGender, setNewGender] = useState<"mens" | "womens" | "mixed" | "">("");
  const [newMaxParticipants, setNewMaxParticipants] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brackets = useQuery(api.tournamentBrackets.listBrackets, {
    tournamentId: tournamentId as Id<"tournaments">,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (createFormRef.current && !createFormRef.current.contains(event.target as Node)) {
        setShowCreateForm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-select first bracket if none selected
  useEffect(() => {
    const firstBracket = brackets?.[0];
    if (firstBracket && !selectedBracketId) {
      onSelectBracket(firstBracket._id);
    }
  }, [brackets, selectedBracketId, onSelectBracket]);

  if (brackets === undefined) {
    return (
      <div className="surface-panel p-3">
        <div className="flex items-center gap-3 px-3">
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
    );
  }

  const resetCreateForm = () => {
    setNewName("");
    setNewFormat("");
    setNewParticipantType("");
    setNewGender("");
    setNewMaxParticipants("");
    setShowCreateForm(false);
  };

  const handleCreateBracket = async () => {
    if (!newName.trim()) return;
    const parsedMax = parseInt(newMaxParticipants, 10);
    if (!parsedMax || parsedMax < 2 || parsedMax > 256) {
      toast.error("Participant count must be between 2 and 256");
      return;
    }
    setIsSubmitting(true);
    try {
      const id = await createBracket({
        tournamentId: tournamentId as Id<"tournaments">,
        name: newName.trim(),
        format: newFormat || undefined,
        participantType: newParticipantType || undefined,
        gender: newGender || undefined,
        maxParticipants: parsedMax,
      });
      onSelectBracket(id);
      resetCreateForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create bracket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createFormPopover = showCreateForm && (
    <div
      ref={createFormRef}
      className="absolute top-full right-0 mt-2 w-80 bg-bg-card border border-border rounded-xl shadow-xl z-50 p-4"
    >
      <h3 className="text-sm font-semibold text-text-primary mb-3">New Bracket</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Men's Singles"
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary placeholder:text-text-muted"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Format</label>
          <select
            value={newFormat}
            onChange={(e) => setNewFormat(e.target.value as TournamentFormat | "")}
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
          >
            <option value="">Use tournament default</option>
            <option value="single_elimination">Single Elimination</option>
            <option value="double_elimination">Double Elimination</option>
            <option value="round_robin">Round Robin</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Participant Type
          </label>
          <select
            value={newParticipantType}
            onChange={(e) => {
              const val = e.target.value as ParticipantType | "";
              setNewParticipantType(val);
              if (val !== "doubles" && val !== "team" && newGender === "mixed") {
                setNewGender("");
              }
            }}
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
          >
            <option value="">Use tournament default</option>
            <option value="individual">Individual</option>
            <option value="doubles">Doubles</option>
            <option value="team">Team</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Gender Category <span className="text-error">*</span>
          </label>
          <select
            value={newGender}
            onChange={(e) => setNewGender(e.target.value as "mens" | "womens" | "mixed" | "")}
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary"
          >
            <option value="">Select...</option>
            <option value="mens">Men&apos;s</option>
            <option value="womens">Women&apos;s</option>
            {(newParticipantType === "doubles" || newParticipantType === "team") && (
              <option value="mixed">Mixed</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Participant Count <span className="text-error">*</span>
          </label>
          <input
            type="number"
            min="2"
            max="256"
            value={newMaxParticipants}
            onChange={(e) => setNewMaxParticipants(e.target.value)}
            placeholder="e.g., 8, 16, 32"
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-brand text-text-primary placeholder:text-text-muted"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleCreateBracket}
          disabled={!newName.trim() || !newMaxParticipants || !newGender || isSubmitting}
          className="flex-1 px-3 py-2 text-sm font-medium bg-brand text-black rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create"}
        </button>
        <button
          onClick={resetCreateForm}
          className="px-3 py-2 text-sm font-medium bg-bg-secondary border border-border rounded-lg text-text-primary hover:bg-bg-tertiary transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  if (brackets.length === 0) {
    if (showAddButton) {
      return (
        <div className="surface-panel p-3">
          <div className="relative flex items-center justify-between px-3">
            <span className="text-sm text-text-muted">No brackets configured</span>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3 py-1.5 text-xs font-medium text-brand bg-brand/10 border border-brand/30 rounded-lg hover:bg-brand hover:text-text-inverse transition-all"
            >
              Add Bracket
            </button>
            {createFormPopover}
          </div>
        </div>
      );
    }
    return null;
  }

  // Find the selected bracket, or use the first one as fallback
  const selectedBracket = selectedBracketId
    ? brackets.find((b: Bracket) => b._id === selectedBracketId)
    : brackets[0];

  // Don't show selector if only one bracket exists
  if (brackets.length === 1 && !showAddButton) {
    return null;
  }

  const statusIndicator = (status: Bracket["status"]) => {
    switch (status) {
      case "active":
        return <span className="w-2 h-2 bg-success rounded-full animate-pulse" />;
      case "completed":
        return <span className="w-2 h-2 bg-gold rounded-full" />;
      default:
        return <span className="w-2 h-2 bg-text-muted/30 rounded-full" />;
    }
  };

  const handleSelect = (bracketId: string) => {
    onSelectBracket(bracketId);
    setIsOpen(false);
  };

  return (
    <div className="surface-panel p-3">
      <div className="flex items-center gap-3 px-3">
        {/* Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-border rounded-xl hover:border-text-muted transition-all min-w-[200px]"
          >
            <div className="flex items-center gap-2 flex-1">
              {selectedBracket && (
                <>
                  {statusIndicator(selectedBracket.status)}
                  <span className="text-sm font-medium text-text-primary">
                    {selectedBracket.name}
                  </span>
                  <span className="text-xs text-text-muted">
                    ({selectedBracket.participantCount})
                  </span>
                </>
              )}
            </div>
            <svg
              className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              {/* Brackets list */}
              {brackets.map((bracket: Bracket, index: number) => (
                <button
                  key={bracket._id}
                  onClick={() => handleSelect(bracket._id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    selectedBracketId === bracket._id
                      ? "bg-brand/10 text-brand"
                      : "hover:bg-bg-secondary text-text-primary"
                  } ${index < brackets.length - 1 ? "border-b border-border/50" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {statusIndicator(bracket.status)}
                    <span className="text-sm font-medium">{bracket.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">
                      {bracket.participantCount} participants
                    </span>
                    {selectedBracketId === bracket._id && (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add bracket button */}
        {showAddButton && (
          <div className="relative">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center justify-center w-9 h-9 text-text-muted hover:text-brand border border-transparent hover:border-brand/30 hover:bg-brand/10 rounded-xl transition-all"
              title="Add bracket"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {createFormPopover}
          </div>
        )}
      </div>
    </div>
  );
}
