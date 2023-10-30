const convertDbObjectToResponseObject = (dbObject) => {
  return {
    PlayerId: dbObject.player_id,
    PlayerName: dbObject.player_name,
  };
};
const convertDbObject2 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

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
    app.listen(3000, () => {
      console.log("SERVER RUNNING AT http://localhost/3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
//get app
app.get("/players/", async (request, response) => {
  const getPlayersArray = `
SELECT
player_id as playerId,
player_name as playerName
FROM
player_details`;
  const playersArray = await db.all(getPlayersArray);
  response.send(playersArray);
});

//api2
app.get("/players/:playerId/", async (request, response) => {
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

//put
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const UpdatePlayerQuery = `UPDATE
player_details SET
player_name = '${playerName}'
WHERE player_id = '${playerId}';`;
  await db.run(UpdatePlayerQuery);
  response.send("Player Details Updated");
});
//api4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
SELECT
*
FROM
match_details
WHERE
match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(convertDbObject2(match));
});
//api5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getAuthorBooksQuery = `
SELECT
match_id as matchId,
match ,
year
FROM
player_match_score NATURAL JOIN
match_details
WHERE
player_id = ${playerId};`;
  const playersArray = await db.all(getAuthorBooksQuery);
  response.send(playersArray);
});
//
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchesQuery = `
 SELECT player_id as playerId,
 player_name as playerName
 FROM 
 player_match_score NATURAL JOIN 
 player_details 
 WHERE match_id = ${matchId};`;
  const matchesArray = await db.all(getPlayerMatchesQuery);
  response.send(matchesArray);
});
//api7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const playerStats = await db.get(getPlayerScored);
  response.send(playerStats);
});
module.exports = app;
