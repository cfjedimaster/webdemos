Vue.config.devtools = true;

const gameStore = new Vuex.Store({
	state: {
		ports: [ // todo - flags for ports to say such and such good has a bonus/penalty
			{ name: "New Saigon" },
			{ name: "Tokyo" }, 
			{ name: "Guangzhou" },
			{ name: "New Orleans" },
			{ name: "Seattle" },
			{ name: "Paris" },
			{ name: "Moscow" }
		],
		goods: [
			{ 
				name:"General",
				range: { min: 2, max: 10 }
			},
			{
				name:"Arms", 
				range: { min: 15, max: 40 }
			},
			{
				name:"Drones",
				range: { min: 500, max: 1200 }
			},
			{
				name:"AI",
				range: { min: 2000, max: 20000 }
			}
		],
		hold: [
		],
		companyName:'',
		initialFunds: 1000,
		currentFunds: 0,
		currentPort:'',
		currentCostOfGoods:null,
		gameDate:0, // a simple counter,
		gameYear:2091 // initial year of the game - also - THE FUTURE!
	},
	mutations:{
		addFunds(state, amount) {
			state.currentFunds += amount;
		},
		addGoods(state, order) {
			state.hold.forEach(h => {
				if(h.name === order.good) {
					h.amount += order.amount;
				}
			});
		},
		initCompany(state, name) {
			console.log('initCompany',name);
			state.companyName = name;
			state.currentFunds = state.initialFunds;

			// I'm an array defined by the order of state.goods
			state.goods.forEach((g,i) => {
				state.hold[i] = { name:g.name, amount:0 };
			});

			state.currentPort = state.ports[0].name;
		},
		incrementTime(state) {
			state.gameDate++;
		},
		takeFunds(state, amount) {
			state.currentFunds -= amount;
		},
		takeGoods(state, order) {
			state.hold.forEach(h => {
				if(h.name === order.good) {
					h.amount -= order.amount;
				}
			});
		}
	},
	actions:{
		purchase(context, order) {
			return new Promise((resolve, reject) => {
				console.log('purchase order', order);
				let totalCost;
				context.state.currentCostOfGoods.forEach(g => {
					if(g.name === order.good) {
						totalCost = order.amount * g.cost;
					}
				});
				console.log('totalCost', totalCost);
				if(totalCost > context.state.currentFunds) {
					reject('NotEnoughFunds');					
				} else {
					//add goods
					context.commit('addGoods', { good: order.good, amount:order.amount });
					// take $$
					context.commit('takeFunds', totalCost);
					resolve();
				}
			});
		},
		sell(context, order) {
			return new Promise((resolve, reject) => {
				console.log('sell order', order);
				context.state.hold.forEach(h => {
					if(h.name === order.good) {
						if(h.amount >= order.amount) {
							// figure out current cost - this MUST be done better
							let totalGained = 0;
							context.state.currentCostOfGoods.forEach(g => {
								if(g.name === order.good) totalGained = g.cost * order.amount;
							});
							//add goods
							context.commit('takeGoods', { good: order.good, amount:order.amount });
							// take $$
							context.commit('addFunds', totalGained);
							resolve();
						} else {
							reject('NotEnoughGoods');
						}
					}						
				});
			});
		}

	},
	getters:{
		costOfGoods(state) {
			/*
			So eventually I will have logic such that a port has a modifier on goods meaning it is higher/lower than average.

			this is wrong - i know it.
			*/
			if(state.currentCostOfGoods) return state.currentCostOfGoods;
			let goods = [];
			state.goods.forEach((g,i) => {
				goods[i] = { name:g.name, cost:Math.floor(Math.random() * (g.range.max - g.range.min + 1)) + g.range.min };
			});
			// um store it
			state.currentCostOfGoods = goods;
			return goods;
		},
		hold(state) {
			// may be complex later
			return state.hold;
		},
		gameDate(state) {
			/*
			so basically, translate a simple counter into a month date
			*/
			let newYear = state.gameYear + Math.floor(state.gameDate/12);
			let newMonth = state.gameDate%12+1;
			let result = newMonth + '/' + newYear;
			return result;
		}
	}
});

const app = new Vue({
	el:'#app',
	store:gameStore,
	data:{
		intro:true,
		gameOn:false,
		companyName:'moo', // set a value so i dont have to type
		purchaseAmt: 0,
		purchaseGood:'',
		sellAmt: 0,
		sellGood:'',
		statusMsg:''
	},
	methods: {
		doPurchase() {
			this.statusMsg = '';
			if(this.purchaseAmt <= 0 || this.purchaseGood === '') return;
			console.log('issue a purchase commit');
			this.$store.dispatch('purchase', { amount: this.purchaseAmt, good: this.purchaseGood })
			.then(r => {
				console.log('good purchase');
				this.statusMsg = 'Purchase completed!';
			})
			.catch(e => {
				console.error('bad purchase', e);
				this.statusMsg = 'You do not have enough funds.';
			});
		},
		doSale() {
			console.log('doSale', this.sellAmt, this.sellGood);
			this.statusMsg = '';
			if(this.sellAmt <= 0 || this.sellGood === '') return;
			console.log('issue a sell commit');
			this.$store.dispatch('sell', { amount: this.sellAmt, good: this.sellGood })
			.then(r => {
				console.log('good sale');
				this.statusMsg = 'Sale completed!';
			})
			.catch(e => {
				console.error('bad sale', e);
				this.statusMsg = 'You do not have those goods to sell.';
			});
		},
		startGame() {
			//even though we check for companyName in the UI, check again
			if(this.companyName.trim() === '') return;
			this.$store.commit('initCompany', this.companyName);
			this.intro = false;
			this.gameOn = true;
		}
	},
	computed:{
		costOfGoods() {
			return this.$store.getters.costOfGoods;
		},
		gameDate() {
			return this.$store.getters.gameDate;
		},
		funds() {
			return this.$store.state.currentFunds;
		},
		goods() {
			let g = [];
			this.costOfGoods.forEach(good => {
				g.push(good.name);
			});
			return g;
		},
		hold() {
			return this.$store.getters.hold;
		},
		port() {
			return this.$store.state.currentPort;
		}
	}
});