/* eslint-disable
    func-names,
    import/no-extraneous-dependencies,
    import/no-unresolved,
    max-len,
    no-console,
    no-param-reassign,
    no-tabs,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let path = require('path');
require('app-module-path').addPath(path.join(__dirname, '../../'));

const Promise = require('bluebird');
const Canvas = require('canvas');
const moment = require('moment');

const {
  Image,
} = Canvas;
const {
  Font,
} = Canvas;
const fs = require('fs');
path = require('path');
const colors = require('colors');
const plist = require('plist');
const csv = require('csv');
const mkdirp = require('mkdirp');
const _ = require('underscore');

Promise.promisifyAll(fs);

/*
fontFile = (name) ->
	return path.join(__dirname, '/../../app/resources/fonts/', name)

latoFont = new Font('Lato', fontFile("Lato-Regular.ttf"));
latoFont.addFace(fontFile("Lato-Regular.ttf"), 'normal');
latoFont.addFace(fontFile("Lato-Bold.ttf"), 'bold');
latoFont.addFace(fontFile("Lato-Light.ttf"), 'light');
*///
const exportKeysImage = function (key, imgData, dirName) {
  // draw img
  const img = new Image();
  img.src = imgData;

  // generate canvas based on img size
  const canvas = new Canvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  // ctx.addFont(latoFont)
  ctx.imageSmoothingEnabled = false;

  // clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw img
  ctx.drawImage(img, 0, 0, img.width, img.height);

  // key
  const keyText = key.split('').join(' ');
  ctx.textAlign = 'center';
  ctx.font = 'bold 35px Lato';
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.fillText(keyText, 525, 500);

  const fileName = `${key}.png`;
  console.log(`saving ${fileName}`);

  return new Promise((resolve, reject) => {
    // png stream write
    const stream = canvas.pngStream();
    const out = fs.createWriteStream(`${__dirname}/${dirName}/${fileName}`);
    stream.on('data', (chunk) => out.write(chunk));
    return stream.on('end', () => resolve());
  });
};

fs.readFileAsync(`${__dirname}/sarlac_prime.png`)
  .then((imgData) => {
    const parser = csv.parse({ delimiter: ';' }, (err, data) => {
      // generate 5000 keys
      // already generated first 10k
      data = data.slice(10000, 15000);
      return Promise.map(data, ((keyData, index) => {
        const key = keyData[0];
        return exportKeysImage(key, imgData, 'images/', true);
      }), { concurrency: 1 });
    });
    return fs.createReadStream(`${__dirname}/sarlac_prime_codes.csv`).pipe(parser);
  });

/*
  ImageMagick command:
  montage "images/*.png" -tile 2x5 -geometry 1050x600 -density 300x300 -units PixelsPerInch "pages/keys.png" && mogrify -border 225x150 -density 300x300 -units PixelsPerInch "pages/*.png"
*/
