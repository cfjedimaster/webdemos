// source: https://en.wikipedia.org/wiki/Category:The_Cure_songs

let input = 
[
  "And Then...",
  "Barrel of a Gun",
  "Behind the Wheel",
  "Blasphemous Rumours / Somebody",
  "Blue Dress",
  "Boys Say Go!",
  "Condemnation",
  "Corrupt",
  "Cover Me",
  "The Darkest Star",
  "Dream On",
  "Dreaming of Me",
  "Enjoy the Silence",
  "Eternal",
  "Everything Counts",
  "Fail",
  "Fragile Tension / Hole to Feed",
  "Freelove",
  "Get the Balance Right!",
  "Going Backwards",
  "Goodnight Lovers",
  "Heaven",
  "Home",
  "I Feel Loved",
  "I Feel You",
  "I Sometimes Wish I Was Dead",
  "In Chains",
  "In Your Room",
  "It's Called a Heart",
  "It's No Good",
  "John the Revelator / Lilian",
  "Just Can't Get Enough",
  "The Landscape is Changing",
  "Leave in Silence",
  "Little 15",
  "Love, in Itself",
  "Martyr",
  "Master and Servant",
  "The Meaning of Love",
  "More Than a Party",
  "My Secret Garden",
  "Never Let Me Down Again",
  "New Life",
  "No More (This Is the Last Time)",
  "Nodisco",
  "Only When I Lose Myself",
  "A Pain That I'm Used To",
  "Peace",
  "People Are People",
  "Perfect",
  "Personal Jesus",
  "Poison Heart",
  "Policy of Truth",
  "Poorman",
  "Precious",
  "Puppets",
  "A Question of Lust",
  "A Question of Time",
  "Route 66",
  "Scum",
  "See You",
  "Shake the Disease",
  "Should Be Higher",
  "Shouldn't Have Done That",
  "So Much Love",
  "Soothe My Soul",
  "Strangelove",
  "Stripped",
  "Suffer Well",
  "Told You So",
  "Tora! Tora! Tora!",
  "Two Minute Warning",
  "Useless",
  "Walking in My Shoes",
  "Where's the Revolution",
  "World in My Eyes",
  "The Worst Crime",
  "Wrong",
  "You Move"
];

var generator = titlegen.create();
generator.feed(input);

const app = new Vue({
	el:'#app',
	data() {
		return {
			title:""
		}
	},
	created() {
		this.newTitle();
	},
	methods: {
		newTitle() {
			console.log('generating cureness');
			this.title = generator.next();
		}
	}
});

/*
var generator = titlegen.create();


input = input.split('\n');
generator.feed(input);
 
console.log(generator.next()); 
*/