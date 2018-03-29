﻿using System.Collections.Generic;
using System.Linq;
using MlbDataEngine.Contracts;

namespace MlbDataEngine.Engine
{
	public static class Search
	{
		public static IEnumerable<HighlightSearchResult> SearchHighlights(string query, int page, int recordsPerPage)
		{
			var words = query.Split(' ');
			var upperWords = words.Select(a => a.ToUpperInvariant());

			if (HighlightDatabase.AllHighlights == null) 
				return new List<HighlightSearchResult>();
			
			var matches = HighlightDatabase.AllHighlights.Where(a =>
			{
				if (a?.Highlight == null) return false;

				var checkAgainst = $"{a.Highlight.headline ?? ""} {a.Highlight.bigblurb ?? ""} {a.Highlight.blurb ?? ""}";

				if (a.Highlight.team?.Name != null)
				{
					checkAgainst += " " + a.Highlight.team.Name + " ";
				}

				if (a.Highlight.players?.Names != null)
				{
					checkAgainst += " " + a.Highlight.players.Names + " ";
				}

				checkAgainst = checkAgainst.ToUpperInvariant();

				var checkAgainstFixed = new string(checkAgainst.Select(c => char.IsPunctuation(c) ? ' ' : c).ToArray());

				var matched = upperWords.All(checkAgainstFixed.Contains);

				return matched;

			});

			return matches
				.OrderByDescending(a => a.Highlight.dateObj)
				.Skip(page * recordsPerPage)
				.Take(recordsPerPage);

		}
	}
}