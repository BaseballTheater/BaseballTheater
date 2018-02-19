﻿namespace Theater
{
	interface ISearchState
	{
		query: string;
		highlights: IHighlightSearchResult[];
	}

	export class Search extends React.Component<any, ISearchState>
	{
		private static readonly regex = /^\/search\/(.*)(\/|\?)?/i;

		constructor(props: any)
		{
			super(props);

			this.state = {
				query: Search.getQuery(),
				highlights: []
			}
		}

		public componentDidMount()
		{
			this.loadData();

			Utility.LinkHandler.Instance.stateChangeDistributor.subscribe(() =>
			{
				if (Search.getQuery().trim() !== "")
				{
					this.setQuery();
					this.loadData();
				}
			});
		}

		private setQuery()
		{
			this.setState({
				query: Search.getQuery()
			});
		}

		public static getQuery()
		{
			const matches = this.regex.exec(location.pathname);
			const query = matches != null && matches.length > 0
				              ? matches[1]
				              : "";

			return decodeURI(query);
		}

		private updateHighlights(highlights: IHighlightSearchResult[])
		{
			App.stopLoading();
			this.setState({
				highlights
			});
		}

		public loadData()
		{
			App.startLoading();
			$.ajax({
				url: `/Data/SearchHighlights/?query=${this.state.query}&page=0&perpage=20`,
				dataType: "json",
				success: data => this.updateHighlights(data)
			});
		}

		private renderHighlight(highlight: IHighlightSearchResult)
		{
			const style = {
				backgroundImage: `url(${highlight.Thumb_m})`
			};

			const date = moment(highlight.Date).format("dddd, MMMM Do YYYY");

			return (
				<a className={`highlight-result`} href={highlight.Video_s} target={`blank`}>
					<div className={`thumb`} style={style}/>
					<div className={`text-info`}>
						<div className={`headline`}>{highlight.Headline}</div>
						<div className={`date`}>{date}</div>
					</div>
				</a>
			);
		}

		public render()
		{
			const highlightsRendered = this.state.highlights.map(highlight => this.renderHighlight(highlight));

			return (
				<div className={`search-results`}>
					{highlightsRendered}
				</div>
			);
		}
	}

	App.Instance.addPage({
		page: <Search/>,
		matchingUrl: /^\/search\/(.*)/gi,
		name: "game"
	});
}