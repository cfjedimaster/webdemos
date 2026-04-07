import { suffixes } from './suffixes.js';
import { names } from './names.js';
import { bios } from './bios.js';

import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';

const NPCMoves = ['attack', 'defend', 'vogue'];

Alpine.data('app', () => ({
		view:'intro',
		pcPony: {
			name:'',
			level:1,
			currentHp: 50, 
			hp: 50, 
			hpPercentage: 100,
			exp:0,
			gold:0,
			attack: 1, 
			defense: 1, 
			pose: 1,
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
		init() {
			console.log('start me up');
		},
		enterArena() {
			if(this.pcPony.name.trim() === '') return;
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
			let opp = {
				name: name + ' ' + getRandomArr(suffixes),
				level: 1, 
				currentHp: 50, 
				hp: 50, 
				hpPercentage: 100,
				bio
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
			if(!this.selectedOpponentIdx) return;
			this.selectedOpponent = this.opponents[this.selectedOpponentIdx];
			console.log(this.selectedOpponent);
			this.view = 'battle';
		},
		move(type) {
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

			// TODO - make damage dependant on skills and such
			let dmg = 10;
			
			if(result === 'win') {
				resultMsg += `You win the exchange. They take ${dmg} damage.`;
				this.selectedOpponent.currentHp -= dmg;
				this.selectedOpponent.hpPercentage = this.selectedOpponent.currentHp / this.selectedOpponent.hp * 100;
			}
			if(result === 'lose') {
				resultMsg += `They win the exchange. You take ${dmg} damage.`;
				this.pcPony.currentHp -= dmg;
				this.pcPony.hpPercentage = this.pcPony.currentHp / this.pcPony.hp * 100;
			}
			if(result === 'draw') resultMsg += 'Draw - no damage.';

			this.round++;
			this.battleLog.push(resultMsg);

			if(this.pcPony.currentHp <= 0 || this.selectedOpponent.currentHp <= 0) {
				let purse = this.selectedOpponent.level * 100;
				if(this.pcPony.currentHp <= 0) {
					this.$refs['fight-result-dialog'].showModal();
					// gold is 10% of what you would have gotten if you had won
					purse = Math.floor(this.selectedOpponent.level * 0.1);
					this.fightResultMessage = `You have been defeated. Better luck next time! Your embarassing performance earns you a small portion of the purse: ${purse} gold.`;
				} else if(this.selectedOpponent.currentHp <= 0) {
					this.fightResultMessage = `You have defeated your opponent. Congratulations! Your victory earns you ${purse} gold.`;
					this.$refs['fight-result-dialog'].showModal();
				}
				this.pcPony.gold += purse;
				this.view = 'main';
			}
		},
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