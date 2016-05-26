import {json} from 'd3-request';

export class DataService {
	private _query: any;
	constructor() {
		this._query = {
			country: 'denmark',
			graph: 'chart'
		}
	}
	getData() {
		return new Promise((res, rej) => {
			json(`http://localhost:5000/api/infographics/${this._query.country}/${this._query.graph}`, (data) => {
				res(data);
			});
		})

	}
}