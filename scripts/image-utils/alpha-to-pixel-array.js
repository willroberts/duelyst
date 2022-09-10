/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const util = require('util');
const getPixels = require("get-pixels");

getPixels(`${__dirname}/../../app/resources/scenes/shimzar/lights_right.jpg`, function(err, pixels){
	if(err) {
		console.log("Bad image path");
		return;
	}
	console.log("got pixels", pixels.shape.slice());

	const arr = [];

	for (let x = 0, end = pixels.shape[0], asc = 0 <= end; asc ? x <= end : x >= end; asc ? x++ : x--) {
		for (let y = 0, end1 = pixels.shape[1], asc1 = 0 <= end1; asc1 ? y <= end1 : y >= end1; asc1 ? y++ : y--) {
			const r = pixels.get(x,y,0);
			const g = pixels.get(x,y,1);
			const b = pixels.get(x,y,2);
			const val = (r + g + b) / 3;
			if (val > 50) {
				arr.push({x,y:pixels.shape[1] - y});
			}
		}
	}

	return console.log(util.inspect(arr, { maxArrayLength: null }));
});
