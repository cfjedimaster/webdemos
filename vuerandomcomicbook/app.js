const api = 'https://openwhisk.ng.bluemix.net/api/v1/web/rcamden%40us.ibm.com_My%20Space/comicvine/randomCharacter.json';

const defaultMaleImage = 'https://comicvine.gamespot.com/api/image/scale_large/1-male-good-large.jpg';

const app = new Vue({
	el:'#app',
	data() {
		return {
			loading:false,
			char:null
		}
	},
	created() {
		console.log('run created');
		this.getCharacter();
	},
	methods:{
		getCharacter() {
			this.loading = true;
			console.log('getCharacter');
			fetch(api)
			.then(res => res.json())
			.then(res => {
				console.log('got data',JSON.stringify(res.character,null,'\t'));
				this.loading = false;

				//Start formatting the data

				/*
				If no description, copy deck over. deck can be blank too though
				also sometimes its <br/>, sometimes <p>.</p>
				*/
				if(res.character.description && (res.character.description === '<br/>' || res.character.description === '<p>.</p>')) delete res.character.description;
				if(!res.character.description && !res.character.deck) {
					res.character.description = 'No description.';
				} else if(!res.character.description) {
					res.character.description = res.character.deck;
				}

				let image = '';
				if(!res.character.image) {
					image = defaultMaleImage;
				} else if(res.character.image && !res.character.image.super_url) {
					image = defaultMaleImage;
				} else {
					image = res.character.image.super_url;
				}
				res.character.image = image;
				
				this.char = res.character;

			});
		}
	}
})