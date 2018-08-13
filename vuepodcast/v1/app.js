const rssAPI = 'https://wt-c2bde7d7dfc8623f121b0eb5a7102930-0.sandbox.auth0-extend.com/getRss?url=';

// list of colors to iterate through
const colors = ["indigo","blue","cyan","light-blue","teal","light-green","blue-grey"];

const podStore = new Vuex.Store({
	state:{
		allItems:[],
		podcasts:[],
		selectedPodcast:null
	},
	getters:{
		items(state) {
			if(state.allItems.length === 0) return [];

			// filter
			let items = [];
			if(state.selectedFeed) {
				console.log('filtered');
				items = state.allItems.filter(item => {
					return item.feedPk == state.selectedFeed.rsslink;
				});
			} else {
				items = state.allItems;
			}
			items = items.sort((a, b) => {
				return new Date(b.isoDate) - new Date(a.isoDate);
			});

			return items;
		}
	},
	mutations:{
	},
	actions:{
		addFeed(context, data) {
			console.log('addFeed', data.url);
			return new Promise((resolve, reject) => {
				if(context.state.feeds.findIndex((feed) => {
					return (feed.rsslink === data.url);
				}) >= 0) {
					reject('URL already exists');
				} else {			
					fetch(rssAPI+encodeURIComponent(data.url))
					.then(res => res.json())
					.then(res => {

						//assign a color first
						res.feed.color = colors[context.state.feeds.length % (colors.length-1)];

						// ok, add the items (but we append the url as a fk so we can filter later)
						res.feed.items.forEach(item => {
							item.feedPk = data.url;
							item.feedTitle = res.title;
							item.feedColor = res.feed.color;
							context.state.allItems.push(item);
						});

						// delete items
						delete res.feed.items;

						// add the original rss link
						res.feed.rsslink = data.url;

						context.state.feeds.push(res.feed);

						context.dispatch('storeFeeds');

						resolve();
					});
					
				}
				
			});
		},
		deleteFeed(context, feed) {
			let pos = context.state.feeds.findIndex(f => {
				return f.rsslink == feed.rsslink;
			});
			context.state.feeds.splice(pos,1);
			context.state.allItems = context.state.allItems.filter(f => {
				return f.feedPk != feed.rsslink;
			});
			context.dispatch('storeFeeds');
		},
		filterFeed(context, feed) {
			context.state.selectedFeed = feed;
		},
		loadFeed(context, feed) {
			fetch(rssAPI+encodeURIComponent(feed.rsslink))
			.then(res => res.json())
			.then(res => {
				// ok for now, assume no error, cuz awesome
				res.feed.items.forEach(item => {
					item.feedPk = feed.rsslink;
					item.feedTitle = feed.title;
					item.feedColor = feed.color;
					context.state.allItems.push(item);
				});
			});			
		},
		restorePodcasts(context) {
			let podsRaw = window.localStorage.getItem('podcasts');
			if(podsRaw) {
				try {
				let podcasts = JSON.parse(podsRaw);
				context.state.podcasts = podcasts;
				/*
				context.state.feeds.forEach(f => {
					context.dispatch('loadFeed', f);
				});
				*/
				} catch(e) {
					console.error('Error restoring podcast json'+e);
					// bad json or other issue, nuke it
					window.localStorage.removeItem('podcasts');
				}
			}
		},
		storeFeeds(context) {
			console.log('persist feeds');
			localStorage.setItem('feeds', JSON.stringify(context.state.feeds));
		}
	}
});

Vue.filter('maxText', function(text) {
	//remove html
	text = text.replace(/<.*?>/gi,'');
	if(text.length > 500) text = text.substr(0,500);
	return text;
});

Vue.filter('dtFormat', function(s) {
	if(!window.Intl) return s;
	// convert to date
	if(!(s instanceof Date)) {
		let orig = s;
		s = new Date(s);
		if(s == 'Invalid Date') return orig;
	}
 
	return new Intl.DateTimeFormat().format(s);
});

Vue.component('feed-item', {
	props:[
		'color','title','content','link','feedtitle', 'posted'
	],
	template:`
	<v-card :color="color">
		<v-card-title primary-title>
			<div class="headline">{{title}} ({{posted | dtFormat}})</div>
		</v-card-title>
		<v-card-text>
			{{content | maxText }}
		</v-card-text>
		<v-card-actions>
			<v-btn flat target="_new" :href="link">Read on {{feedtitle}}</v-btn>
		</v-card-actions>
	</v-card>	
	`
});

let app = new Vue({ 
	el: '#app',
	store:podStore,
	data() {
		return {
			drawer:true,
			addPodcastDialog:false,
			addURL:'',
			urlError:false,
			urlRules:[],
			selectedPodcast:null
		}
	},
	computed: {
		showIntro() {
			return this.podcasts.length == 0;
		},
		podcasts() {
			return podStore.state.podcasts;
		},
		items() {
			return podStore.getters.items;
		}
	},
	created() {
		podStore.dispatch('restorePodcasts');
	},
	methods:{
		addPodcast() {
			this.addPodcastDialog = true;
		},
		allPodcasts() {
			podStore.dispatch('filterPodcasts', null);
		},
		addPodcastction() {
			this.urlError = false;
			this.urlRules = [];

			feedStore.dispatch('addFeed', {url:this.addURL})
			.then(res => {
				this.addURL = '';
				this.addFeedDialog = false;
			})
			.catch(e =>{
				console.log('err to add', e);
				this.urlError = true;
				this.urlRules = ["URL already exists."];				
			});
		},
		deletePodcast(podcast) {
			podStore.dispatch('deletePodcast', podcast);
		},
		filterPodcast(podcast) {
			podStore.dispatch('filterPodcast', podcast);
		}
	}
})
