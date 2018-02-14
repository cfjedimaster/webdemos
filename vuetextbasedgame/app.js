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
			roomDesc:'',
			exitDesc:'',
			input:'',
			rooms:null,
			initialRoom:'initial'
		}
	},
	mounted() {
		console.log('Loading room data...');
		fetch('rooms.json')
		.then(res => res.json())
		.then(res => {
			console.log('Loaded.');
			this.rooms = res;
			this.room = this.rooms[this.initialRoom];
			this.roomDesc = this.room.description;
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

			// first see if valid input, for now, it must be a dir
			if(!this.validInput(this.input)) {
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
		validInput(i) {
			// v1 is stupid dumb
			let valid = ['w','e','s','n','west','east','south','north'];
			return valid.includes(i.toLowerCase());
		}
	}
});