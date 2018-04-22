//not being used yet :>
const discoverAPI = 'https://wt-c2bde7d7dfc8623f121b0eb5a7102930-0.run.webtask.io/discoverRss';
const rssAPI = 'https://wt-c2bde7d7dfc8623f121b0eb5a7102930-0.sandbox.auth0-extend.com/getRss?url=';

// list of colors to iterate through
/* original COMPLETE list ...
const colors = ["red","pink","purple","deep-purple","indigo","blue","light-blue","cyan","teal","green","light-green","lime","yellow","amber","orange","deep-orange","brown","blue-grey","grey"];
*/
// nicer, I think, list
const colors = ["indigo","blue","light-blue","cyan","teal","light-green","blue-grey"];

Vue.filter('maxText', function(text) {
	//remove html
	text = text.replace(/<.*?>/gi,'');
	if(text.length > 500) text = text.substr(0,500);
	return text;
});

let app = new Vue({ 
	el: '#app',
	data() {
		return {
			drawer:true,
			showIntro:false,
			addFeedDialog:false,
			addURL:'http://feeds.feedburner.com/raymondcamdensblog',
			urlError:false,
			urlRules:[],
			feeds:[],
			allItems:[],
			selectedFeed:null
		}
	},
	computed: {
		items:function() {
			console.log('calling computed items');
			if(this.allItems.length === 0) return [];
			// filter
			let items = [];
			console.log('total is '+this.allItems.length);
			if(this.selectedFeed) {
				console.log('filtered');
				items = this.allItems.filter(item => {
					return item.feedPk == this.selectedFeed.rsslink;
				});
				console.log('items is '+items.length);
			} else {
				items = this.allItems;
			}
			items = items.sort((a, b) => {
				return new Date(b.isoDate) - new Date(a.isoDate);
			});

			return items;
		}
	},
	created() {
		this.restoreFeeds();
		if(this.feeds.length === 0) this.showIntro = true;
	},
	methods:{
		addFeed() {
			console.log('Add Feed');
			this.addFeedDialog = true;
		},
		allFeeds() {
			this.selectedFeed = null;
		},
		addFeedAction() {
			console.log('this.addURL', this.addURL);
			this.urlError = false;
			this.urlRules = [];
			//first, see if new
			if(this.feeds.indexOf(this.addUrl) >= 0) {
				this.urlError = true;
				this.urlRules = ["URL already exists."];
				return;
			} else {
				fetch(rssAPI+encodeURIComponent(this.addURL))
				.then(res => res.json())
				.then(res => {
					console.log(JSON.stringify(res.feed));
					// ok for now, assume no error, cuz awesome
					// ok, add the items (but we append the url as a fk so we can filter later)
					//this.allItems = this.allItems.concat(res.feed.items);
					res.feed.items.forEach(item => {
						item.feedPk = this.addURL;
						this.allItems.push(item);
					});

					// delete items
					delete res.feed.items;
					// add the original rss link
					res.feed.rsslink = this.addURL;
					res.feed.color = colors[this.feeds.length % (colors.length-1)];

					this.feeds.push(res.feed);

					this.addFeedDialog = false;
					//always hide intro
					this.showIntro = false;

					//persist the feed, but not the items
					this.storeFeeds();
				});
			}

		},
		filterFeed(feed) {
			this.selectedFeed = feed;
		},
		loadFeed(feed) {
			fetch(rssAPI+encodeURIComponent(feed.rsslink))
			.then(res => res.json())
			.then(res => {
				// ok for now, assume no error, cuz awesome
				res.feed.items.forEach(item => {
					item.feedPk = feed.rsslink;
					item.feedTitle = feed.title;
					item.feedColor = feed.color;
					this.allItems.push(item);
				});
			});
		},
		restoreFeeds() {
			let feeds = localStorage.getItem('feeds');
			if(feeds) {
				this.feeds = JSON.parse(feeds);
				this.feeds.forEach((feed,idx) => {
					feed.color = colors[idx % (colors.length-1)];
					console.log(feed.color);
					this.loadFeed(feed);
				});
			}
		},
		storeFeeds() {
			console.log('calling storeFeeds');
			localStorage.setItem('feeds', JSON.stringify(this.feeds));
		}
	}
})
