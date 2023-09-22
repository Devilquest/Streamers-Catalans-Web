var spreadsheetID = "YourSpreadsheetID";
var twitchApiClientID = 'YourTwitchApiClientID';
var secret = 'YourSecretApiID';

var url = "https://spreadsheets.google.com/feeds/list/" + spreadsheetID + "/1/public/values?alt=json";

var streamersCatalans = [];
var liveStreamersCatalans = [];

var urlRequestLimit = 100;

$(document).ready(function(){
	$("#loading").show();
	$("#streams").hide();
	
	$.getJSON(url, function(data) {
		var streamersNamesLists = [];
		var tempStreamersNamesLists = [];
		var entries = data.feed.entry;
		
		for(var i=0; i < entries.length; i++){
			var streamerLogin = cleanString(entries[i].gsx$twitchname.$t);
			if (streamerLogin.length >= 3){
				tempStreamersNamesLists.push(streamerLogin);
				if(i > 0 && entries.length > urlRequestLimit && (i+1)%urlRequestLimit == 0){
					streamersNamesLists.push(tempStreamersNamesLists);
					tempStreamersNamesLists = [];
				}
			}
		}
		streamersNamesLists.push(tempStreamersNamesLists);
		var tempNamesUrlString = "";

		if(streamersNamesLists[0].length > 0){
			var namesUrlString = [];
			
			for(i=0; i < streamersNamesLists.length; i++){
				for(var j=0; j < streamersNamesLists[i].length; j++){
					tempNamesUrlString += "login=" + streamersNamesLists[i][j];

					if(j < streamersNamesLists[i].length - 1){
						tempNamesUrlString += "&";
					}
				}
				namesUrlString.push(tempNamesUrlString);
				tempNamesUrlString = "";
			}
			getStreamInfo(namesUrlString);
		}else{
			console.log("Something went wrong!");
		}
	});
});

function getStreamInfo(streamersNamesUrlArray){
	$.ajax({
		type: "POST",
		url: "https://id.twitch.tv/oauth2/token",
		data: {'client_id': twitchApiClientID, 'client_secret': secret, 'grant_type' : 'client_credentials'},
		success: function(appToken){
			for(var i=0; i < streamersNamesUrlArray.length; i++){
				$.ajax({
					type: "GET",
					url: "https://api.twitch.tv/helix/users?" + streamersNamesUrlArray[i].toLowerCase(),
					headers:{
						'Client-ID': twitchApiClientID,
						'Authorization': 'Bearer ' + appToken['access_token']
					},
					error: function(retorn){
						console.log("Something went wrong! 1");
					},
					success: function(receivedUserInfo){
						var userIDsUrlString = "";
						if(receivedUserInfo.data[0] != null){
							for(var i=0; i < receivedUserInfo.data.length; i++){
								streamersCatalans.push([
									receivedUserInfo.data[i].id, //0 id
									receivedUserInfo.data[i].login, //1 login
									receivedUserInfo.data[i].display_name, //2 display_name
									receivedUserInfo.data[i].profile_image_url //3 profile_image_url
								]);

								userIDsUrlString += "user_id=" + receivedUserInfo.data[i].id;
								if(i < receivedUserInfo.data.length - 1)
									userIDsUrlString += "&";
							}

							$.ajax({
								type: "GET",
								url: "https://api.twitch.tv/helix/streams?" + userIDsUrlString,
								headers:{
									'Client-ID': twitchApiClientID,
									'Authorization': 'Bearer ' + appToken['access_token']
								},
								error: function(returnval) {
									console.log("Something went wrong! 2");
								},
								success: function(receivedStreamInfo){
									if(receivedStreamInfo.data[0] != null){
										var gamesIDsUrlString = "";
										for(i=0; i < receivedStreamInfo.data.length; i++){
											for(var j=0; j < streamersCatalans.length; j++){
												if(receivedStreamInfo.data[i].user_id == streamersCatalans[j][0]){
													liveStreamersCatalans.push([
														streamersCatalans[j][0], //0 id
														streamersCatalans[j][1], //1 login
														streamersCatalans[j][2], //2 display_name
														streamersCatalans[j][3], //3 profile_image_url
														receivedStreamInfo.data[i].title, //4 stream title
														receivedStreamInfo.data[i].viewer_count, //5 viewer_count
														receivedStreamInfo.data[i].thumbnail_url, //6 stream thumbnail_url
														receivedStreamInfo.data[i].game_id, ////7 gameID
														null, //8 game name
														null //9 game box_art_url
													]);
													break;
												}
											}
											gamesIDsUrlString += "id=" + receivedStreamInfo.data[i].game_id;
											if(i < receivedStreamInfo.data.length - 1)
												gamesIDsUrlString += "&";
										}
										
										$.ajax({
											type: "GET",
											url: "https://api.twitch.tv/helix/games?" + gamesIDsUrlString,
											headers:{
												'Client-ID': twitchApiClientID,
												'Authorization': 'Bearer ' + appToken['access_token']
											},
											success: function(receivedGameInfo){
												if(receivedGameInfo.data[0] != null){
													for(i=0; i < receivedGameInfo.data.length; i++){
														for(j=0; j < liveStreamersCatalans.length; j++){
															if(receivedGameInfo.data[i].id == liveStreamersCatalans[j][7]){
																liveStreamersCatalans[j][8] = receivedGameInfo.data[i].name; //8 game name
																liveStreamersCatalans[j][9] = receivedGameInfo.data[i].box_art_url; //9 game box_art_url
															}
														}
													}
												}
											}
										});
									}
								}
							});
						}
					}
				});
			}
		}
	});
}

