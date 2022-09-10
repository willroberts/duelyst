/* eslint-disable
    camelcase,
    import/extensions,
    import/order,
    no-console,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// region Requires
// Configuration object
const config = require('../../config/config.js');
const Firebase = require('firebase');
const _ = require('underscore');
const moment = require('moment');

const fbRef = new Firebase(config.get('firebase'));
const util = require('util');
const fs = require('fs');

// Firebase secure token for duelyst-dev.firebaseio.com
const firebaseToken = config.get('firebaseToken');
const DuelystFirebase = require('../../server/lib/duelyst_firebase_module');
const fbUtil = require('../../app/common/utils/utils_firebase.js');
// endregion Requires

// Begin script execution

DuelystFirebase.connect().getRootRef()
  .then((fbRootRef) => {
    const newsItem = {
      title: 'March 2016 Season Patch', // "News Title #{moment().format("HH:mm:ss")}"
      type: 'announcement',
      content: fs.readFileSync(`${__dirname}/content.md`).toString(),
      created_at: moment().valueOf(),
    };

    console.log('adding news item: ', util.inspect(newsItem));

    const item = fbRootRef.child('news').child('index').push();
    const created_at = moment().valueOf();
    item.setWithPriority(
      {
        title: newsItem.title,
        type: newsItem.type,
        created_at: newsItem.created_at,
      },
      newsItem.created_at,
    );
    return fbRootRef.child('news').child('content').child(item.key()).setWithPriority(
      {
        title: newsItem.title,
        content: newsItem.content,
        created_at: newsItem.created_at,
      },
      newsItem.created_at,
    );
  });
