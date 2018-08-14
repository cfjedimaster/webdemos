/*
Notes for later:
I hate that I duplicate code in addPodcast and loadPodCast in terms of 'translating' RSS items. 
But how do I add a private method to my store?
I could make addPodcast just verify the result but then loadPodcast would do another HTTP call to fetch data - 
but maybe I make loadPodcast take an optional arg of feed items to NOT need to load it?
Thoughts?
*/

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
			if(state.selectedPodcast) {
				console.log('filtered');
				items = state.allItems.filter(item => {
					return item.podcastPk == state.selectedPodcast.rsslink;
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
		addPodcast(context, data) {
			console.log('addPodcast', data.url);
			return new Promise((resolve, reject) => {
				if(context.state.podcasts.findIndex((podcast) => {
					return (podcast.rsslink === data.url);
				}) >= 0) {
					reject('URL already exists');
				} else {			
					fetch(rssAPI+encodeURIComponent(data.url))
					.then(res => res.json())
					.then(res => {
						// service returns res.feed, let's rename it because
						res.podcast = res.feed;

						//assign a color first
						res.podcast.color = colors[context.state.podcasts.length % (colors.length-1)];

						// ok, add the items (but we append the url as a fk so we can filter later)
						res.podcast.items.forEach(item => {
							item.playing = false;
							item.podcastPk = data.url;
							item.podcastTitle = res.title;
							item.podcastColor = res.podcast.color;
							/* attempt to add audio */
							if(item.enclosure && item.enclosure.type && item.enclosure.type.indexOf("audio") === 0) {
								item.audio = {
									url:item.enclosure.url
								}
								//optionally add duration
								if(item.itunes.duration && item.itunes.duration !== 0) {
									item.audio.duration = item.itunes.duration;
								}
							}
							context.state.allItems.push(item);
						});

						// delete items
						delete res.podcast.items;

						// add the original rss link
						res.podcast.rsslink = data.url;

						context.state.podcasts.push(res.podcast);

						context.dispatch('storePodcasts');

						resolve();
					});
					
				}
				
			});
		},
		deletePodcast(context, podcast) {
			let pos = context.state.podcasts.findIndex(p => {
				return p.rsslink == podcast.rsslink;
			});
			context.state.podcasts.splice(pos,1);
			context.state.allItems = context.state.allItems.filter(p => {
				return p.podcastPk != podcast.rsslink;
			});
			context.dispatch('storePodcasts');
		},
		filterPodcast(context, podcast) {
			context.state.selectedPodcast = podcast;
		},
		itemPlaying(context, item) {
			context.state.allItems.forEach(i => {
				if(i.guid === item.guid) {
					i.playing = true;
				} else {
					i.playing = false;
				}
			});
		},
		itemStopPlaying(context, item) {
			context.state.allItems.forEach(i => {
				if(i.guid === item.guid) {
					i.playing = false;
				}
			});
		},
		loadPodcast(context, podcast) {
			console.log('load Podcast', podcast);
			fetch(rssAPI+encodeURIComponent(podcast.rsslink))
			.then(res => res.json())
			.then(res => {
				console.log('in the then');
				console.log(res);
				// ok for now, assume no error, cuz awesome
				res.podcast = res.feed;

				res.podcast.items.forEach(item => {
					item.playing = false;
					item.podcastPk = podcast.rsslink;
					item.podcastTitle = podcast.title;
					item.podcastColor = podcast.color;
					/* attempt to add audio */
					if(item.enclosure && item.enclosure.type && item.enclosure.type.indexOf("audio") === 0) {
						console.log('in here');
						item.audio = {
							url:item.enclosure.url
						}
						//optionally add duration
						if(item.itunes.duration && item.itunes.duration !== 0) {
							item.audio.duration = item.itunes.duration;
						}
					}
					delete item.feed;
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
				
				context.state.podcasts.forEach(p => {
					context.dispatch('loadPodcast', p);
				});
				
				} catch(e) {
					console.error('Error restoring podcast json'+e);
					// bad json or other issue, nuke it
					window.localStorage.removeItem('podcasts');
				}
			}
		},
		storePodcasts(context) {
			console.log('persist podcasts');
			localStorage.setItem('podcasts', JSON.stringify(context.state.podcasts));
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

Vue.component('podcast-item', {
	props:[
		'color','title','content','link','podcasttitle', 'posted','audiosrc','playing'
	],
	template:`
	<v-card :color="color">
		<v-card-title primary-title>
			<div class="headline">{{title}} ({{posted | dtFormat}})</div>
		</v-card-title>
		<v-card-text>
			{{content | maxText }}
			<p/>
			<v-btn flat @click="play()" v-if="!playing">Play Audio</v-btn>
			<v-btn flat @click="stop()" v-if="playing" class="red">Stop Audio</v-btn>
		</v-card-text>
		<v-card-actions>
			<v-btn flat target="_new" :href="link">Read on {{podcasttitle}}</v-btn>
		</v-card-actions>
	</v-card>	
	`,
	methods:{
		play() {
			this.$emit('audiostart');
		},
		stop() {
			this.$emit('audiostop');
		}
	}
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
			selectedPodcast:null,
			audio:null
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
		addPodcastAction() {
			this.urlError = false;
			this.urlRules = [];

			podStore.dispatch('addPodcast', {url:this.addURL})
			.then(res => {
				this.addURL = '';
				this.addPodcastDialog = false;
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
		},
		doAudio(item) {
			podStore.dispatch('itemPlaying', item);
			if(this.audio) {
				this.audio.pause();
				this.audio.currentTime = 0;
			}
			this.audio = new Audio(item.audio.url);
			this.audio.play();
		},
		stopAudio(item) {
			podStore.dispatch('itemStopPlaying', item);
			this.audio.pause();
			this.audio.currentTime = 0;
		}
	}
})
