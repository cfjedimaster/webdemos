const fs = require('fs');
const parse = require('csv-parse/lib/sync');
let contents = fs.readFileSync('./cleaned_hm.csv','UTF-8');

let rawData = parse(contents, { from:2, to:5001});

/*
hmid,wid,reflection_period,original_hm,cleaned_hm,modified,num_sentence,ground_truth_category,predicted_category
27673,2053,24h,I went on a successful date with someone I felt sympathy and connection with.,I went on a successful date with someone I felt sympathy and connection with.,True,1,,affection
*/

let data = [];
data = rawData.map(d => {
	return d[4];
});

fs.writeFileSync('./quotes.json', JSON.stringify(data));
console.log('Done - wrote '+data.length+ ' records.');