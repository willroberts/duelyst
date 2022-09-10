/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let path = require('path');
require('app-module-path').addPath(path.join(__dirname, '../../'));

const Promise = require('bluebird');
const Canvas = require('canvas');
const moment = require('moment');
const CanvasText = require('./CanvasText-0.4.1');
const {
    Image
} = Canvas;
const {
    Font
} = Canvas;
const fs = require('fs');
path = require("path");
const SDK = require('../../app/sdk');
const RSX = require('../../app/data/resources');
const colors = require('colors');
const prettyjson = require('prettyjson');
const plist = require('plist');
const GIFEncoder = require('gifencoder');
const _ = require('underscore');

Promise.promisifyAll(fs);

const exportAnimatedGIF = function(cardIdentifier,animationType){

	if (animationType == null) { animationType = "idle"; }
	const scaleFactor = 1.0;
	const padding = 0;

	// set up card info
	const card = SDK.CardFactory.cardForIdentifier(cardIdentifier, SDK.GameSession.current());

	console.log(_.keys(card.getBaseAnimResource()));

	// idle animation resource name
	const idleAnimationName = card.getBaseAnimResource()[animationType];

	// idle animation resource
	const idleAnimationResource = RSX[idleAnimationName];

	// if file already exists, skip
	const filePath = `${__dirname}/images/parts/${idleAnimationResource.framePrefix.slice(0,-1)}.gif`;
	try {
		if (fs.statSync(filePath)) {
			return Promise.resolve();
		}
	} catch (error) {}

	if ((idleAnimationResource == null)) {
		console.log(`ERROR loading anim resourse for ${card.getName()}`);
		return Promise.resolve();
	}

	// GIF encoder
	let gifencoder = null;

	// start by loading the PLIST file for the animation resource
	return fs.readFileAsync(`${__dirname}/../../app/${idleAnimationResource.plist}`,'utf-8')
	.then(plistFileXml => //console.log "loaded PLIST".cyan
    Promise.all([
        plist.parse(plistFileXml),
        fs.readFileAsync(`${__dirname}/../../app/${idleAnimationResource.img}`)
    ])).spread(function(animationData,cardSpriteSheet){

		// draw card bg
		const cardImg = new Image;
		cardImg.src = cardSpriteSheet;

		//console.log(idleAnimationResource.framePrefix)

		_.chain(animationData["frames"]).keys().each(function(k){
			if ((k.indexOf(idleAnimationResource.framePrefix) !== 0) || (k.replace(idleAnimationResource.framePrefix,"").length > 8)) {
				//console.log("found frame to delete at #{k}")
				return delete animationData["frames"][k];
			}});

		// idleAnimationFrames = _.filter(animationData["frames"],(v,k)->
		// 	return k.indexOf(idleAnimationResource.framePrefix) == 0
		// )

		const allFrameKeys = _.keys(animationData["frames"]);

		const frameSize = JSON.parse(animationData["frames"][allFrameKeys[0]].sourceSize.replace(/{/g,"[").replace(/}/g,"]"));

		const width = frameSize[0];
		const height = frameSize[1];

		gifencoder = new GIFEncoder(width + (padding*2), height + (padding*2));
		gifencoder.createReadStream().pipe(fs.createWriteStream(filePath));
		gifencoder.start();
		gifencoder.setRepeat(0);
		gifencoder.setDelay(1000/16);
		gifencoder.setQuality(1);
		// gifencoder.setTransparent(0xff00ff)

		const saved = false;

		return Promise.each(allFrameKeys, function(idleFrameKey){

			// generate canvas based on bg size
			const canvas = new Canvas(width + (padding*2), height + (padding*2));
			const ctx = canvas.getContext('2d');
			ctx.imageSmoothingEnabled = false;

			const idleFrame = JSON.parse(animationData["frames"][idleFrameKey]["frame"].replace(/{/g,"[").replace(/}/g,"]"));

			// clear canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = 'rgba(4,50,71,255)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// draw card img
			let cardImgYPosition = padding + (scaleFactor*0); // - scaleFactor*idleFrame[1][1]*2
			if (card.type !== SDK.CardType.Unit) { cardImgYPosition = padding+(scaleFactor*25); }
			ctx.drawImage(
				cardImg,
				idleFrame[0][0], // sX
				idleFrame[0][1], // sY
				idleFrame[1][0], // sWidth
				idleFrame[1][1], // sHeight
				(canvas.width/2) - ((scaleFactor*idleFrame[1][0])/2), // dx
				canvas.height - (scaleFactor*idleFrame[1][1]), // dy
				// cardImgYPosition, # dy
				scaleFactor*idleFrame[1][0], // dw
				scaleFactor*idleFrame[1][1] // dh
			);
			// add frame to animated gif
			gifencoder.addFrame(ctx);
			return Promise.resolve();
		});}).then(() => gifencoder.finish()).catch(function(e){
		console.error(`error exporting card ${card.name}`, e);
		throw e;
	});
};

const cards = _.filter(SDK.CardFactory.getAllCards(SDK.GameSession.current()), c => c.getFactionId() === SDK.Factions.Faction5);

const processCard = card => Promise.all([
    exportAnimatedGIF(card.id,"attack"),
    exportAnimatedGIF(card.id,"breathing"),
    exportAnimatedGIF(card.id,"death"),
    exportAnimatedGIF(card.id,"damage"),
    exportAnimatedGIF(card.id,"idle"),
    exportAnimatedGIF(card.id,"walk")
]);

Promise.map([
	{id:SDK.Cards.Faction5.Gro},
	{id:SDK.Cards.Faction2.Xho},
], processCard, {concurrency:5}).then(() => // we're done
// time to run mogrify -transparent "#043247" -set dispose previous *.gif
console.log("DONE".green));
