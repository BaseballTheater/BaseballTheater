﻿using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using MlbDataServer;
using MlbDataServer.DataFetch;
using MlbDataServer.DataStructures;
using RedditBot.Config;
using RedditSharp;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using RedditSharp.Things;

namespace RedditBot
{
	class RedditAccess
	{
		private readonly Reddit _reddit = new Reddit();
		private List<string> _commentIds = new List<string>();
		private List<string> _newCommentIds = new List<string>();
		private const string CommentIdFilePath = @"C:\baseballtheater.txt";

		private CloudBlobContainer BlobContainer { get; set; }

		/// <summary>
		/// Logs a user in and then returns True if 
		/// the login was successful
		/// </summary>
		/// <returns>Boolean</returns>
		private bool HasLoggedIn(string username, string password)
		{
			try
			{
				var user = _reddit.LogIn(username, password);
				Console.WriteLine("User logged in");
				return true;
			}
			catch (Exception ex)
			{
				Console.WriteLine(ex.Message);
				return false;
			}
		}

		private void AddIdToList(string commentId)
		{
			if (!_newCommentIds.Contains(commentId))
			{
				_newCommentIds.Add(commentId);
			}
		}

		private void ReadIdsFromFile()
		{
			try
			{
				var allIds = "";
				using (var file = new StreamReader(CommentIdFilePath))
				{
					allIds = file.ReadToEnd();
				}
				_commentIds = allIds.Split(' ').ToList();
			}
			catch (Exception e)
			{
				Console.WriteLine(e);
			}
		}

		private void WriteIdsToFile()
		{
			try
			{
				var allComments = _commentIds.Concat(_newCommentIds);
				var textToWrite = "";
				foreach (var commentId in allComments)
				{
					textToWrite += " " + commentId;
				}

				using (var file = new StreamWriter(CommentIdFilePath))
				{
					file.Write(textToWrite);
				}
			}
			catch (Exception e)
			{
				Console.WriteLine(e);
			}

		}

		/// <summary>
		/// Waits until a certain sentence is posted
		/// and then will reply with a message
		/// </summary>
		public void ListenForPrompt()
		{
			Console.WriteLine("RedditBot Started");
			ReadIdsFromFile();

			if (!HasLoggedIn(AuthConfig.Username, AuthConfig.Password))
			{
				return;
			}

			var linkParser = new Regex(@"(http|ftp|https)://([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-](.mp4))?", RegexOptions.Compiled | RegexOptions.IgnoreCase);


			Console.WriteLine("Getting MLBVideoConverterBot Comments");
			var user = _reddit.GetUser("MLBVideoConverterBot");
			var index = 0;
			foreach (var comment in user.Comments.Take(2))
			{
				if (!_commentIds.Contains(comment.Id))
				{
					Console.WriteLine(string.Format("Comment ID {0} found and is not yet replied to", comment.Id));
					var commentBody = comment.Body;

					if (linkParser.IsMatch(commentBody))
					{
						var link = linkParser.Match(commentBody).Value;
						var contentId = GetContentIdFromVideoUrl(link);
						var url = GetMlbXmlFileFromVideoUrl(contentId);


						Highlight highlight = null;
						try
						{
							var xmlLoader = new XmlLoader();
							highlight = xmlLoader.GetXml<Highlight>(url);
						}
						catch (Exception e)
						{
							this.logGameNotFound(contentId, comment, e);
						}

						if (highlight != null)
						{
							var gamePkKeyword = highlight.Keywords.FirstOrDefault(a => a.Type == "game_pk");

							var baseDirectory = highlight.GetGameDetailDirectory;

							if (gamePkKeyword != null && baseDirectory != null)
							{
								var gameDetailCreator = new GameDetailCreator(baseDirectory, true);
								var gameSummary = gameDetailCreator.GetGameSummary();
								var allHighlights = gameDetailCreator.GetHighlights();

								if (gameSummary != null)
								{
									var gamePk = gamePkKeyword.Value;
									var date = DateTimeOffset.Parse(highlight.Date, CultureInfo.InvariantCulture);
									var dateString = date.ToString("yyyyMMdd");

									var baseballTheaterUrl = string.Format("http://baseball.theater/game/{0}/{1}", dateString, gamePk);

									var redditFormatLink = string.Format(
										"|More highlights from this game at baseball.theater|\r\n :--|:--:|--:\r\n [**{0} @ {1}, {2}**]({3})| \r\n\r\n ^^I ^^am ^^a ^^new ^^bot! ^^Let ^^me ^^know ^^if [^^something ^^goes ^^wrong](http://np.reddit.com/r/BaseballTheaterBot)",
										gameSummary.AwayTeamName,
										gameSummary.HomeTeamName,
										date.ToString("MM/dd/yyyy"),
										baseballTheaterUrl
										);

									try
									{
										comment.Reply(redditFormatLink);
										AddIdToList(comment.Id);
										Thread.Sleep(15000);
									}
									catch (RateLimitException e)
									{
										Console.WriteLine("Rate limit exceeded, waiting for " + (int)e.TimeToReset.TotalMilliseconds + " milliseconds");
										Thread.Sleep((int)e.TimeToReset.TotalMilliseconds);
									}

									Console.WriteLine(baseballTheaterUrl);
								}
							} 
							else
							{
								this.logGameNotFound(contentId, comment);
							}
						}
						else
						{
							Console.WriteLine("Highlight null for id " + contentId);
							AddIdToList(comment.Id);
						}
					}

					index++;
				}
				else
				{
					Console.WriteLine("Id already in file: " + comment.Id);
				}
			}

			WriteIdsToFile();
		}

		private void logGameNotFound(string contentId, Comment comment, Exception e = null)
		{
			Console.WriteLine("No game available for ID " + contentId);
			if (e != null)
			{
				Console.WriteLine(e);
			}
			AddIdToList(comment.Id);
		}

		private string GetContentIdFromVideoUrl(string videoUrl)
		{
			var contentId = "";
			if (videoUrl.IndexOf("mlbtv_", StringComparison.Ordinal) > -1)
			{
				var pieces = videoUrl.Split('_');
				contentId = pieces[pieces.Length - 2];
			}
			else
			{
				var pieces = videoUrl.Split('/');
				contentId = pieces[pieces.Length - 3];
			}

			return contentId;
		}

		private string GetMlbXmlFileFromVideoUrl(string contentId)
		{
			var x = contentId[contentId.Length - 3];
			var y = contentId[contentId.Length - 2];
			var z = contentId[contentId.Length - 1];

			var url = string.Format("http://mlb.com/gen/multimedia/detail/{0}/{1}/{2}/{3}.xml", x, y, z, contentId);
			return url;
		}
	}
}