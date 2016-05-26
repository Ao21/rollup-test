declare module 'd3-collection' {
	export interface Nest {
		(): any;
		key(any): Nest;
		entries()
	}
	export var nest: Nest;
}