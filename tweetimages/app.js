const SERVICE = 'https://rcamden-azurefunctions.azurewebsites.net/api/tweets?account=';

const app = new Vue({
	el:'#app',
	data() {
		return {
			account:'',
			images:[],
			errorState:false,
			loading:false,
			noresults:false
		}
	},
	created() {
		console.log('ok, set stuff up');
		this.account = new URLSearchParams(document.location.search).get('account');
		if(!this.account) {
			this.errorState = true;
			return;
		}
		this.loading = true;
		console.log('account is '+this.account);
		fetch(SERVICE + encodeURIComponent(this.account))
		.then(res => res.json())
		.then(res => {
			this.loading = false;
			console.log('results', res);
			if(res.length === 0) {
				this.noresults = true;
			} 
			this.images = res;
		});
	}
});