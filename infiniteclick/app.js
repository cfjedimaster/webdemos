import * as randomWordSlugs from "https://cdn.skypack.dev/random-word-slugs@0.1.7";
import pluralize from "https://cdn.skypack.dev/pluralize";

/*

*/
const CONSTANTS = {
	industryTrigger: 10,
	automationTrigger: 10,
	baseGain: 1000
};

document.addEventListener('alpine:init', () => {
	Alpine.data('app', () => ({
		industries:[],
		shinyObjects:0n,
		message:'',
		automationTrigger: CONSTANTS.automationTrigger, 
		init() {
			console.log('start me up...');
			this.newIndustry();
			setInterval(() => { this.heartBeat() }, 1000);
		},
		numFormat(x) {
			return formatLargeNumber(Number(BigInt.asIntN(64,x)));
		},
		heartBeat() {
			console.log('💓');
			/*
			check each industry to see if working
			*/
			this.industries.forEach(i => {
				if(i.enabled && i.managed) {
					this.clickIndustry(i);
				}
				if(!i.enabled && i.doneWorking <= Date.now()) {
					i.enabled = true;
					// should be 100
					/*
					so what happens here depends on rank. only rank 1 adds $$, 
					rank 2+ adds to rank below you
					*/
					if(i.rank === 1) {
						this.shinyObjects += BigInt(i.rank * CONSTANTS.baseGain * i.count);
					} else {
						this.industries[i.rank - 2].count += i.rank * CONSTANTS.baseGain * i.count;
					}
				}

			});
		},
		buyAutomation(i) {
			this.message = '';
			let cost = i.rank * 10000;
			console.log(`can the player buy automation of industry ${i.name}?, cost ${cost}`);
			if(this.shinyObjects < cost) {
				this.message = 'You can\'t afford that yet!';
				return;
			}
			this.shinyObjects -= BigInt(cost);
			i.managed=true;
		},
		buyIndustry(i) {
			this.message = '';
			let cost = i.rank * 1000;
			console.log(`can the player buy an instance of industry ${i.name}?, cost ${cost}`);
			if(this.shinyObjects < cost) {
				this.message = 'You can\'t afford that yet!';
				return;
			}
			this.shinyObjects -= BigInt(cost);
			i.count++;

			// we add a new industry at INDUSTRY_TRIGGER
			if(i.count >= CONSTANTS.industryTrigger && this.industries.length <= i.rank) {
				this.newIndustry();
			}
		},
		clickIndustry(i) {
			this.message = '';

			console.log('click for',i);
			// ensure im enabled
			if(!i.enabled) return;
			i.enabled = false;
			/*
				my end time is based on speed, higher the #, the quicker it runs, with a min of one sec
				we will have a max of 10 for speed, so we can keep it simple:
					total time = 11 - speed
					so if speed is 1, time is 10 seconds
					if speed is 10, time is 1 second
				
				making it a bit quicker to trigger people to click more...
			*/
			let totalTime = 11 - i.speed; 
			i.doneWorking = Date.now() + (totalTime * 50);
		},
		newIndustry() {

			const adjectiveOptions = ['appearance','color','condition','personality','quantity','shapes','size','sounds','taste','time','touch'];

			const nounOptions = ['animals', 'business', 'food', 'technology', 'thing'];

			const getAdjectives = () => {
				return [ adjectiveOptions[getRandomIntInclusive(0, adjectiveOptions.length - 1)], adjectiveOptions[getRandomIntInclusive(0, adjectiveOptions.length - 1)]  ];
			}

			let fresh = false;
			let newIndustry;
			while(!fresh) {
				newIndustry = pluralize(randomWordSlugs.generateSlug(3, { 
					format: "title", 
					partsOfSpeech:['adjective', 'adjective', 'noun'],
					categories: {
						adjective:getAdjectives(),
						noun:[nounOptions[getRandomIntInclusive(0, nounOptions.length - 1)]]
					}
				}));
				fresh = this.industries.findIndex(i => i.name === newIndustry) === -1;
			}
			this.industries.push({ 
				name: newIndustry,
				rank: this.industries.length + 1,
				enabled:true,
				speed:1,
				managed:false,
				count: 1
			});
		}
  	}))
});

function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min); 
}

