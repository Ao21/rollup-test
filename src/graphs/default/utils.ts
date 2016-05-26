import {reduce, filter} from 'lodash';
export function addHiddenChildTotals(values) {
		let childValues = values;
		// Add the Totals Together
		let childEntryTotalAgg =
			reduce(filter(childValues, (z: any) => { return z.TYPE === 'Total'; })
				, (sum = 0, z: any) => {
					return sum + Number(z.AMOUNT);
				}, 0);
		// Get the Sub Category child entires
		values = filter(childValues, (z: any) => { return z.TYPE !== 'Total'; });
		if (values.length == 0) {
			// No Deducated Entries
			values = childValues;
		} else {

			// Get the SubCategory child entry Values that aren't totals
			let subValueTotals = reduce(filter(childValues, (z: any) => { return z.TYPE != 'Total'; })
				, (sum = 0, z: any) => {
					return sum + Number(z.AMOUNT);
				}, 0);
			// If The Subcategory Entry Values dont add up to the Subcategory Total Value
			// Insert a hidden arc on the circle
			if (subValueTotals !== childEntryTotalAgg) {
				values.push({
					AMOUNT: childEntryTotalAgg - subValueTotals,
					CATEGORY: "Flexible Earmark",
					FUNDING_CATEGORY: "Emergency Reserve",
					TYPE: 'Hidden'
				})
			}
		}
		return values;
}
