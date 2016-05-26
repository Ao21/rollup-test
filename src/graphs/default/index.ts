import {select} from 'd3-selection';
import {nest} from 'd3-collection';
import {hierarchy} from 'd3-hierarchy';
import {addHiddenChildTotals} from './utils';

export class DefaultGraph {
	graph: any;

	constructor() { }
	init(data: any[]) {
		this.graph = select('#graph');
		this.prep(data);
	}
	prep(initData) {
		initData = initData.filter((d) => { return d.YEAR == 2016 });
		let entries = nest()
			.key((e: any) => { return e.CATEGORY; })
			.key((e: any) => { return e.FUNDING_CATEGORY; })
			.entries(initData);


		let root = hierarchy({ values: entries }, (d) => {
			return d.values;
		}).sum((d) => {
			if (d.TYPE === 'Total') {
				return d.AMOUNT;
			}
		});

		
		console.log(root);		

	}
}
