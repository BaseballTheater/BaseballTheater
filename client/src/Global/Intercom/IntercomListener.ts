export class IntercomListener<TState extends {}, TParams extends {} = never>
{
	constructor(public readonly callback: (data: TState) => void, public readonly params: TParams = undefined)
	{

	}
}