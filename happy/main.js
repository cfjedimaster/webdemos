const app = new Vue({
	el:'#app',
	data:{
		index:-1,
		quotes:[],
		text:'Loading the Happy...',
		loading:'italic'
	},
	created() {
		fetch('quotes.json')
		.then(res => res.json())
		.then(res => {
			this.quotes = res;
			console.log('loaded');

			this.newQuote();

			setInterval(() => {
				this.newQuote();
			}, 6000);
			
		});
	},
	methods:{
		newQuote() {
			index = getRandomInt(0, this.quotes.length-1);
			app.text = this.quotes[index];
			app.loading='';
		}
	}
});

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
