﻿namespace Theater.Site
{
	export class LinkHandler
	{
		public static Instance = new LinkHandler();
		private initialized = false;

		public initialize()
		{
			if (this.initialized)
			{
				return;
			}

			this.addListeners();

			this.initialized = true;
		}

		private addListeners()
		{
			$(document).on("click", "a[href]:not([href^='http'])", (e) =>
			{
				e.preventDefault();

				var $el = $(e.currentTarget);
				var href = $el.attr("href");

				LinkHandler.pushState(href);
			});

			$(window).on("popstate statechange", (e) =>
			{
				if (Site.currentPage.matchingUrl.test(location.pathname))
				{
					Site.currentPage.page.renew(location.pathname);
				}
				else
				{
					Site.initializeCurrentPage();
					//this.loadNew(location.pathname);
				}

				$("header .links").removeClass("open");
			});
		}

		public static pushState(href: string)
		{
			history.pushState(null, null, href);
			$(window).trigger("statechange");
		}

		private async loadNew(href: string)
		{
			Site.startLoading();

			this.ajax(href).then((response: string) =>
			{
				var $response = $(response);
				var bodyClass = response.match(/<body.*class=['"](.*)['"].*>/)[1];

				var bodyContent = $response.find(".body-content").html();
				$(".body-content").html(bodyContent);

				$("body").attr("class", bodyClass as string);

				Site.stopLoading();

				Site.initializeCurrentPage();
			});
		}

		private ajax(href: string)
		{
			return new Promise((resolve, reject) =>
			{
				$.ajax({
					url: href,
					type: "GET",
					success: (response: string) => resolve(response),
					error: error => reject(error)
				});
			});
		}
	}
}