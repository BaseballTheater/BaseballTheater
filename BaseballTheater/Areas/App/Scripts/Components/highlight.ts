﻿namespace Theater
{
	interface ILink
	{
		url: string;
		label: string;
	}

	var getLinks = (game: IHighlight): ILink[] =>
	{
		const qkRegex = /(\d{4}K)/;
		var links = game.url;
		var q1200k: ILink = null;

		// For some reason, Safari doesn't like this particular 
		// variable when it's a 'let' when it's minified. 
		// ReSharper disable once VariableCanBeMadeLet
		for (var link of links)
		{
			const matches = link.__text.match(qkRegex);
			if (matches && matches.length > 0)
			{
				const label = matches[0] as string;
				q1200k = {
					url: link.__text.replace("http:", location.protocol),
					label: label
				};
			}
		}

		var validLinks = [];

		if (q1200k !== null)
		{
			const q1800K = {
				url: q1200k.url.replace(qkRegex, "1800K").replace("http:", location.protocol),
				label: "1800K"
			};

			const q2500K = {
				url: q1200k.url.replace(qkRegex, "2500K").replace("http:", location.protocol),
				label: "2500K"
			};

			validLinks.push(q1200k, q1800K, q2500K);
		}

		return validLinks;
	};

	var playUrl = (url: string) =>
	{
		const $video = $("<video controls />");
		const html = $video.attr("src", url)[0].outerHTML;
		const modal = new Modal("video-player", html);

		modal.afterOpen = () =>
		{
			(modal.$modal.find("video")[0] as HTMLVideoElement).play();
		}

		modal.open();
	};

	Vue.component("highlight",
	{
		template: $("template#highlight").html(),
		props: ["highlight"],
		methods: {
			getLinks,
			getDefaultUrl: (highlight: IHighlight) =>
			{
				var links = getLinks(highlight);

				return links[0].url;
			},
			getTitle: (highlight: IHighlight) =>
			{
				return highlight.recap && App.Instance.settingsVueData.hideScores
					? "Recap (score hidden)"
					: highlight.headline;
			},
			getDefaultThumb: (highlight: IHighlight) =>
			{
				let thumbFinal: string = highlight.thumb;
				if (highlight.thumbnails != null && highlight.thumbnails.thumb != null && highlight.thumbnails.thumb.length > 0)
				{
					const thumbs = highlight.thumbnails.thumb;

					if (App.clientNetSpeed !== NetSpeed.Fast)
					{
						let jpgSearch = "47.jpg";

						if (App.clientNetSpeed === NetSpeed.Slow)
						{
							jpgSearch = "52.jpg";
						}

						for (let thumb of thumbs)
						{
							if (Utility.endsWith(thumb.__text, jpgSearch))
							{
								thumbFinal = thumb.__text;
							}
						}
					}

					thumbFinal = thumbs[thumbs.length - 2].__text;
				}

				return thumbFinal.replace("http:", location.protocol);
			},
			playVideo: (highlight: IHighlight) =>
			{/*
				var $playCover = $(event.currentTarget);
				var $video = $playCover.siblings("video");
				($video[0] as HTMLVideoElement).play();*/

				var links = getLinks(highlight);
				playUrl(links[0].url);
			},
			playUrl: (url: string) =>
			{
				playUrl(url);
				return false;
			},
			pauseVideo: (event: Event) =>
			{
				var video = event.currentTarget as HTMLVideoElement;
				video.pause();
			},
			onPlay: (highlight: IHighlight) =>
			{
				highlight.isPlaying = true;
			},
			onPause: (highlight: IHighlight) =>
			{
				highlight.isPlaying = false;
			}
		}
	});
}