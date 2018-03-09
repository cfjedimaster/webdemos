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
			commands:null,
			status:''
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
			let result = this.parseInput(input);
			if(!result) {
				alert('Sorry, but I don\'t recognize: '+this.input);
				this.input = '';
				return;
			}

			let action = result.cmd;
			let arg = result.arg;

			switch(action) {
				case 'movement':{
					this.doMovement(arg);
					break;
				}
				case 'look': {
					console.log('look at '+arg);
					this.doLook(arg);
					break;
				}
			}

			this.input = '';
		},
		doMovement(d) {
			console.log('Move '+d);
			this.status = '';
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
		doLook(t) {
			if(!this.room.lookables) this.room.lookables = [];
			for(let i=0;i<this.room.lookables.length;i++) {
				let l = this.room.lookables[i];
				for(let x=0; x<l.aliases.length; x++) {
					if(t.toLowerCase() === l.aliases[x].toLowerCase()) {
						this.status = l.desc;
						return true;
					}
				}
			}
			alert(`You don't see ${t} here.`);
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

			let looking = true;
			while(looking) {
				let foundOne = false;
				for(let key in this.aliases) {
					if(s.indexOf(key+' ') === 0) {
						s = s.replace(key, this.aliases[key]);
						foundOne = true;
					}
				}
				if(!foundOne) looking = false;
			}
			// trim any extra space
			s = s.trim();
			return s;
		},
		parseInput(i) {

			if(i === 'w' || i === 'e' || i === 's' || i === 'n') {
				return {
					cmd:'movement',
					arg:i
				};
			}

			if(i.indexOf('look ') === 0) {
				let parts = i.split(' ');
				parts.shift();
				let target = parts.join(' ');
				return {
					cmd:'look',
					arg:target
				}
			}
			/*
			// v1 is stupid dumb
			console.log('validInput('+i+')');
			for(let x=0;x<this.commands.length;x++) {
				let c = this.commands[x];
				if(i.toLowerCase() === c.toLowerCase()) return {cmd:i.toLowerCase()};
				// support command: foo *
				if(c.indexOf(' *') > -1 && i.indexOf(' ') > 0) {
					let baseCommand = c.split(' ')[0].trim();
					let inputBase = i.split(' ')[0].trim();
					console.log('check baseCommand -'+baseCommand+ '- to -'+inputBase+'-');
					console.log(inputBase.toLowerCase() === baseCommand.toLowerCase());
					if(inputBase.toLowerCase() === baseCommand.toLowerCase()) return true;
				}
			};
			return null;
			*/

		}
	}
});