$(document).ajaxStop(function () {
	var $rowDiv;
	var twitchUrl;
	
	if(liveStreamersCatalans.length > 0){	
		liveStreamersCatalans.sort(orderByColumn(5, false));
		$rowDiv = $("<div>", {"class": "row"});
	
		for(var i=0; i < liveStreamersCatalans.length; i++){
			twitchUrl = createTwitchURL(liveStreamersCatalans[i][2]);
			
			var onlineStreamerCard = "<div class=\"col-md-4\">";
					onlineStreamerCard += "<div class=\"row\">";
						onlineStreamerCard += "<div class=\"col\">";
							onlineStreamerCard += "<a href=\"" + twitchUrl + "\" target=\"_blank\">";
								onlineStreamerCard += "<div class=\"thumbnail-wrapper\">";
									onlineStreamerCard += "<div class=\"rounded thumbnail-over-info live\">";
										onlineStreamerCard += "<p class=\"m-0 text-white font-weight-bold\">En Directe</p>";
									onlineStreamerCard += "</div>";
									onlineStreamerCard += "<div class=\"rounded thumbnail-over-info count\">";
										onlineStreamerCard += "<p class=\"m-0 text-white\">" + liveStreamersCatalans[i][5] + " espectadors</p>";
									onlineStreamerCard += "</div>";
									onlineStreamerCard += "<img class=\"thumbnail-img\" alt=\"" + liveStreamersCatalans[i][4] + "\" src=\"" + replaceWidthAndHeight(liveStreamersCatalans[i][6], 440, 248) + "\"/>";
								onlineStreamerCard += "</div>";
							onlineStreamerCard += "</a>";
						onlineStreamerCard += "</div>";
					onlineStreamerCard += "</div>";
					onlineStreamerCard += "<div class=\"row pt-2\">";
						onlineStreamerCard += "<div class=\"col-2 pr-0\">";
							onlineStreamerCard += "<a href=\"" + twitchUrl + "/videos/all\" target=\"_blank\">";
								onlineStreamerCard += "<div class=\"profile-img-wrapper\">";
									onlineStreamerCard += "<img class=\"w-100\" alt=\"" + liveStreamersCatalans[i][2] + "\" src=\"" + liveStreamersCatalans[i][3] + "\"/>";
								onlineStreamerCard += "</div>";
							onlineStreamerCard += "</a>";
						onlineStreamerCard += "</div>";
						onlineStreamerCard += "<div class=\"col-10 pl-1\">";
							onlineStreamerCard += "<h3 class=\"text-truncate stream-title\"><a class=\"text-truncate\" href=\"" + twitchUrl + "\" target=\"_blank\" title=\"" + liveStreamersCatalans[i][4] + "\">" + liveStreamersCatalans[i][4] + "</a></h3>";
							onlineStreamerCard += "<p class=\"text-truncate text-capitalize stream-info\"><a href=\"" + twitchUrl + "/videos/all\" target=\"_blank\">" + liveStreamersCatalans[i][2] + "</a></p>";
							if(liveStreamersCatalans[i][8] && liveStreamersCatalans[i][9]){
								onlineStreamerCard += "<p class=\"text-truncate stream-info\"><a href=\"https://www.twitch.tv/directory/game/" + liveStreamersCatalans[i][8] +"\" target=\"_blank\" data-toggle=\"tooltip\" title=\"<img class='img-thumbnail' src='" + replaceWidthAndHeight(liveStreamersCatalans[i][9], 150, 200) + "'/>\">" + liveStreamersCatalans[i][8] + "</a></p>";
							}
						onlineStreamerCard += "</div>";
					onlineStreamerCard += "</div>";
				onlineStreamerCard += "</div>";

			if(i > 0 && i%3 == 0)
				$rowDiv = $("<div>", {id: 'some-id-'+i, "class": "row mt-4"});

			$rowDiv.append(onlineStreamerCard);
			$("#onlineStreams").append($rowDiv);
		}
		
		$("#multitwitchLink").html(createMultitwitchLink(liveStreamersCatalans));
		$("#onlineStreamsH3").html("Directes en Català (" + liveStreamersCatalans.length + ")");
	}else{
		$("#multitwitchLink").hide();
		$("#onlineStreamsH3").html("No hi ha canals en directe");
	}
	
	if(streamersCatalans.length > 0){
		streamersCatalans.sort(orderByColumn(1));
		
		$rowDiv = $("<div>", {"class": "row"});
		
		for(i=0; i < streamersCatalans.length; i++){
			twitchUrl = createTwitchURL(streamersCatalans[i][1]);
			
			var offlineStreamerCard ="<div class=\"col-md-4\">";
					offlineStreamerCard +="<div class=\"row\">";
						offlineStreamerCard +="<div class=\"col-auto pl-0 pr-2\">";
							offlineStreamerCard +="<a href=\"" + twitchUrl + "\" target=\"_blank\">";
								offlineStreamerCard +="<div class=\"offline-profile-img-wrapper\">";
									offlineStreamerCard +="<img class=\"w-100\" alt=\"" + streamersCatalans[i][2] + "\" src=\"" + streamersCatalans[i][3] + "\"/>";
								offlineStreamerCard +="</div>";
							offlineStreamerCard +="</a>";
						offlineStreamerCard +="</div>";
						offlineStreamerCard +="<div class=\"col-9 p-0 align-self-center overflow-hidden offline-sretamer-name\">";
							offlineStreamerCard +="<a class=\"text-capitalize\" href=\"" + twitchUrl + "\" target=\"_blank\">" + streamersCatalans[i][2] + "</a>";
						offlineStreamerCard +="</div>";
					offlineStreamerCard +="</div>";
				offlineStreamerCard +="</div>";
			
			if(i > 0 && i%3 == 0)
				$rowDiv = $("<div>", {id: 'some-id-'+i, "class": "row mt-2"});
			
			$rowDiv.append(offlineStreamerCard);
			$("#offlineStreams").append($rowDiv);
			
		}
		
		$("#offlineStreamsH3").html("Streamers Catalans (" + streamersCatalans.length + ")");
	}
	
	$('a[data-toggle="tooltip"]').tooltip({
		animated: 'fade',
		placement: 'top',
		html: true
	});
	
	$("#loading").hide();
	$("#streams").show();
});

function replaceWidthAndHeight(url, width, height){
	var replecedUrl = url.replace("{width}", width); //440
	replecedUrl = replecedUrl.replace("{height}", height); //248
	return replecedUrl;
}

function createTwitchURL(login){
	return "https://www.twitch.tv/" + login;
}

function createMultitwitchLink(infoArray){
	var link = "http://www.multitwitch.tv";
	
	for(var i=0; i < infoArray.length; i++){
		link += "/" + infoArray[i][1];
	}
	
	return "<a href=\""+ link +"\" target=\"_blank\" title=\"" + link + "\">Canals en directe MultiTwitch Link</a>"
}

function cleanString(string){
	var cleanString = string.replace(/(\r\n|\n|\r)/gm,"");
	cleanString = cleanString.replace(/[|&;$%@"<>()+,.!¡?¿ ]/g, "");
	return cleanString.trim();
}

function orderByColumn(column, ASC=true) {
	return function(a,b){
		if (a[column] === b[column]) {
			return 0;
		}else {
			if(ASC)
				return (a[column] < b[column]) ? -1 : 1;
			else
				return (a[column] > b[column]) ? -1 : 1;
		}
	}
}