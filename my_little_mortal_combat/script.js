import { suffixes } from './suffixes.js';
import { names } from './names.js';
import { bios } from './bios.js';

import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';

const NPCMoves = ['attack', 'defend', 'vogue'];
const HP_PER_LEVEL = 50;

Alpine.data('app', () => ({
		view:'intro',
		pcPony: {
			name:'',
			currentHp: HP_PER_LEVEL, 
			hp: HP_PER_LEVEL, 
			hpPercentage: 100,
			xp:0,
			gold:0,
			attack: 1, 
			defend: 1, 
			vogue: 1,
		},
		round: 1, 
		selectedOpponent: {
			name:'', currentHp: '', hp: '', bio: ''
		},
		selectedOpponentIdx: null,
		battleLog: [],
		fightResultMessage: '',
		playerMove: null, 
		opponents: [],
		lastName: '',
		lastLevel: '',
		init() {
			console.log('start me up');
			if(this.hasSavedGame()) {
				const savedData = localStorage.getItem('pcPony');
				if(savedData) {
					const data = JSON.parse(savedData);
					console.log('found saved game data:', data);
					this.lastName = data.name;
					console.log('last name set to:', this.lastName);
					this.lastLevel = xpToLevel(data.xp);
				}
			}
		},
		enterArena() {
			if(this.pcPony.name.trim() === '') return;
			if(this.hasSavedGame()) {
				if(!confirm('Starting a new game will overwrite your existing progress. Are you sure you want to continue?')) {
					return;
				}
			}
			this.makeOpponentList();
			this.view = 'main';
		},
		generateOpponent() {
			let name = getRandomArr(names); 
			// going to make a bio from 3 random things
			// it is possible they may repeat - will fix later
			let bio = `
				${name} ${getRandomArr(bios)}<br><br>
				${name} ${getRandomArr(bios)}<br><br>
				${name} ${getRandomArr(bios)}
			`;

			/*
			my level is -1 to +1 of my current level 
			*/
			let level = Math.max(1, this.level + getRandomIntInclusive(-1, 1)) 
			let opp = {
				name: name + ' ' + getRandomArr(suffixes),
				level,
				currentHp: HP_PER_LEVEL * level, 
				hp: HP_PER_LEVEL * level, 
				hpPercentage: 100,
				bio, 
				attack: Math.max(1, getRandomIntInclusive(level-2, level+2)),
				defend: Math.max(1, getRandomIntInclusive(level-2, level+2)),
				vogue: Math.max(1, getRandomIntInclusive(level-2, level+2)),
			}
			return opp;
		},
		makeOpponentList() {
			this.opponents = [];
			for(let i=0; i<3; i++) {
				this.opponents.push(this.generateOpponent());
			}
		},
		fight() {
			console.log('fight clicked');
			if (this.selectedOpponentIdx === null || this.selectedOpponentIdx === undefined) return;
			this.selectedOpponent = this.opponents[this.selectedOpponentIdx];
			console.log(this.selectedOpponent);
			this.view = 'battle';
		},
		onFightResultDialogClosed() {
			// lets also clean up from the last battle
			this.pcPony.currentHp = this.pcPony.hp = this.level * HP_PER_LEVEL;
			this.pcPony.hpPercentage = 100;
			this.round = 1;
			this.battleLog = [];
			this.fightResultMessage = '';
			this.playerMove = null;
			this.view = 'main';
			this.selectedOpponentIdx = null;
			this.makeOpponentList();
		},
		move(type) {
			console.log('Selected Opponent:', JSON.stringify(this.selectedOpponent));
			// ai added the line right below, pretty sure i dont need it
			if (this.pcPony.currentHp <= 0 || this.selectedOpponent.currentHp <= 0) return;
			console.log(`pony did ${type}`);
			let npcMove = getRandomArr(NPCMoves);
			console.log(`npc did ${npcMove}`);

			let result;
			if(type === 'attack' && npcMove === 'vogue') {
				result = 'win';
			} else if(type === 'attack' && npcMove === 'defend') {
				result = 'lose';
			} else if(type === 'defend' && npcMove === 'attack') {
				result = 'win';
			} else if(type === 'defend' && npcMove === 'vogue') {
				result = 'lose';
			} else if(type === 'vogue' && npcMove === 'defend') {
				result = 'win';
			} else if(type === 'vogue' && npcMove === 'attack') {
				result = 'lose';
			} else result = 'draw';

			console.log(result);
			let resultMsg = `You used ${type.charAt(0).toUpperCase() + type.slice(1)}. They used ${npcMove.charAt(0).toUpperCase() + npcMove.slice(1)}. `;

			/*
			dmg is 10 * the skill of the attack you made
			ditto for them
			*/
			let pcdmg = 10 * this.pcPony[type];
			let npcdmg = 10 * this.selectedOpponent[npcMove];
			console.log(`damage calculated: ${pcdmg}`);
			console.log(`npc damage calculated: ${npcdmg}`);

			if(result === 'win') {
				resultMsg += `You win the exchange. They take ${pcdmg} damage.`;
				this.selectedOpponent.currentHp -= pcdmg;
				this.selectedOpponent.hpPercentage = this.selectedOpponent.currentHp / this.selectedOpponent.hp * 100;
			}
			if(result === 'lose') {
				resultMsg += `They win the exchange. You take ${npcdmg} damage.`;
				this.pcPony.currentHp -= npcdmg;
				this.pcPony.hpPercentage = this.pcPony.currentHp / this.pcPony.hp * 100;
			}
			if(result === 'draw') resultMsg += 'Draw - no damage.';

			this.round++;
			this.battleLog.push(resultMsg);

			if(this.pcPony.currentHp <= 0 || this.selectedOpponent.currentHp <= 0) {
				let purse = this.selectedOpponent.level * 100;
				// currently, you get the same XP as gold - will probably tweak
				if(this.pcPony.currentHp <= 0) {
					// gold is 10% of what you would have gotten if you had won
					purse = Math.floor(purse * 0.1);
					this.fightResultMessage = `You have been defeated. Better luck next time! Your embarrassing performance earns you a small portion of the purse: ${purse} gold and XP.`;
				} else if(this.selectedOpponent.currentHp <= 0) {
					this.fightResultMessage = `You have defeated your opponent. Congratulations! Your victory earns you ${purse} gold and XP.`;
				}
				this.pcPony.gold += purse;
				this.pcPony.xp += purse; 
				this.persist();
				this.$refs['fight-result-dialog'].showModal();

			}
		},
		get level() {
			return xpToLevel(this.pcPony.xp);
		},
		train(skill) {
			if(this.pcPony.gold < this.pcPony[skill] * 10) {
				alert('Not enough gold to train!');
				return;
			}
			this.pcPony.gold -= this.pcPony[skill] * 10;
			this.pcPony[skill]++;
			this.persist();
		},
		persist() {
			console.log('saving to local storage');
			localStorage.setItem('pcPony', JSON.stringify(this.pcPony));
			console.log('saved data:', JSON.stringify(this.pcPony));
		},
		hasSavedGame() {
			return localStorage.getItem('pcPony') !== null;
		},
		loadGame() {
			const savedData = localStorage.getItem('pcPony');
			if (savedData) {
				this.pcPony = JSON.parse(savedData);
				this.makeOpponentList();
				this.view = 'main';
			}
		}
	}))

Alpine.start();

function getRandomArr(arr) {
  return arr[getRandomIntInclusive(0, arr.length-1)];    
}
  
function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min); 
}

function xpToLevel(xp) {
	if (xp <= 0) return 1;
	return Math.floor(Math.pow(xp / 100, 1 / 1.5)) + 1;
}