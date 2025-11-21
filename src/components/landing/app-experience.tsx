"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, Keyboard, TrophyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { TypingWorkspace } from "@/modules/typing/components/typing-workspace";

const highlights = [
	{
		title: "Arcade precision",
		description: "Every keystroke is scored instantly with uncompromising accuracy.",
	},
	{
		title: "Reactive telemetry",
		description: "Track live WPM, raw speed, accuracy, and consistency like an esports HUD.",
	},
	{
		title: "Live leaderboards",
		description: "Preview the fastest runs and expand the board to scout the competition.",
	},
];

type LeaderboardEntry = {
	userId: string;
	name: string;
	wpm: number;
	recordedAt: number;
};

type WelcomeScreenProps = {
	onBegin: () => void;
};

const LEADERBOARD_REFRESH_INTERVAL = 30_000;

const WelcomeScreen = ({ onBegin }: WelcomeScreenProps) => {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				onBegin();
			}
		};

		window.addEventListener("keydown", handleKeydown);
		return () => window.removeEventListener("keydown", handleKeydown);
	}, [onBegin]);

	useEffect(() => {
		let isActive = true;

		const loadLeaderboard = async (options?: { silent?: boolean }) => {
			if (!isActive) {
				return;
			}

			if (!options?.silent) {
				setLoading(true);
			}

			setError(null);

			try {
				const response = await fetch("/api/typing/leaderboard?duration=60", { credentials: "include" });

				if (!response.ok) {
					throw new Error("Failed to fetch leaderboard.");
				}

				const data: { leaderboard: LeaderboardEntry[] } = await response.json();

				if (!isActive) {
					return;
				}

				setLeaderboard(data.leaderboard);
			} catch (err) {
				if (!isActive) {
					return;
				}

				const message = err instanceof Error ? err.message : "Unable to load leaderboard.";
				setError(message);
				setLeaderboard([]);
			} finally {
				if (!isActive) {
					return;
				}

				setLoading(false);
			}
		};

		void loadLeaderboard();
		const intervalId = window.setInterval(() => {
			void loadLeaderboard({ silent: true });
		}, LEADERBOARD_REFRESH_INTERVAL);

		return () => {
			isActive = false;
			window.clearInterval(intervalId);
		};
	}, []);

	const topFive = useMemo(() => leaderboard.slice(0, 5), [leaderboard]);
	const topTwenty = useMemo(() => leaderboard.slice(0, 20), [leaderboard]);

	return (
		<div className="flex min-h-dvh flex-col items-center bg-background px-6 py-8 text-foreground">
			<header className="flex w-full max-w-5xl items-center justify-between rounded-[2.5rem] border border-foreground/15 bg-card/70 px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] shadow-xl backdrop-blur">
				<span className="font-arcade text-sm uppercase text-foreground">WPMHero</span>
				<div className="flex items-center gap-3 text-muted-foreground">
					<span className="hidden sm:inline">Arcade typing simulator</span>
					<ThemeToggle />
				</div>
			</header>

			<main className="flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 py-6">
				<div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
					<section className="flex flex-col gap-8 text-center lg:text-left">
						<div className="space-y-4">
							<p className="font-arcade text-xs uppercase text-muted-foreground">Arcade typing simulator</p>
							<h1 className="font-arcade text-4xl leading-tight tracking-[0.25em] sm:text-5xl">WPMHERO</h1>
							<p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:mx-0 sm:text-base">
								Inspired by Monkeytype, rebuilt for obsessive typists. Smash high scores, fine-tune cadence, and keep AI-ranked
								analytics all inside a minimalist black-and-white arena.
							</p>
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							{highlights.map((highlight) => (
								<div
									key={highlight.title}
									className="rounded-2xl border border-foreground/15 bg-card/80 p-4 text-left shadow-lg backdrop-blur"
								>
									<p className="font-arcade text-[0.65rem] uppercase text-muted-foreground">{highlight.title}</p>
									<p className="mt-3 text-xs leading-6 text-foreground/80 sm:text-sm">{highlight.description}</p>
								</div>
							))}
						</div>
					</section>

					<aside className="flex flex-col gap-5">
						<div className="rounded-3xl border border-foreground/15 bg-card/80 p-5 text-left shadow-xl backdrop-blur">
							<p className="font-arcade text-xs uppercase text-muted-foreground">Meet the developer</p>
							<p className="mt-3 text-xs leading-6 text-muted-foreground sm:text-sm">
								Follow the build, study the internals, and leave a star to keep WPMHero evolving.
							</p>
							<a
								href="https://github.com/neeer4j/WPMHero"
								target="_blank"
								rel="noreferrer"
								className="mt-4 inline-flex items-center gap-2 rounded-full border border-foreground/25 px-4 py-2 text-[0.65rem] uppercase tracking-[0.28em] text-foreground transition hover:border-foreground hover:bg-foreground hover:text-background"
							>
								GitHub
								<ArrowRight className="h-3 w-3" />
							</a>
						</div>

						<div className="rounded-3xl border border-foreground/15 bg-background/60 p-5 text-left shadow-inner">
							<p className="font-arcade text-[0.65rem] uppercase text-muted-foreground">Arcade briefing</p>
							<ul className="mt-4 space-y-3 text-xs text-muted-foreground">
								<li className="flex items-start gap-3">
									<Keyboard className="mt-0.5 h-4 w-4 text-foreground/60" />
									<span>Hit Enter or Space to jump straight into the typing arena.</span>
								</li>
								<li className="flex items-start gap-3">
									<TrophyIcon className="mt-0.5 h-4 w-4 text-foreground/60" />
									<span>Authenticate to log every run, compare personal records, and climb leaderboards.</span>
								</li>
							</ul>
						</div>

						<div className="rounded-3xl border border-foreground/15 bg-card/80 p-5 text-left shadow-xl backdrop-blur">
							<div className="flex items-center justify-between">
								<p className="font-arcade text-xs uppercase text-muted-foreground">Top 60s leaderboard</p>
								<Dialog>
									<DialogTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="rounded-full border border-foreground/15 bg-background/70 px-3 text-[0.65rem] uppercase tracking-[0.28em]"
										>
											View all
										</Button>
									</DialogTrigger>
									<DialogContent className="sm:max-w-lg border-foreground/15 bg-card/95">
										<DialogHeader>
											<DialogTitle className="font-arcade text-sm uppercase tracking-[0.3em] text-muted-foreground">
												WPMHero leaderboard · 60s
											</DialogTitle>
										</DialogHeader>
										<div className="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl border border-foreground/10 bg-background/70">
											<table className="w-full text-left text-xs uppercase tracking-[0.25em] text-muted-foreground">
												<thead className="sticky top-0 bg-background/95 text-[0.6rem]">
													<tr>
														<th className="px-4 py-3">Rank</th>
														<th className="px-4 py-3">Name</th>
														<th className="px-4 py-3 text-right">WPM</th>
													</tr>
												</thead>
												<tbody>
													{topTwenty.length === 0 ? (
														<tr>
															<td colSpan={3} className="px-4 py-6 text-center text-[0.6rem]">
																{loading ? "Loading..." : error ?? "No leaderboard data yet."}
															</td>
														</tr>
													) : (
														topTwenty.map((entry, index) => (
															<tr key={`${entry.userId}-${entry.recordedAt}`} className="border-t border-foreground/5 text-[0.6rem]">
																<td className="px-4 py-3 text-foreground/80">#{index + 1}</td>
																<td className="px-4 py-3 text-foreground">{entry.name}</td>
																<td className="px-4 py-3 text-right text-foreground">{entry.wpm}</td>
															</tr>
														))
													)}
												</tbody>
											</table>
										</div>
									</DialogContent>
								</Dialog>
							</div>

							<div className="mt-4 space-y-2">
								{loading ? (
									<div className="text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">Loading leaderboard…</div>
								) : topFive.length === 0 ? (
									<div className="text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">
										{error ?? "No runs recorded yet."}
									</div>
								) : (
									<ul className="space-y-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
										{topFive.map((entry, index) => (
											<li
												key={`${entry.userId}-${entry.recordedAt}`}
												className="flex items-center justify-between rounded-2xl border border-foreground/10 bg-background/70 px-4 py-2 text-[0.65rem]"
											>
												<span className="flex items-center gap-3 text-foreground">
													<span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-foreground/20 text-[0.65rem] font-semibold">
														{index + 1}
													</span>
													<span>{entry.name}</span>
												</span>
												<span className="flex items-center gap-2 text-foreground">
													<Award className="h-3 w-3" />
													{entry.wpm}
												</span>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>
					</aside>
				</div>

				<div className="flex flex-col items-center gap-3">
					<Button
						onClick={onBegin}
						className="font-arcade flex items-center gap-3 rounded-full border border-foreground/30 bg-foreground px-7 py-3 text-background transition hover:scale-[1.03]"
					>
						Enter typing test
						<ArrowRight className="h-4 w-4" />
					</Button>
					<p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">Press Enter to start · Esc to return here</p>
				</div>
			</main>
		</div>
	);
};

type AppExperienceProps = {
	isAuthenticated: boolean;
	userEmail: string | null;
	userName: string | null;
};

export const AppExperience = ({ isAuthenticated, userEmail, userName }: AppExperienceProps) => {
	const [stage, setStage] = useState<"welcome" | "typing">("welcome");

	useEffect(() => {
		if (!isAuthenticated) {
			queueMicrotask(() => setStage("welcome"));
		}
	}, [isAuthenticated]);

	return stage === "welcome" ? (
		<WelcomeScreen onBegin={() => setStage("typing")} />
	) : (
		<TypingWorkspace
			isAuthenticated={isAuthenticated}
			userEmail={userEmail}
			userName={userName}
			onExit={() => setStage("welcome")}
			onSignOut={() => setStage("welcome")}
		/>
	);
};

