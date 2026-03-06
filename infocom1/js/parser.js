class Parser {
    constructor() {
        // Stop words to ignore in commands
        this.stopWords = ["the", "a", "an", "at", "to", "in", "on", "into"];

        // Synonyms mapping
        this.synonyms = {
            "n": "north",
            "s": "south",
            "e": "east",
            "w": "west",
            "u": "up",
            "d": "down",
            "l": "look",
            "x": "examine",
            "i": "inventory",
            "inv": "inventory",
            "get": "take",
            "grab": "take",
            "leave": "drop"
        };
    }

    /**
     * Parses the raw input string into an actionable object.
     * @param {string} rawInput 
     * @returns {{verb: string, noun: string, raw: string}}
     */
    parse(rawInput) {
        // Clean up input
        let cleanInput = rawInput.toLowerCase().trim();
        // Remove punctuation
        cleanInput = cleanInput.replace(/[.,!?]/g, "");

        if (!cleanInput) {
            return { verb: "", noun: "", raw: rawInput };
        }

        // Split into words
        let words = cleanInput.split(/\s+/);

        // Remove stop words
        words = words.filter(word => !this.stopWords.includes(word));

        if (words.length === 0) {
            return { verb: "", noun: "", raw: rawInput };
        }

        // Apply synonym mapping to the first word (verb)
        let verb = words[0];
        if (this.synonyms[verb]) {
            verb = this.synonyms[verb];
        }

        // If it's a direction command like just "n" or "north", the verb is "go" and noun is "north".
        // Let's standardise movement:
        const directions = ["north", "south", "east", "west", "up", "down"];
        if (directions.includes(verb)) {
            return {
                verb: "go",
                noun: verb,
                raw: rawInput
            };
        }

        let noun = "";
        if (words.length > 1) {
            // Join the rest as the noun phrase (e.g. "take red key" -> verb: take, noun: "red key")
            noun = words.slice(1).join(" ");
        }

        return {
            verb: verb,
            noun: noun,
            raw: rawInput
        };
    }
}