function formatLargeNumber(num) {
    // Assuming num is always a positive integer as per prior constraints.
    // If num could be 0, one might add: if (num === 0) return "0";

    const formatValuePart = (val) => {
        // val is the scaled value (e.g., num / 1000), which can be a float.
        // This function formats val to a string with at most 3 digits,
        // like "123", "12.3", "1.23". It also handles rounding and capping.

        // Cap values that would round to 1000 or more for this tier's unit at 999.
        if (val >= 999.5) return "999";

        // Format as XXX (e.g., 100 to 999)
        if (val >= 99.95) { // Rounds to 100 or more
            return Math.round(val).toString();
        }

        // Format as XX.X (e.g., 10.0 to 99.9)
        if (val >= 9.995) { // Rounds to 10.0 or more
            const roundedOneDecimal = Math.round(val * 10) / 10;
            const s = roundedOneDecimal.toFixed(1);
            return s.endsWith(".0") ? s.slice(0, -2) : s; // "10.0" -> "10"
        }

        // Format as X.XX (e.g., 0.01 to 9.99), or X, or XX
        // Handles cases like 0.001 -> "0.01"
        if (val < 0.005 && val > 0) return "0.01"; // Smallest display for non-zero scaled values

        const roundedTwoDecimal = Math.round(val * 100) / 100;
        // If it rounded to 0.00 but was originally positive (e.g. 0.0049)
        if (roundedTwoDecimal === 0 && val > 0) return "0.01";

        const s = roundedTwoDecimal.toFixed(2);
        if (s.endsWith(".00")) return s.slice(0, -3); // "1.00" -> "1"
        if (s.endsWith("0")) return s.slice(0, -1);   // "1.10" -> "1.1"
        return s;
    };

    // AA+ System (numbers >= 1 Quadrillion, or 1000 Trillion)
    if (num >= 1e15) {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        // Calculate 'k': 0-indexed step for letter sequence (AA k=0, BB k=1, ..., AZ k=25, BA k=26 ...)
        // Each step 'k' corresponds to a 1000x increase in magnitude from 1e15.
        let k = Math.floor(Math.log10(num / 1e15) / 3);
        if (k < 0) k = 0; // Safety for numbers very close to 1e15 that might dip due to precision

        let divisor = Math.pow(10, 15 + k * 3);
        let scaledValue = num / divisor;

        // If scaledValue would round to 1000 or more, it means we should use the next 'k' (next suffix)
        // This keeps the numeric part smaller, e.g., 999.7AA becomes 1.00BB (approx)
        if (Math.round(scaledValue) >= 1000 && k < (26 * 4 - 1) /* Practical limit on k, e.g., ZZZZ */) {
            k++;
            divisor = Math.pow(10, 15 + k * 3);
            scaledValue = num / divisor;
        }

        const numLetters = 2 + Math.floor(k / 26); // AA (k=0-25), AAA (k=26-51), etc.
        const letterIndex = k % 26;
        const charToRepeat = alphabet[letterIndex];
        let suffix = charToRepeat.repeat(numLetters);

        if (suffix === "KKK") {
            suffix = "KFC";
        }
        return formatValuePart(scaledValue) + suffix;
    }

    // Trillions (1T to 999.99...T, displayed up to 999T)
    if (num >= 1e12) {
        const scaledValue = num / 1e12;
        // If scaledValue >= 999.5, formatValuePart will cap it at "999". E.g., 999.7T becomes "999T".
        return formatValuePart(scaledValue) + 'T';
    }

    // Billions (1B to 999.99...B, displayed up to 999B)
    if (num >= 1e9) {
        const scaledValue = num / 1e9;
        return formatValuePart(scaledValue) + 'B';
    }

    // Millions (1M to 999.99...M, displayed up to 999M)
    if (num >= 1e6) { // Added Million tier
        const scaledValue = num / 1e6;
        return formatValuePart(scaledValue) + 'M';
    }

    // Thousands (1K to 999.99...K, displayed up to 999K)
    // As per "numbers over 1000 should use K"
    if (num >= 1e3) {
        const scaledValue = num / 1e3;
        return formatValuePart(scaledValue) + 'K';
    }

    // Base case: numbers less than 1000 (1 to 999)
    // num is a positive integer here. formatValuePart handles it.
    return formatValuePart(num);
}