﻿using System.Web.Mvc;
using System.Web.Optimization;

namespace BaseballTheater.Areas.App
{
	public class AppAreaRegistration : AreaRegistration 
	{
		public override string AreaName => "App";

		public override void RegisterArea(AreaRegistrationContext context)
		{
			BundleConfig.RegisterBundles(BundleTable.Bundles);

			context.MapRoute(
				"app_gamelist",
				"default/{id}",
				new { controller = AreaName, action = "Index", id = UrlParameter.Optional },
				new[] { "BaseballTheater.Areas.App" }
			);

			context.MapRoute(
				"app_default",
				"default/{*url}",
				new { controller = AreaName, action = "Index", id = UrlParameter.Optional },
				new[] { "BaseballTheater.Areas.App" }
			);
		}
	}
}