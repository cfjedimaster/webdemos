import * as randomWordSlugs from "https://cdn.skypack.dev/random-word-slugs@0.1.7";
import pluralize from "https://cdn.skypack.dev/pluralize";

/*

*/
const CONSTANTS = {
	industryTrigger: 10,
	automationTrigger: 10,
	baseGain: 10000
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

