import Random "mo:base/Random";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";

actor class RandomGuess() {
    private var targetNumber : Nat = 0;
    private var isActive : Bool = false;

    // Generate random number
    private func generateRandom() : async Nat {
        let entropy = await Random.blob();
        let randomBytes = Blob.toArray(entropy);
        let randomByte = randomBytes[0];
        1 + (Nat8.toNat(randomByte) % 100)
    };

    // Start new game
    public shared(_msg) func startGame() : async Text {
        targetNumber := await generateRandom();
        isActive := true;
        "Game started! Guess a number between 1 and 100!";
    };

    // Make a guess
    public shared(_msg) func guess(userGuess : Nat) : async Text {
        
        if (not isActive) {
            return "No active game. Please start a new game first!";
        };

        if (userGuess < 1 or userGuess > 100) {
            return "Please guess a number between 1 and 100";
        };

        if (userGuess == targetNumber) {
            isActive := false;
            return "Congratulations! You guessed correctly!";
        } else if (userGuess < targetNumber) {
            return "Too low! Try a higher number.";
        } else {
            return "Too high! Try a lower number.";
        };
    };
}
