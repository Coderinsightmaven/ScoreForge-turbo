"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@repo/convex";
import type { Id } from "@repo/convex/dataModel";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, Plus, X, Check, Loader2, AlertCircle } from "lucide-react";
import { getDisplayMessage } from "@/lib/errors";

type Format = "single_elimination" | "double_elimination" | "round_robin";
type ParticipantType = "individual" | "doubles" | "team";
type Gender = "mens" | "womens" | "mixed";

export default function NewTournamentPage(): React.ReactNode {
  const router = useRouter();
  const createTournament = useMutation(api.tournaments.createTournament);
  const updateBracket = useMutation(api.tournamentBrackets.updateBracket);

  // Phase tracking
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  // Phase 1: Tournament fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courts, setCourts] = useState<string[]>([]);
  const [newCourt, setNewCourt] = useState("");
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [tournamentError, setTournamentError] = useState("");

  // Phase 2: Bracket fields
  const [bracketName, setBracketName] = useState("Main Draw");
  const [format, setFormat] = useState<Format>("single_elimination");
  const [participantType, setParticipantType] = useState<ParticipantType>("individual");
  const [gender, setGender] = useState<Gender | "">("");
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [tennisIsAdScoring, setTennisIsAdScoring] = useState(true);
  const [tennisSetsToWin, setTennisSetsToWin] = useState(2);
  const [isSavingBracket, setIsSavingBracket] = useState(false);
  const [bracketError, setBracketError] = useState("");

  // Fetch brackets once tournament is created to get the auto-created bracket ID
  const brackets = useQuery(
    api.tournamentBrackets.listBrackets,
    tournamentId ? { tournamentId: tournamentId as Id<"tournaments"> } : "skip"
  );
  const firstBracket = brackets?.[0];

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setTournamentError("");

    if (!name.trim()) {
      setTournamentError("Tournament name is required.");
      return;
    }
    if (courts.length === 0) {
      setTournamentError("Select at least one court.");
      return;
    }

    setIsCreatingTournament(true);
    try {
      const normalizedCourts = [...new Set(courts.map((c) => c.trim()).filter(Boolean))];
      const id = await createTournament({
        name,
        description: description || undefined,
        sport: "tennis",
        format: "single_elimination",
        participantType: "individual",
        maxParticipants: 8,
        tennisConfig: { isAdScoring: true, setsToWin: 2 },
        courts: normalizedCourts,
      });
      setTournamentId(id);
    } catch (err) {
      setTournamentError(getDisplayMessage(err));
      setIsCreatingTournament(false);
    }
  };

  const handleSaveBracket = async (e: React.FormEvent) => {
    e.preventDefault();
    setBracketError("");

    if (!firstBracket) {
      setBracketError("Bracket not found. Please try again.");
      return;
    }

    setIsSavingBracket(true);
    try {
      await updateBracket({
        bracketId: firstBracket._id,
        name: bracketName.trim() || "Main Draw",
        format,
        participantType,
        gender: gender || undefined,
        maxParticipants,
        tennisConfig: {
          isAdScoring: tennisIsAdScoring,
          setsToWin: tennisSetsToWin,
        },
      });
      router.push(`/tournaments/${tournamentId}`);
    } catch (err) {
      setBracketError(getDisplayMessage(err));
      setIsSavingBracket(false);
    }
  };

  // ---- Phase 2: Bracket Configuration ----
  if (tournamentId) {
    return (
      <div className="min-h-screen py-6">
        <div className="container-narrow space-y-8">
          <section className="surface-panel surface-panel-rail p-6">
            <div className="inline-flex items-center gap-2 text-small text-brand mb-4">
              <Check className="w-4 h-4" />
              Tournament created
            </div>
            <h1 className="text-title text-foreground mb-2">Configure Your First Bracket</h1>
            <p className="text-body text-muted-foreground">
              Set up the format, participant type, and rules for your bracket.
            </p>
          </section>

          {bracketError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{bracketError}</AlertDescription>
            </Alert>
          )}

          {!firstBracket ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSaveBracket} className="space-y-6">
              {/* Bracket Name */}
              <Card>
                <CardHeader>
                  <CardTitle>Bracket Name</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="text"
                    value={bracketName}
                    onChange={(e) => setBracketName(e.target.value)}
                    placeholder="e.g. Main Draw, Men's Singles"
                  />
                </CardContent>
              </Card>

              {/* Format */}
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Format</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {[
                      {
                        value: "single_elimination",
                        label: "Single Elimination",
                        desc: "One loss and you're out",
                      },
                      {
                        value: "double_elimination",
                        label: "Double Elimination",
                        desc: "Two losses to eliminate",
                      },
                      {
                        value: "round_robin",
                        label: "Round Robin",
                        desc: "Everyone plays everyone",
                      },
                    ].map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFormat(f.value as Format)}
                        className={`p-4 text-left border-2 rounded-xl transition-all ${
                          format === f.value
                            ? "border-brand bg-brand-light dark:bg-brand/20"
                            : "border-border bg-secondary hover:border-muted-foreground"
                        }`}
                      >
                        <span
                          className={`block font-semibold ${
                            format === f.value ? "text-brand dark:text-brand" : "text-foreground"
                          }`}
                        >
                          {f.label}
                        </span>
                        <span
                          className={`block text-small mt-1 ${
                            format === f.value
                              ? "text-brand-hover/70 dark:text-brand/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {f.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Participant Type & Gender */}
              <Card>
                <CardHeader>
                  <CardTitle>Participant Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[
                      { value: "individual", label: "Individual", desc: "Singles" },
                      { value: "doubles", label: "Doubles", desc: "Pairs" },
                      { value: "team", label: "Team", desc: "Teams" },
                    ].map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setParticipantType(p.value as ParticipantType)}
                        className={`p-4 text-center border-2 rounded-xl transition-all ${
                          participantType === p.value
                            ? "border-brand bg-brand-light dark:bg-brand/20"
                            : "border-border bg-secondary hover:border-muted-foreground"
                        }`}
                      >
                        <span
                          className={`block font-semibold ${
                            participantType === p.value
                              ? "text-brand dark:text-brand"
                              : "text-foreground"
                          }`}
                        >
                          {p.label}
                        </span>
                        <span
                          className={`block text-small mt-1 ${
                            participantType === p.value
                              ? "text-brand-hover/70 dark:text-brand/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {p.desc}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Gender Category */}
                  <div className="space-y-2">
                    <Label>Gender Category</Label>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                      {[
                        { value: "", label: "Not Set" },
                        { value: "mens", label: "Men's" },
                        { value: "womens", label: "Women's" },
                        { value: "mixed", label: "Mixed" },
                      ].map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setGender(g.value as Gender | "")}
                          className={`px-4 py-2.5 text-center border-2 rounded-xl text-sm font-medium transition-all ${
                            gender === g.value
                              ? "border-brand bg-brand-light dark:bg-brand/20 text-brand"
                              : "border-border bg-secondary hover:border-muted-foreground text-foreground"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-small text-muted-foreground">
                      Filters the player database when importing players
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Max Participants */}
              <Card>
                <CardHeader>
                  <CardTitle>Maximum Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[4, 8, 16, 32, 64].map((n) => (
                      <Button
                        key={n}
                        type="button"
                        onClick={() => setMaxParticipants(n)}
                        variant={maxParticipants === n ? "brand" : "outline"}
                        className="px-5"
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Or enter a custom number:</Label>
                    <Input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(Math.max(2, Number(e.target.value)))}
                      min={2}
                      max={256}
                      className="w-32"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tennis Rules */}
              <Card>
                <CardHeader>
                  <CardTitle>Tennis Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Scoring mode</Label>
                      <select
                        value={tennisIsAdScoring ? "advantage" : "no-ad"}
                        onChange={(e) => setTennisIsAdScoring(e.target.value === "advantage")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="advantage">Advantage scoring</option>
                        <option value="no-ad">No-Ad scoring</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Match format</Label>
                      <select
                        value={tennisSetsToWin}
                        onChange={(e) => setTennisSetsToWin(Number(e.target.value))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value={2}>Best of 3</option>
                        <option value={3}>Best of 5</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" disabled={isSavingBracket} variant="brand">
                  {isSavingBracket ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Save Bracket &amp; Continue
                    </>
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => router.push(`/tournaments/${tournamentId}`)}
                  className="text-body text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ---- Phase 1: Create Tournament ----
  return (
    <div className="min-h-screen py-6">
      <div className="container-narrow space-y-8">
        <section className="surface-panel surface-panel-rail p-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-small text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <h1 className="text-title text-foreground mb-2">Create Tournament</h1>
          <p className="text-body text-muted-foreground">
            Name your tournament and set up your courts.
          </p>
        </section>

        {tournamentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{tournamentError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleCreateTournament} className="space-y-6">
          {/* Tournament Name & Description */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Summer Championship 2026"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional description..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Courts */}
          <Card>
            <CardHeader>
              <CardTitle>Courts</CardTitle>
              <p className="text-small text-muted-foreground">
                Select one or more courts for scheduling matches
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Label className="mb-3 block">Quick select</Label>
                <div className="flex flex-wrap gap-2">
                  {["Stadium", "Grandstand", "Court 1", "Court 2", "Court 3", "Court 4"].map(
                    (court) => (
                      <Button
                        key={court}
                        type="button"
                        onClick={() => {
                          if (courts.includes(court)) {
                            setCourts(courts.filter((c) => c !== court));
                          } else {
                            setCourts([...courts, court]);
                          }
                        }}
                        variant={courts.includes(court) ? "brand" : "outline"}
                        size="sm"
                      >
                        {courts.includes(court) && <Check className="w-4 h-4 mr-1" />}
                        {court}
                      </Button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Add custom</Label>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Input
                    type="text"
                    value={newCourt}
                    onChange={(e) => setNewCourt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newCourt.trim() && !courts.includes(newCourt.trim())) {
                          setCourts([...courts, newCourt.trim()]);
                          setNewCourt("");
                        }
                      }
                    }}
                    placeholder="e.g. Center Court"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newCourt.trim() && !courts.includes(newCourt.trim())) {
                        setCourts([...courts, newCourt.trim()]);
                        setNewCourt("");
                      }
                    }}
                    disabled={!newCourt.trim() || courts.includes(newCourt.trim())}
                    variant="brand"
                    className="md:w-auto"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {courts.length > 0 && (
                <div className="mt-4 p-4 bg-secondary rounded-xl">
                  <p className="text-small text-muted-foreground mb-2">
                    {courts.length} court{courts.length !== 1 ? "s" : ""} selected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {courts.map((court, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg"
                      >
                        <span className="text-small text-foreground">{court}</span>
                        <button
                          type="button"
                          onClick={() => setCourts(courts.filter((_, i) => i !== index))}
                          className="text-muted-foreground hover:text-error transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {courts.length === 0 && (
                <p className="mt-4 text-small text-destructive">At least one court is required.</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="submit"
              disabled={isCreatingTournament || !name.trim() || courts.length === 0}
              variant="brand"
            >
              {isCreatingTournament ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Tournament
                </>
              )}
            </Button>
            <Link
              href="/dashboard"
              className="text-body text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
