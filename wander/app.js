/*
The random things you hear when you are all alone... or are you?
*/
const MSGS = [
	"There is a rustle somewhere near you.",
	"Does this ever end?",
	"You almost see the sun through the clouds.",
	"A bird flies by, but you loose sight of it quickly."
];

document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
		PLATE_SIZE: {
			width: 20, 
			height: 20
		},
		NUM_OBSTACLES:100,
		db:null,
		plate:[],
		plateLocation: [0, 0],
		playerLocation:null,
		showText:false,
		whisper:'',
		async init() {
			this.db = await this.setupDb();
			// start the player roughly in the middle
			this.playerLocation = [ Math.floor(this.PLATE_SIZE.width/2), Math.floor(this.PLATE_SIZE.height/2) ];
			this.plate = await this.getPlate(this.plateLocation);
			// start initial hb, after this it's called with a random interval
			setTimeout(() => { this.whisperHeartBeat() }, 30 * 10);
		},
		async setupDb() {
		  return new Promise((resolve, reject) => {
		
			let request = indexedDB.open('wander', 1);

			request.onerror = event => {
			alert('Error Event, check console');
			console.error(event);
			}
		
			request.onupgradeneeded = event => {
			console.log('idb onupgradeneeded firing');

			let db = event.target.result;

			let objectStore = db.createObjectStore('plates', { keyPath: 'location' });
			};
			
			request.onsuccess = event => {
				resolve(event.target.result);
			};
		  });
		},	
		async getPlate(location) {
			console.log(`Request to get plate for ${location}`);
			/*
			My logic is: see if the plate exists in the database, if not, make it
			*/
			plate = await this.loadPlate(location);
			if(!plate) {
				console.log('we didnt have a plate, so need to make one');
				plate = this.generatePlate(this.PLATE_SIZE, this.playerLocation, this.NUM_OBSTACLES);
				console.log("NEW PLATE generated");
				await this.persistPlate(location, plate);
			}
			// place the player
			plate[this.playerLocation[0]][this.playerLocation[1]] = "@";
			return plate;
		}, 
		generatePlate(size,player,numObstacles) {
			console.log(`I'm creating a new plate sized ${JSON.stringify(size)}, and ensuring ${player} is not obscured.`);
			let plate = [];
			for(let x=0;x<size.width;x++) {
				plate.push([]);
				// first, fill it with the grand void of nothingness
				for(let y=0;y<size.height;y++) {
					plate[plate.length-1].push(' ');
				}
			}	

			// now, give numObstacles, I'm going to modify this by +/- X%, randomly
			let totalObstacles = numObstacles + Math.floor(getRandomIntInclusive(-25,25)/100 * numObstacles);
			console.log(`I'll be adding ${totalObstacles} obstacles`);
			let obstacles = 0;
			/*
				This loop will add obs to the plate, but it has to ensure we don't
				put them in a 'buffer' around the player, we don't want to trap them.
				
				Modified to not do the borders either
			*/
			while(obstacles <= totalObstacles) {
				let possibleX = getRandomIntInclusive(1, this.PLATE_SIZE.width-2);
				let possibleY = getRandomIntInclusive(1, this.PLATE_SIZE.height-2);
				if(Math.abs(possibleX - player[0]) < 2 && Math.abs(possibleY - player[1]) > 2) {
					//console.log('bypassing, too close for ',possibleX,possibleY);
					continue;
				}

				
				plate[possibleX][possibleY] = "#";
				obstacles++;
			}
			return plate;
		},
		async loadPlate(loc) {
			console.log('loadPlate', loc);
			return new Promise((resolve, reject) => {
				/* 
				loc is an array, the location of the plate, but we store it as a string
				to keep it simple 
				*/
				loc = loc.join(',');
				let transaction = this.db.transaction(["plates"]);

				let objectStore = transaction.objectStore("plates");
				let request = objectStore.get(loc);
				request.onerror = (event) => {
					console.log("Error loading by pk", event);
				};
				
				request.onsuccess = (event) => {
					console.log("on success", event.target);
					if(event.target.result) resolve(event.target.result.plate);
					else resolve();
				};
			});
		},
		async move(dir) {
			console.log('move',dir, 'player at ', this.playerLocation);

			if(getRandomIntInclusive(1,10) < 3) this.whisperMessage("Your feet are hurting.");
			
			/*
			we need to check for an obstacle block (then end of plate)
			*/
			
			let rightMe = this.plate[this.playerLocation[0]][this.playerLocation[1]+1];
			let leftMe = this.playerLocation[1] !== 0 ? this.plate[this.playerLocation[0]][this.playerLocation[1]-1] : '';
			let aboveMe = this.playerLocation[0] !== 0 ? this.plate[this.playerLocation[0]-1][this.playerLocation[1]] : '';
			let belowMe = this.plate[this.playerLocation[0]+1] ? this.plate[this.playerLocation[0]+1][this.playerLocation[1]] : '';
						
			if(dir === 'up') {
				if(aboveMe === "#") return;
				/*
				so "up" is moving index 0 of location,
				if the value-1 would be zero, we need to move to a N plate
				*/
				if(this.playerLocation[0]-1 === -1) {
					this.movePlate("up");
					return;
				}
				
				this.plate[this.playerLocation[0]][this.playerLocation[1]] = " ";
				this.playerLocation[0]--;
				this.plate[this.playerLocation[0]][this.playerLocation[1]] = "@";
			} else if(dir === 'down') {
				if(belowMe === "#") return;
				if(this.playerLocation[0]+1 === this.PLATE_SIZE.height) {
					this.movePlate("down");
					return;
				}

				this.plate[this.playerLocation[0]][this.playerLocation[1]] = " ";
				this.playerLocation[0]++;
				this.plate[this.playerLocation[0]][this.playerLocation[1]] = "@";
			} else if(dir === 'right') {
				if(rightMe === "#") return;
				if(this.playerLocation[1]+1 === this.PLATE_SIZE.width) {
					this.movePlate("right");
					return;					
				}
				
				this.plate[this.playerLocation[0]][this.playerLocation[1]] = " ";
				this.playerLocation[1]++;
				this.plate[this.playerLocation[0]][this.playerLocation[1]] = "@";
			} else if(dir === 'left') {
				if(leftMe === "#") return;
				if(this.playerLocation[1]-1 === -1) {
					this.movePlate("left");
					return;					
				}

				this.plate[this.playerLocation[0]][this.playerLocation[1]] = " ";
				this.playerLocation[1]--;
				this.plate[this.playerLocation[0]][this.playerLocation[1]] = "@";
			}
		},
		async movePlate(dir) {
			console.log('movePlate', dir, this.playerLocation);
				/*
				given i know the plate location, moving a dir is imply 
				modifying the right x, y value.
				player is the current player location, and we need to start our player
				in the inverse position, ie, if they moved north, they start at the bottom
				*/
							
				if(dir === "up") {
					// lets first get the new player location
					console.log('current player loca', this.playerLocation);
					this.playerLocation[0] = this.PLATE_SIZE.height - 1;
					console.log('new player loc', this.playerLocation);

					//now we get the plate
					console.log('current plate loc', this.plateLocation);
					this.plateLocation[1]++;
					console.log('new plate loc', this.plateLocation);
					this.plate = await this.getPlate(this.plateLocation);

				}	else if(dir === "down") {
					// lets first get the new player location
					console.log('current player loca', this.playerLocation);
					this.playerLocation[0] = 0;
					console.log('new player loc', this.playerLocation);

					//now we get the plate
					console.log('current plate loc', this.plateLocation);
					this.plateLocation[1]--;
					console.log('new plate loc', this.plateLocation);
					this.plate = await this.getPlate(this.plateLocation);

				}	else if(dir === "right") {
					// lets first get the new player location
					console.log('current player loca', this.playerLocation);
					this.playerLocation[1] = 0;
					console.log('new player loc', this.playerLocation);

					//now we get the plate
					console.log('current plate loc', this.plateLocation);
					this.plateLocation[0]++;
					console.log('new plate loc', this.plateLocation);
					this.plate = await this.getPlate(this.plateLocation);

				}	else if(dir === "left") {
					// lets first get the new player location
					console.log('current player loca', this.playerLocation);
					this.playerLocation[1] = this.PLATE_SIZE.width - 1;
					console.log('new player loc', this.playerLocation);

					//now we get the plate
					console.log('current plate loc', this.plateLocation);
					this.plateLocation[0]--;
					console.log('new plate loc', this.plateLocation);
					this.plate = await this.getPlate(this.plateLocation);

				}

			
		},
		async persistPlate(loc, plate) {
			return new Promise((resolve, reject) => {
				let plateRecord = {
					location:loc.join(','),
					plate
					
				}

				let transaction = this.db.transaction(["plates"], "readwrite");
				let store = transaction.objectStore("plates");
				console.log(plateRecord);
				let request = store.put(plateRecord);
				request.onerror = event => {
					console.log("error storing plate", event);
				}
				request.onsuccess = event => {
					console.log("plate stored", event);
					resolve(event);
				}
			});
		},
		whisperMessage(s) {
			this.whisper = s;
			this.showText = true;
			this.$nextTick(() => {
					this.showText = false;
			});
		},
		whisperHeartBeat() {
			console.log('running whisper hb');
			let msg = MSGS[getRandomIntInclusive(0, MSGS.length-1)];
			console.log('selected msg', msg);
			this.whisperMessage(msg);
			setTimeout(() => { this.whisperHeartBeat() }, getRandomIntInclusive(30,90) * 100);
		}
  }))
});

function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min); 
}