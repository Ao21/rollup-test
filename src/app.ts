import {DataService} from './services/data';
import {DefaultGraph} from './graphs/default/index';
export class test{
	private _data: DataService = new DataService();
	private _graph: DefaultGraph = new DefaultGraph();
	constructor() {
		this._data.getData().then((done) => {
			this._graph.init(done);
		})
			
	}
}