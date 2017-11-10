var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var converter = require('steam-id-convertor');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
	colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
		token: auth.token,
		autorun: true
	});
bot.on('ready', function (evt) {
	logger.info('Connected');
	logger.info('Logged in as: ');
	logger.info(bot.username + ' - (' + bot.id + ')');
});
const https = require("https");
const heroStatsUrl =
	"https://api.opendota.com/api/herostats";

function doProfileStats( steam32ID,channelID, steam64ID){
	var wins = "";
	var loss = "";
	https.get("https://api.opendota.com/api/players/" + steam32ID , res => {
		res.setEncoding("utf8");
		let body = "";
		res.on("data", data => {
			body += data;
		});
		res.on("end", () => {
			body = JSON.parse(body);

			console.log(wins);
			https.get("https://api.opendota.com/api/players/" + steam32ID+ "/wl", res => {

				res.setEncoding("utf8");
				let body2 = "";
				res.on("data", data2 => {
					body2 += data2;
				});
				res.on("end", () => {
					body2 = JSON.parse(body2);
					if(body.profile==undefined){
							console.log("profile not found");
						bot.sendMessage({
							to: channelID,
							message: "No tracked profile on OpenDota."

						});
						return;
					}
					wins = body2.win;
					loss = body2.lose;
						console.log(body.profile.account_id);


						bot.sendMessage({
														to: channelID,
														message: "Your wish is my command!",
														embed: {
															title: "Steam",
															url: "http://steamcommunity.com/id/"+steam64ID,
															description: "[OpenDota](https://www.opendota.com/players/" + body.profile.account_id+")",
															thumbnail: {
																url: body.profile.avatarfull+""
															},
															fields: [{
																	name: "Name",
																	value: body.profile.personaname+""
																}, {
																	name: "Estimated MMR",
																	value: body.mmr_estimate.estimate+""
																}, {
																	name: "Win/Loss",
																	value: "Wins: " + wins + " Losses: " + loss
																}
															]
														}
													}, function (error, response) {
														console.log(error);
														console.log(response);
													});





				});
			});


	});
	});

}
bot.on('message', function (user, userID, channelID, message, evt) {
	// Our bot needs to know if it will execute a command
	// It will listen for messages that will start with `!`
	if (message.substring(0, 1) == '!') {
		var args = message.substring(1).split(' ');
		var cmd = args[0];

		args = args.splice(1);
		switch (cmd) {
			// !ping
		case 'ping':
			bot.sendMessage({
				to: channelID,
				message: 'Pong!'
			});
			break;
		case 'help':
			bot.sendMessage({
				to: channelID,
				message: "Hey " + user.toString() + ", here's what I can do.You can say:\n `!ping` to see if the bot is online.\n `!herostats <hero-id>` to see hero stats.\n`!dotaProfile <steam id (custom or not)>` to get basic info."
			});
			break;
		case 'dotaProfile':

			var playerID = message.substring(message.indexOf(' ') + 1);
			console.log(playerID);
			var steam64ID = 0;
			https.get("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key="+auth.steamKey+"&vanityurl="+playerID, res => {
				res.setEncoding("utf8");
				let bodySteam = "";
				res.on("data", steamData => {
					bodySteam += steamData;
				});
				res.on("end", () => {
					bodySteam = JSON.parse(bodySteam);
					console.log("sucess = "+bodySteam.response.success);
					if(bodySteam.response.success===1){
						console.log("steamid = "+bodySteam.response.steamid);
						steam64ID = (bodySteam.response.steamid);
						var steam32ID = converter.to32(bodySteam.response.steamid);
						console.log("steam32ID="+steam32ID);
						doProfileStats(steam32ID,channelID,playerID);

					}
					else{

						https.get("https://api.steampowered.com/isteamuser/getplayersummaries/v0002/?key="+auth.steamKey+"&steamids="+playerID, res => {
							res.setEncoding("utf8");
							let bodySteam2 = "";
							res.on("data", steamData2 => {
								bodySteam2 += steamData2;
							});
							res.on("end", () => {
								//console.log(bodySteam2);
								bodySteam2 = JSON.parse(bodySteam2);

								if(bodySteam2.response.players.length==0){
									bot.sendMessage({
										to: channelID,
										message: "No players found."

									});
									return;
								}
								else{
									steam64ID = playerID;
									var steam32ID = converter.to32(playerID);
									console.log("steam32ID="+steam32ID);

									doProfileStats(steam32ID,channelID,steam64ID);
								}
							});
						});
					}











				});
			});

			break;
		case 'herostats':
			var heroID = message.substring(message.indexOf(' ') + 1);
			console.log(heroID);

			https.get(heroStatsUrl, res => {
				res.setEncoding("utf8");
				let body = "";
				res.on("data", data => {
					body += data;
				});
				res.on("end", () => {
					body = JSON.parse(body);

					var index = heroID - 1;
					var messageSend = "";

					if ((heroID > 114 || heroID <= 0) && !(heroID == 119 || heroID == 120)) {

						bot.sendMessage({
							to: channelID,
							message: "Hey " + user.toString() + ", that's not a valid hero."

						});
						return;
					}

					if (heroID == 119) {
						index = 113;

					}
					if (heroID == 120) {
						index = 114;

					}
					var attribute = body[index].primary_attr;
					if (attribute.valueOf() == "str") {
						attribute = "strength";
					} else if (attribute.valueOf() == "int") {
						attribute = "intelligence";
					} else {
						attribute = "agility";
					}
					messageSend = "Hey " + user.toString() + ", " +
						body[index].localized_name

						 + " is a " +
						body[index].attack_type

						.toLowerCase() + " " + attribute + " hero with " +
						body[index].legs

						 + " legs.";
					bot.sendMessage({
						to: channelID,
						message: messageSend

					});
				});
			});
			break;
			// Just add any case commands if you want to..
		}
	}
});
