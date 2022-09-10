/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const knex = require('../../server/lib/data_access/knex');
const moment = require('moment');
const csvWriter = require('csv-write-stream');
const pg = require('pg');
const config = require('../../config/config');
const fs = require('fs');

/*
-- DROP TABLE temp_cohort;
-- DROP TABLE temp_day_games;

CREATE TEMP TABLE temp_cohort AS SELECT
	users.id,
	users.created_at,
	users.last_session_at,
	users.session_count,
	user_progression.game_count,
	user_progression.win_count,
	user_progression.loss_count,
	EXTRACT(epoch FROM last_session_at-created_at)/86400 as lasted
	FROM users
	LEFT JOIN user_progression ON users.id = user_progression.user_id
WHERE created_at > '#{dateMoment.format('YYYY-MM-DD')}' AND created_at <= '#{dateMomentTomorrow.format('YYYY-MM-DD')}';

CREATE TEMP TABLE temp_day_games AS SELECT COUNT(*) as games, SUM(case when is_winner then 1 else 0 end) as wins, user_id FROM user_games
	WHERE user_id IN (SELECT id FROM temp_cohort) AND created_at > '#{dateMoment.format('YYYY-MM-DD')}' AND created_at <= '#{dateMomentTomorrow.format('YYYY-MM-DD')}'
	AND NOT game_type = 'single_player' GROUP BY user_id ORDER BY games DESC;

CREATE TEMP TABLE temp_day_single_player_games AS SELECT COUNT(*) as games, SUM(case when is_winner then 1 else 0 end) as wins, user_id FROM user_games
	WHERE user_id IN (SELECT id FROM temp_cohort) AND created_at > '#{dateMoment.format('YYYY-MM-DD')}' AND created_at <= '#{dateMomentTomorrow.format('YYYY-MM-DD')}'
	AND game_type = 'single_player' GROUP BY user_id ORDER BY games DESC;

SELECT
	temp_cohort.id,
	temp_cohort.created_at,
	temp_cohort.last_session_at,
	temp_cohort.session_count,
	FLOOR(EXTRACT(epoch FROM temp_cohort.last_session_at-temp_cohort.created_at)/86400) as days_lasted,
	temp_day_games.wins,
	temp_day_games.games,
	temp_day_single_player_games.wins as practice_wins,
	temp_day_single_player_games.games as practice_games
FROM temp_cohort
	LEFT JOIN temp_day_games ON temp_cohort.id = temp_day_games.user_id
	LEFT JOIN temp_day_single_player_games ON temp_cohort.id = temp_day_single_player_games.user_id;
*/

let counter = 0;

var processDate = function(dateMoment){

	counter++;
	if (counter === 28) {
		return setTimeout(() => process.exit(0)
		,2000);
	}

	const dateMomentTomorrow = moment(dateMoment).add(1,'days');

	console.log(`processing from ${dateMoment.format()} to ${dateMomentTomorrow.format()}`);

	const sql = `CREATE TEMP TABLE temp_cohort AS SELECT users.id, users.created_at, users.last_session_at, users.session_count, user_progression.game_count, user_progression.win_count, user_progression.loss_count, EXTRACT(epoch FROM last_session_at-created_at)/86400 as lasted FROM users LEFT JOIN user_progression ON users.id = user_progression.user_id WHERE created_at > '${dateMoment.format('YYYY-MM-DD')}' AND created_at <= '${dateMomentTomorrow.format('YYYY-MM-DD')}'; CREATE TEMP TABLE temp_day_games AS SELECT COUNT(*) as games, SUM(case when is_winner then 1 else 0 end) as wins, user_id FROM user_games WHERE user_id IN (SELECT id FROM temp_cohort) AND created_at > '${dateMoment.format('YYYY-MM-DD')}' AND created_at <= '${dateMomentTomorrow.format('YYYY-MM-DD')}' AND NOT game_type = 'single_player' GROUP BY user_id ORDER BY games DESC; CREATE TEMP TABLE temp_day_single_player_games AS SELECT COUNT(*) as games, SUM(case when is_winner then 1 else 0 end) as wins, user_id FROM user_games WHERE user_id IN (SELECT id FROM temp_cohort) AND created_at > '${dateMoment.format('YYYY-MM-DD')}' AND created_at <= '${dateMomentTomorrow.format('YYYY-MM-DD')}' AND game_type = 'single_player' GROUP BY user_id ORDER BY games DESC; SELECT temp_cohort.id, temp_cohort.created_at, temp_cohort.last_session_at, temp_cohort.session_count, FLOOR(EXTRACT(epoch FROM temp_cohort.last_session_at-temp_cohort.created_at)/86400) as days_lasted, temp_day_games.wins, temp_day_games.games, temp_day_single_player_games.wins as practice_wins, temp_day_single_player_games.games as practice_games FROM temp_cohort LEFT JOIN temp_day_games ON temp_cohort.id = temp_day_games.user_id LEFT JOIN temp_day_single_player_games ON temp_cohort.id = temp_day_single_player_games.user_id; DROP TABLE temp_cohort; DROP TABLE temp_day_games; DROP TABLE temp_day_single_player_games;`;

	return pg.connect("postgres://"+config.get('postgres_connection_string'), function(err, client, done){
		if(err) {
			return console.error('error fetching client from pool', err);
		}

		return client.query(sql, function(err, resp){
			done();

			if(err) {
				return console.error('error running query', err);
			}

			console.log("row count: ", resp.rowCount);

			if (resp.rows[0]) {
				const writer = csvWriter({sendHeaders: true, headers: [
					"id",
					"created_at",
					"last_session_at",
					"session_count",
					"days_lasted",
					"wins",
					"games",
					"practice_wins",
					"practice_games"
				]});
				writer.pipe(fs.createWriteStream(`${dateMoment.format('YYYY-MM-DD')}.csv`));
				for (let row of Array.from(resp.rows)) {
					writer.write(row);
				}
				console.log(`done with ${dateMoment.format('YYYY-MM-DD')}`);
				processDate(dateMomentTomorrow);
				return writer.end();
			}
		});
	});
};
				// process.exit(0)

processDate(moment.utc('2016-02-01'));
