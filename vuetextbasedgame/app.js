// mapping of short dir to long
const dirMapping = {
	'w':'West',
	'e':'East',
	'n':'North',
	's':'South'
};


Vue.filter('exitDesc', function (exits) {
	let result = '';

	if(exits.length > 1) {
		for(let i=0;i<exits.length;i++) {
			result += dirMapping[exits[i].dir];
			if(i < exits.length-2) result += ', ';
			if(i == exits.length-2) result += ' and ';
		}
	} else {
		result = dirMapping[exits[0].dir];
	}
	return result;
});


const app = new Vue({
	el:'#app',
	data() {
		return {
			loading:true,
			room:null,
			input:'',
			rooms:null,
			initialRoom:'initial',
			aliases:null,
			commands:null
		}
	},
	mounted() {
		console.log('Loading room data...');
		fetch('data.json')
		.then(res => res.json())
		.then(res => {
			console.log('Loaded.');
			this.aliases = this.prepareAliases(res.aliases);
			this.commands = res.commands;
			this.rooms = res.rooms;
			this.room = this.rooms[this.initialRoom];
			this.loading = false;
			//nextTick required because line above changes the DOM
			this.$nextTick(() => {
				this.$refs.input.focus();
			});
		});
	},
	methods: {
		cli() {
			console.log('Running cli on '+this.input);

			//first, map input to aliases
			// initially i set it back into this.input, but it was jarring
			let input = this.mapAlias(this.input);

			// first see if valid input, for now, it must be a dir
			if(!this.validInput(input)) {
				alert('Sorry, but I don\'t recognize: '+this.input);
				this.input = '';
				return;
			}
			// Ok, currently this is just handles moving, nothng else
			// so this is where I'd add a parser, imagine it is there
			// and after running, it determines our action is "movement"
			let action = 'movement';
			// arg would be the argument for the action, so like "go west", arg=west. 
			// for now, it's just the cli
			let arg = this.input;

			switch(action) {
				case 'movement':{
					this.doMovement(arg);
				}
			}

			this.input = '';
		},
		doMovement(d) {
			console.log('Move '+d);
			// first, change North to n
			let mappedDir = '';
			for(let dir in dirMapping) {
				if(dir === d.toLowerCase()) mappedDir = d;
				if(dirMapping[dir].toLowerCase() === d.toLowerCase()) mappedDir = dir;
			}
			// see if valid direction
			for(let i=0;i<this.room.exits.length;i++) {
				if(this.room.exits[i].dir === mappedDir) {
					this.room = this.rooms[this.room.exits[i].room];
					return;
				}
			}		
			// if we get here, boo
			alert(dirMapping[d] + ' is not a valid direction!');
		},
		prepareAliases(s) {
			/*
			To make it easier for the author, I allow for X|Y, which I'll expand out at X:alias and Y:alias
			*/
			let aliases = {};
			for(let key in s) {
				if(key.indexOf('|') === -1) {
					aliases[key] = s[key];
				} else {
					let parts = key.split('|');
					parts.forEach(p => {
						aliases[p] = s[key];
					});
				}
			}
			return aliases;
		},
		mapAlias(s) {
			/*
			Given an input of X, I see if this is an alias for something else.
			*/
			//pad single word clis with a space, cuz it makes sense
			if(s.indexOf(' ') === -1) s += ' ';

			console.log('aliases are '+JSON.stringify(this.aliases));
			console.log('input was '+s);
			let looking = true;
			while(looking) {
				let foundOne = false;
				for(let key in this.aliases) {
					console.log('key is '+key);
					if(s.indexOf(key+' ') === 0) {
						s = s.replace(key, this.aliases[key]);
						foundOne = true;
					}
				}
				if(!foundOne) looking = false;
			}
			// trim any extra space
			s = s.trim();
			console.log('output is '+s);
			return s;
		},
		validInput(i) {
			// v1 is stupid dumb
			console.log('validInput('+i+')');
			return this.commands.includes(i.toLowerCase());
		}
	}
});