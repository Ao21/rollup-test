declare namespace dimple {
	export function newSvg(parentSelector: any, width: number, height: number);
	export function chart(svg: any, data: any): void;

	export class color {
		constructor(col: any);
	}
	export class plot {
		constructor();
		static bar: any;
	}

}
declare module 'dimple' {
	export = dimple;
}