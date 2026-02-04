const HB_TIME = 1000 * 60 * 10; // 10 minutes

const SCHEMA = {
    title:"Sentiment",
    description:"A rating of the sentiment (bad versus good) of input text. Very bad is rated at -1, very good at 1.",
    type:"number", 	
    minimum:-1,
    maximum:1
};

async function canDoAI() {
    if(!window.LanguageModel) return false;
    return (await LanguageModel.availability()) !== 'unavailable';
}
  
document.addEventListener('alpine:init', () => {
    Alpine.data('app', () => ({
        term: '',
        terms: [],
        cards: [],
        session: null,
        running: false, 
        async init() {
            console.log('App initialized', navigator.userActivation.isActive);

            // we need to see if we support Chrome Prompt API 
            let ok4AI = await canDoAI();
            if(!ok4AI) {
                console.log('AI is not supported, sorry');
                alert('Sorry, this browser does not support the Chrome Prompt API');
                return;
            }

            // now we need to see if the model has to be downloaded
            let available = await LanguageModel.availability();
            if(available === 'downloadable') {
                // we need to show a modal so they can click to confirm, and navigator.userActivation.isActive will be true
               this.$refs.dlDialog.show();
            } else {
                this.makeSession();
            }
            console.log('Model availability: ', available);
            setInterval(() => { this.heartBeat() }, HB_TIME);
            // possibly load terms from local storage
            this.terms = JSON.parse(localStorage.getItem('terms')) || [];
            console.log('Terms loaded from local storage: ', this.terms);
            // if we had some, do an immediate kick 
            if(this.terms.length > 0) this.heartBeat();
        },
        async makeSession() {
            console.log('Making session');

            this.session = await LanguageModel.create({
                initialPrompts: [
                    {role:'system', content:'You rate the overall sentiment of a set of social media posts, separated by ---. Analzye them all and average out the sentiment, giving it a score from -1 to 1 with -1 being the most negative, and 1 being the most positive.'}
                ]
            });
                    
        },
        addTerm() {
            this.terms.push(this.term);
            localStorage.setItem('terms', JSON.stringify(this.terms));
            this.term = '';
            this.heartBeat();
            this.$refs.addTermDialog.hide();
        },
        deleteTerm(term) {
            this.terms = this.terms.filter(t => t !== term);
            localStorage.setItem('terms', JSON.stringify(this.terms));
            // remove the card
            for(let i = 0; i < this.cards.length; i++) {
                if(this.cards[i].term === term) {
                    this.cards.splice(i, 1);
                    break;
                }
            }
        },
        showAddTerm() {
            console.log('Adding term');
            this.$refs.addTermDialog.show();
        },
        resetForm() {
            console.log('Resetting form');
            this.term = '';
            this.$refs.addTermDialog.hide();
        },
        closeWarningDialog() {
            this.$refs.dlDialog.hide();
            this.makeSession();
        },
        async heartBeat() {
            if(this.running) return;
            this.running = true;
            console.log('Heartbeat, current terms: ', this.terms, new Date().toISOString(), navigator.userActivation.isActive);
            // I don't like this - need to change logic to - remove cards for terms that don't exist anymore
            this.cards = [];
            /*
            for each term:
                i call BS API to get terms, i filter down to just the text, but also 
                want the total # i got, and the datetime of the most recent and earliest 

                I then ask Chrome to perform a sentiment analysis on the text, from -1 to 1 
                I then render cards 

            */
           for(let term of this.terms) {
                console.log('Analyzing term: ', term);
                let results = await searchBS(term);
                console.log('Results: ', results);
                // create a block of text from the posts
                let text = results.posts.map(p => p.record.text).join('\n---\n');
                let sentiment = await this.session.prompt(text, {responseConstraint:SCHEMA});
                console.log('Sentiment: ', sentiment);
                this.cards.push({
                    term: term,
                    sentiment: sentiment,
                    total: results.total,
                    latest: results.latest,
                    earliest: results.earliest
                });
           }
           this.running = false;
        },
        formatDate(d) {
            return new Intl.DateTimeFormat('en-US', {
                dateStyle:'short',
                timeStyle:'short'
              }).format(new Date(d))
        }
    }))
});

async function searchBS(term) {
    let req = await fetch(`https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(term)}s&limit=50&sort=latest`);
	let d = await req.json();
    return {
        posts: d.posts, 
        total: d.posts.length,
        latest: d.posts[0].record.createdAt,
        earliest: d.posts[d.posts.length - 1].record.createdAt
    };
}
