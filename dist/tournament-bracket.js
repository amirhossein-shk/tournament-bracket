(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define([], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.tournamentBracket = factory());
})(this, function() {
	//#region src/tournament-bracket.js
	function tournamentBracket(userConfig = {}) {
		const DEFAULT_PLAYER = {
			name: "-",
			avatarUrl: "",
			score: "-"
		};
		const DEFAULT_CONFIG = {
			targetId: "tournament-bracket",
			rounds: null,
			distance: 42,
			width: 196,
			matchHeight: 94,
			roundGap: 96,
			avatarFallbackUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
              <rect width="100%" height="100%" fill="#e5e7eb"/>
              <text x="50%" y="54%" text-anchor="middle" font-size="28" fill="#6b7280">?</text>
            </svg>
          `),
			connectorColor: "white",
			onMatchClick: null,
			onMatchUpdate: null,
			onMatchFinish: null
		};
		function normalizeConfig(userConfig) {
			return {
				...DEFAULT_CONFIG,
				...userConfig,
				rounds: userConfig.rounds ?? []
			};
		}
		const config = normalizeConfig(userConfig);
		let bracketState = null;
		function validateRoundsShape(rounds) {
			if (!Array.isArray(rounds) || rounds.length === 0) throw new Error("rounds must be a non-empty array.");
			rounds.forEach((round, roundIndex) => {
				if (!round || typeof round !== "object") throw new Error(`Round at index ${roundIndex} must be an object.`);
				if (!Array.isArray(round.matches)) throw new Error(`rounds[${roundIndex}].matches must be an array.`);
				if (round.matches.length === 0) throw new Error(`rounds[${roundIndex}].matches must not be empty.`);
				round.matches.forEach((match, matchIndex) => {
					if (!match || typeof match !== "object") throw new Error(`rounds[${roundIndex}].matches[${matchIndex}] must be an object.`);
					if (!Array.isArray(match.players)) throw new Error(`rounds[${roundIndex}].matches[${matchIndex}].players must be an array.`);
					if (match.players.length !== 2) throw new Error(`rounds[${roundIndex}].matches[${matchIndex}] must have exactly 2 players.`);
				});
			});
			const firstRoundMatchesCount = rounds[0].matches.length;
			if (!isPowerOfTwo(firstRoundMatchesCount)) throw new Error("First round matches count must be a power of two.");
			for (let i = 1; i < rounds.length; i++) {
				const expectedMatchesCount = rounds[i - 1].matches.length / 2;
				const actualMatchesCount = rounds[i].matches.length;
				if (actualMatchesCount !== expectedMatchesCount) throw new Error(`Invalid bracket shape: rounds[${i}] must have ${expectedMatchesCount} matches, but got ${actualMatchesCount}.`);
			}
			if (rounds[rounds.length - 1].matches.length !== 1) throw new Error("Last round must have exactly 1 match.");
		}
		function validateConfig() {
			const container = document.getElementById(config.targetId);
			if (!container) throw new Error(`Element with id "${config.targetId}" not found`);
			validateRoundsShape(config.rounds);
			return container;
		}
		function isPowerOfTwo(number) {
			return number > 0 && (number & number - 1) === 0;
		}
		function createId(prefix) {
			if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
			return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
		}
		function createEmptyPlayer() {
			return { ...DEFAULT_PLAYER };
		}
		function normalizeMatch(match) {
			const isFinished = typeof match.isFinished === "boolean" ? match.isFinished : match.status === "completed";
			return {
				matchId: match.matchId || createId("match"),
				status: match.status || (isFinished ? "completed" : "pending"),
				isFinished,
				players: [{
					...DEFAULT_PLAYER,
					...match.players?.[0]
				}, {
					...DEFAULT_PLAYER,
					...match.players?.[1]
				}]
			};
		}
		function mergeMatchData(currentMatch, nextMatchData) {
			const nextPlayers = nextMatchData.players || [];
			return normalizeMatch({
				...currentMatch,
				...nextMatchData,
				players: [{
					...currentMatch.players?.[0],
					...nextPlayers[0]
				}, {
					...currentMatch.players?.[1],
					...nextPlayers[1]
				}]
			});
		}
		function buildBracketModel(rounds) {
			return { rounds: rounds.map((round, roundIndex) => {
				const matches = round.matches.map((match, matchIndex) => {
					const normalized = normalizeMatch(match);
					normalized.roundIndex = roundIndex;
					normalized.matchIndex = matchIndex;
					return normalized;
				});
				return {
					roundId: round.roundId || createId("round"),
					name: round.name || `Round ${roundIndex + 1}`,
					roundIndex,
					matches
				};
			}) };
		}
		function isPendingScore(score) {
			return score === "-" || score === "" || score === null || score === void 0;
		}
		function getMatchState(match) {
			const [firstPlayer, secondPlayer] = match.players;
			const firstScorePending = isPendingScore(firstPlayer.score);
			const secondScorePending = isPendingScore(secondPlayer.score);
			if (firstScorePending && secondScorePending) return {
				status: "pending",
				winnerIndexes: []
			};
			const firstScore = Number(firstPlayer.score);
			const secondScore = Number(secondPlayer.score);
			if (Number.isNaN(firstScore) || Number.isNaN(secondScore)) return {
				status: "invalid-score",
				winnerIndexes: []
			};
			if (firstScore === secondScore) return {
				status: "draw",
				winnerIndexes: []
			};
			if (!match.isFinished) return {
				status: "in-progress",
				winnerIndexes: []
			};
			return {
				status: "completed",
				winnerIndexes: [firstScore > secondScore ? 0 : 1]
			};
		}
		function getPlayerIdentity(player = {}) {
			return player.id || player.name || "";
		}
		function createAdvancedPlayer(winner, currentTargetPlayer = {}, previousMatchId) {
			const winnerIdentity = getPlayerIdentity(winner);
			const currentIdentity = getPlayerIdentity(currentTargetPlayer);
			const isSamePlayer = winnerIdentity && currentIdentity && winnerIdentity === currentIdentity;
			return {
				name: winner.name ?? "",
				avatarUrl: winner.avatarUrl ?? "",
				seed: winner.seed,
				id: winner.id,
				score: isSamePlayer ? currentTargetPlayer.score ?? "-" : "-",
				previousMatchId
			};
		}
		function propagateWinner(roundIndex, matchIndex) {
			const match = bracketState.rounds[roundIndex]?.matches?.[matchIndex];
			if (!match) return;
			const matchState = getMatchState(match);
			const nextRound = bracketState.rounds[roundIndex + 1];
			if (!nextRound) return;
			const nextMatchIndex = Math.floor(matchIndex / 2);
			const nextMatch = nextRound.matches[nextMatchIndex];
			if (!nextMatch) return;
			const playerIndex = matchIndex % 2;
			const winner = matchState.status === "completed" ? match.players[matchState.winnerIndexes[0]] : null;
			if (!winner) nextMatch.players[playerIndex] = createEmptyPlayer();
			else nextMatch.players[playerIndex] = createAdvancedPlayer(winner, nextMatch.players[playerIndex], match.matchId);
		}
		function resolveBracket() {
			for (let roundIndex = 0; roundIndex < bracketState.rounds.length - 1; roundIndex++) bracketState.rounds[roundIndex].matches.forEach((match, matchIndex) => {
				propagateWinner(roundIndex, matchIndex);
			});
		}
		function createBracketLayout(bracket) {
			const roundWidth = config.width;
			const roundGap = config.roundGap;
			const matchHeight = config.matchHeight;
			const matchGap = config.distance;
			const rounds = bracket.rounds.map((round, roundIndex) => {
				const x = roundIndex * (roundWidth + roundGap);
				return {
					...round,
					x,
					matches: round.matches.map((match, matchIndex) => ({
						...match,
						x,
						y: matchIndex * (matchHeight + matchGap),
						width: roundWidth,
						height: matchHeight
					}))
				};
			});
			for (let roundIndex = 1; roundIndex < rounds.length; roundIndex++) {
				const previousRound = rounds[roundIndex - 1];
				const currentRound = rounds[roundIndex];
				currentRound.matches = currentRound.matches.map((match, matchIndex) => {
					const firstSourceMatch = previousRound.matches[matchIndex * 2];
					const secondSourceMatch = previousRound.matches[matchIndex * 2 + 1];
					const y = (getMatchCenterY(firstSourceMatch) + getMatchCenterY(secondSourceMatch)) / 2 - matchHeight / 2;
					return {
						...match,
						y
					};
				});
			}
			return {
				rounds,
				connectors: createConnectors(rounds),
				width: calculateLayoutWidth(rounds),
				height: calculateLayoutHeight(rounds)
			};
		}
		function getMatchCenterY(match) {
			return match.y + match.height / 2;
		}
		function createConnectors(rounds) {
			const connectors = [];
			for (let roundIndex = 0; roundIndex < rounds.length - 1; roundIndex++) {
				const currentRound = rounds[roundIndex];
				const nextRound = rounds[roundIndex + 1];
				currentRound.matches.forEach((match, matchIndex) => {
					const targetMatch = nextRound.matches[Math.floor(matchIndex / 2)];
					if (!targetMatch) return;
					connectors.push({
						id: createId("connector"),
						from: {
							x: match.x + match.width,
							y: getMatchCenterY(match)
						},
						to: {
							x: targetMatch.x,
							y: getMatchCenterY(targetMatch)
						}
					});
				});
			}
			return connectors;
		}
		function calculateLayoutWidth(rounds) {
			const lastMatch = rounds[rounds.length - 1].matches[0];
			return lastMatch.x + lastMatch.width;
		}
		function calculateLayoutHeight(rounds) {
			return Math.max(...rounds.flatMap((round) => round.matches.map((match) => match.y + match.height)));
		}
		function clearContainer(container) {
			container.textContent = "";
		}
		function renderBracket(container, layout) {
			clearContainer(container);
			const root = document.createElement("div");
			root.className = "tournament-bracket-container";
			root.style.position = "relative";
			root.style.width = `${layout.width}px`;
			root.style.height = `${layout.height}px`;
			const svg = createSvgLayer(layout);
			root.appendChild(svg);
			layout.rounds.forEach((round) => {
				root.appendChild(createRoundElement(round));
			});
			container.appendChild(root);
		}
		function createSvgLayer(layout) {
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.classList.add("tournament-bracket-connectors");
			svg.setAttribute("width", String(layout.width));
			svg.setAttribute("height", String(layout.height));
			svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
			svg.style.position = "absolute";
			svg.style.inset = "0";
			svg.style.overflow = "visible";
			svg.style.pointerEvents = "none";
			svg.style.zIndex = "0";
			layout.connectors.forEach((connector) => {
				svg.appendChild(createConnectorPath(connector));
			});
			return svg;
		}
		function createConnectorPath(connector) {
			const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
			const middleX = connector.from.x + (connector.to.x - connector.from.x) / 2;
			const d = [
				`M ${connector.from.x} ${connector.from.y}`,
				`H ${middleX}`,
				`V ${connector.to.y}`,
				`H ${connector.to.x}`
			].join(" ");
			path.setAttribute("d", d);
			path.setAttribute("fill", "none");
			path.setAttribute("stroke", config.connectorColor);
			path.setAttribute("stroke-width", "1");
			path.setAttribute("stroke-linejoin", "round");
			path.setAttribute("stroke-linecap", "round");
			path.classList.add("tournament-bracket-connector");
			return path;
		}
		function createRoundElement(round) {
			const element = document.createElement("div");
			element.className = "tournament-bracket-column";
			element.dataset.roundId = round.roundId;
			element.dataset.roundName = round.name;
			element.dataset.roundIndex = String(round.roundIndex);
			element.style.position = "absolute";
			element.style.left = `${round.x}px`;
			element.style.top = "0";
			element.style.width = `${config.width}px`;
			element.style.zIndex = "1";
			round.matches.forEach((match) => {
				element.appendChild(createMatchElement(match));
			});
			return element;
		}
		function createMatchElement(match) {
			const element = document.createElement("div");
			const matchState = getMatchState(match);
			element.id = match.matchId;
			element.className = "match-container";
			element.dataset.matchStatus = matchState.status;
			element.style.position = "absolute";
			element.style.top = `${match.y}px`;
			element.style.left = "0";
			element.style.width = `${match.width}px`;
			element.style.height = `${match.height}px`;
			const vsElement = document.createElement("div");
			vsElement.className = "player-vs";
			vsElement.textContent = "VS";
			element.appendChild(vsElement);
			element.appendChild(createPlayerElement(match.players[0], "tournament-bracket-first-player", matchState.winnerIndexes.includes(0)));
			element.appendChild(createPlayerElement(match.players[1], "tournament-bracket-second-player", matchState.winnerIndexes.includes(1)));
			element.addEventListener("click", () => {
				if (typeof config.onMatchClick === "function") config.onMatchClick(match);
			});
			return element;
		}
		function createPlayerElement(player, className, isWinner) {
			const element = document.createElement("div");
			element.classList.add("tournament-bracket-player", className);
			if (isWinner) element.classList.add("player-winner");
			element.style.minWidth = `${config.width}px`;
			const avatarAndNameContainerElement = document.createElement("div");
			avatarAndNameContainerElement.className = "avatar-and-name-container";
			const avatarElement = document.createElement("img");
			avatarElement.className = "avatar";
			avatarElement.src = player.avatarUrl || config.avatarFallbackUrl;
			avatarElement.alt = player.name || "Player avatar";
			const nameElement = document.createElement("div");
			nameElement.className = "name";
			nameElement.textContent = player.name;
			const scoreElement = document.createElement("div");
			scoreElement.className = "score";
			scoreElement.textContent = player.score;
			avatarAndNameContainerElement.appendChild(avatarElement);
			avatarAndNameContainerElement.appendChild(nameElement);
			element.appendChild(avatarAndNameContainerElement);
			element.appendChild(scoreElement);
			return element;
		}
		function findMatchById(matchId) {
			if (!bracketState) return null;
			for (const round of bracketState.rounds) {
				const foundMatch = round.matches.find((match) => match.matchId === matchId);
				if (foundMatch) return foundMatch;
			}
			return null;
		}
		function init() {
			const container = validateConfig();
			bracketState = buildBracketModel(config.rounds);
			resolveBracket();
			renderBracket(container, createBracketLayout(bracketState));
		}
		function updateMatch(matchId, nextMatchData) {
			if (!bracketState) throw new Error("Tournament bracket is not initialized");
			let updatedRoundIndex = -1;
			let updatedMatchIndex = -1;
			bracketState.rounds = bracketState.rounds.map((round, roundIndex) => ({
				...round,
				matches: round.matches.map((match, matchIndex) => {
					if (match.matchId !== matchId) return match;
					updatedRoundIndex = roundIndex;
					updatedMatchIndex = matchIndex;
					return mergeMatchData(match, {
						...nextMatchData,
						matchId
					});
				})
			}));
			if (updatedRoundIndex === -1 || updatedMatchIndex === -1) throw new Error(`Match with id "${matchId}" not found`);
			resolveBracket();
			renderBracket(validateConfig(), createBracketLayout(bracketState));
			const updatedMatch = findMatchById(matchId);
			if (typeof config.onMatchUpdate === "function" && updatedMatch) config.onMatchUpdate(updatedMatch);
			return updatedMatch;
		}
		function setMatchScore(matchId, score1, score2) {
			return updateMatch(matchId, { players: [{ score: score1 }, { score: score2 }] });
		}
		function finishMatch(matchId, score1, score2) {
			if (!bracketState) throw new Error("Tournament bracket is not initialized");
			const currentMatch = findMatchById(matchId);
			if (!currentMatch) throw new Error(`Match with id "${matchId}" not found`);
			const candidateMatch = mergeMatchData(currentMatch, {
				isFinished: true,
				status: "completed",
				players: [{ score: score1 }, { score: score2 }]
			});
			const matchState = getMatchState(candidateMatch);
			if (matchState.status !== "completed") throw new Error(`Match "${matchId}" cannot be finished because its state is "${matchState.status}".`);
			const updatedMatch = updateMatch(matchId, candidateMatch);
			if (typeof config.onMatchFinish === "function") config.onMatchFinish(updatedMatch);
			return updatedMatch;
		}
		function destroy() {
			const container = document.getElementById(config.targetId);
			if (container) clearContainer(container);
			bracketState = null;
		}
		function getState() {
			if (typeof structuredClone === "function") return structuredClone(bracketState);
			return JSON.parse(JSON.stringify(bracketState));
		}
		return {
			init,
			updateMatch,
			setMatchScore,
			finishMatch,
			destroy,
			getState,
			onMatchClick(fn) {
				config.onMatchClick = fn;
			},
			onMatchUpdate(fn) {
				config.onMatchUpdate = fn;
			},
			onMatchFinish(fn) {
				config.onMatchFinish = fn;
			}
		};
	}
	//#endregion
	//#region src/entry-browser.js
	if (typeof window !== "undefined") window.tournamentBracket = tournamentBracket;
	//#endregion
	return tournamentBracket;
});
