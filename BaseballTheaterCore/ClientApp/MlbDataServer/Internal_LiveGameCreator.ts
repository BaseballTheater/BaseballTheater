﻿import {LiveData, PlayerListResponse} from "./Contracts";
import Internal_DataLoader from "./Utils/Internal_DataLoader";
import * as moment from "moment/moment";
import {ISchedule, ITeamDetails} from "@MlbDataServer/Contracts/TeamSchedule";

export default class Internal_LiveGameCreator
{
	public async getLiveGame(gameId: number | string)
	{
		const liveGameUrl = `http://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`;

		return await Internal_DataLoader.loadJson<LiveData>(liveGameUrl, "liveGame");
	}

	public async getGameMedia(gameId: number | string)
	{
		const mediaUrl = `https://statsapi.mlb.com/api/v1/game/${gameId}/content?language=en`;

		return await Internal_DataLoader.loadJson<GameMedia>(mediaUrl, "media");
	}

	public async getPlayers(playerIds: number[], year: number = -1)
	{
		year = year === -1 ? moment().year() : year;
		const baseUrl = "https://statsapi.mlb.com/api/v1/people?";
		const playersQuery = "personIds=" + playerIds.join("&personIds=");
		const suffix = `&hydrate=stats(group=hitting,type=season,season=${year},gameType=R)`;

		const fullUrl = `${baseUrl}${playersQuery}${suffix}`;
		return await Internal_DataLoader.loadJson<PlayerListResponse>(fullUrl, "playerData");
	}

	public async getTeamSchedule(teamId: number, season: number = undefined)
	{
		const now = moment();
		const dateString = now.format("YYYY-MM-DD");
		season = !season ? now.year() : season;
		
		const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}?hydrate=previousSchedule(date=${dateString},season=${season},limit=162,team,linescore(matchup,runners),decisions,person,stats,seriesStatus(useOverride=true)),nextSchedule(date=${dateString},season=${season},limit=162,team,linescore(matchup,runners),decisions,person,stats,seriesStatus(useOverride=true))`;

		return await Internal_DataLoader.loadJson<ISchedule>(url, "schedule" + teamId);
	}

	public async getTeamDetails(teamId: number)
	{
		const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}`;
		return await Internal_DataLoader.loadJson<ITeamDetails>(url, "teamdetails" + teamId);
	}
}