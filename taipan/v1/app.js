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
		initCompany(state, name) {
			console.log('initCompany',name);
			state.companyName = name;
			state.currentFunds = state.initialFunds;

			// I'm an array defined by the order of state.goods
			state.goods.forEach((g,i) => {
				state.hold[i] = { name:g.name, quantity:0 };
			});

			state.currentPort = state.ports[0].name;
		},
		incrementTime(state) {
			state.gameDate++;
		},
		purchase(state, order) {
			console.log('purchase order', order);
			console.log('current prices', JSON.stringify(state.currentCostOfGoods));
			let totalCost;
			state.currentCostOfGoods.forEach(g => {
				if(g.name === order.good) {
					totalCost = order.amount * g.cost;
				}
			});
			console.log('totalCost', totalCost);
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
		sellGood:''
	},
	methods: {
		doPurchase() {
			if(this.purchaseAmt <= 0 || this.purchaseGood === '') return;
			console.log('issue a purchase commit');
			this.$store.commit('purchase', { amount: this.purchaseAmt, good: this.purchaseGood });

		},
		doSale() {
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