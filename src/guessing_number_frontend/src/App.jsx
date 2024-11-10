import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { guessing_number_backend } from "declarations/guessing_number_backend";
import { canisterId } from "declarations/guessing_number_backend/index";
import { useEffect, useState } from "react";

function App() {
	const [message, setMessage] = useState("");
	const [isGameActive, setIsGameActive] = useState(false);
	const [guess, setGuess] = useState("");
	const [authClient, setAuthClient] = useState(null);
	const [actor, setActor] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		initAuth();
	}, []);

	const initAuth = async () => {
		const client = await AuthClient.create();
		setAuthClient(client);

		if (await client.isAuthenticated()) {
			handleAuthenticated(client);
		}
	};

	async function handleAuthenticated(client) {
		const identity = client.getIdentity();
		const agent = new HttpAgent({ identity });

		if (process.env.DFX_NETWORK !== "ic") {
			await agent.fetchRootKey();
		}

		const newActor = Actor.createActor(guessing_number_backend.factory, {
			agent,
			canisterId,
		});

		setActor(newActor);
		setIsAuthenticated(true);
	}

	const login = async () => {
		if (!authClient) return;

		await new Promise((resolve, reject) => {
			authClient.login({
				identityProvider: "https://identity.ic0.app",
				onSuccess: () => {
					setIsAuthenticated(true);
					resolve(null);
				},
				onError: reject,
			});
		});
	};

	const logout = async () => {
		if (!authClient) return;
		await authClient.logout();
		setIsAuthenticated(false);
		setIsGameActive(false);
		setMessage("");
		setActor(null);
	};

	const startGame = async () => {
		try {
			const response = await guessing_number_backend.startGame();
			setMessage(response);
			setIsGameActive(true);
			setGuess("");
		} catch (error) {
			setMessage("Error starting game: " + error.message);
		}
	};

	const submitGuess = async (e) => {
		e.preventDefault();
		if (!guess || isNaN(guess)) {
			setMessage("Please enter a valid number");
			return;
		}

		try {
			const response = await guessing_number_backend.guess(Number(guess));
			setMessage(response);
			if (response.includes("Congratulations")) {
				setIsGameActive(false);
			}
			setGuess("");
		} catch (error) {
			setMessage("Error submitting guess: " + error.message);
		}
	};

	return (
		<>
			<div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800">
				<header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
					<div className="max-w-4xl mx-auto flex justify-between items-center">
						<h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
							🎮 Number Guessing Game
						</h1>
						<button
							onClick={isAuthenticated ? logout : login}
							className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
						>
							{isAuthenticated ? "Logout" : "Login"}
						</button>
					</div>
				</header>

				{isAuthenticated ? (
					<main className="max-w-4xl mx-auto p-6">
						<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
							<button
								onClick={startGame}
								disabled={isGameActive}
								className={`w-full mb-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
									isGameActive
										? "bg-gray-300 cursor-not-allowed"
										: "bg-green-600 hover:bg-green-700 text-white"
								}`}
							>
								{isGameActive ? "Game in Progress" : "Start New Game"}
							</button>

							{isGameActive && (
								<form onSubmit={submitGuess} className="space-y-4">
									<input
										type="number"
										value={guess}
										onChange={(e) => setGuess(e.target.value)}
										min="1"
										max="100"
										className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700"
										placeholder="Enter number (1-100)"
									/>
									<button
										type="submit"
										className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
									>
										Submit Guess
									</button>
								</form>
							)}

							{message && (
								<div
									className={`mt-6 p-4 rounded-lg ${
										message.includes("Congratulations")
											? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200"
											: message.includes("Error")
												? "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-200"
												: "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200"
									}`}
								>
									{message}
								</div>
							)}

							<div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
								<h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
									How to Play:
								</h2>
								<ul className="space-y-2 text-gray-600 dark:text-gray-300">
									<li>• Click "Start New Game" to begin</li>
									<li>• Enter a number between 1 and 100</li>
									<li>
										• The game will tell you if your guess is too high or too
										low
									</li>
									<li>• Try to guess the correct number!</li>
								</ul>
							</div>
						</div>
					</main>
				) : (
					<div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
						<h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
							Welcome to Number Guessing Game!
						</h2>
						<p className="mb-6 text-gray-600 dark:text-gray-400">
							Please login with Internet Identity to play.
						</p>
						<button
							type="button"
							onClick={login}
							className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
						>
							Login to Play
						</button>
					</div>
				)}
			</div>
		</>
	);
}

export default App;
