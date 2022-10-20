const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(2000, () => {
      console.log("server running at http://localhost:2000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertPlayerObject = (player) => {
  return {
    playerId: `${player.player_id}`,
    playerName: `${player.player_name}`,
  };
};
const convertMatchObject = (match) => {
  return {
    matchId: `${match.match_id}`,
    match: `${match.match}`,
    year: `${match.year}`,
  };
};
const convertDistrict = (district) => {
  return {
    districtId: `$(district.district_id)`,
    districtName: `$(district.district_name)`,
    stateId: `$(district.state_id)`,
    cases: `$(district.cases)`,
    cured: `$(district.cured)`,
    active: `$(district.active)`,
    deaths: `$(district.deaths)`,
  };
};

//API1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT player_id as playerId,
    player_name as playerName
    FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});
//API 2
app.get(`/players/:playerId/`, async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
      player_id as playerId,
      player_name as playerName
    FROM
      player_details
    WHERE
      player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});
//API 3
app.put(`/players/:playerId/`, async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE
      player_details(player_name)
    SET
      (
        player_name='${playerName}',
        
      )
      WHERE player_id=${playerId};`;

  const dbResponse = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
//API 4
app.get(`/matches/:matchId/`, async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
      match_id as matchId,
      match,year
    FROM
      match_details
    WHERE
      match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(match);
});
//API 5
app.get(`/players/:playerId/matches/`, async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
      match_id as matchId,
      match,year
    FROM
      match_details
    WHERE
      match_id IN (SELECT match_id
        FROM player_match_score
        WHERE player_id=${playerId})`;
  const playerMatchesArray = await db.all(getPlayerMatchesQuery);
  response.send(playerMatchesArray);
});
//API 6
app.get(`/matches/:matchId/players/`, async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `
    SELECT player_id as playerId,
    player_name as playerName
    FROM player_details
    WHERE player_id IN (
        SELECT player_id
        FROM player_match_score
        WHERE match_id=${matchId});`;
  const PlayersOfMatch = await db.all(getPlayersOfMatchQuery);
  response.send(PlayersOfMatch);
});
//API 7
app.get(`/players/:playerId/playerScores/`, async (request, response) => {
  const { playerId } = request.params;
  const getplayerStatsQuery = `
    SELECT player_match_score.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM player_match_score INNER JOIN player_details ON player_match_score.player_id=player_details.player_id
    WHERE player_match_score.player_id=${playerId}
    GROUP BY player_match_score.player_id;
    `;
  const playerStats = await db.get(getplayerStatsQuery);
  response.send(playerStats);
});
module.exports = app;
