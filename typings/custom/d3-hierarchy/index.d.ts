declare module 'd3-hierarchy' {
	
	export interface Hierarchy {
		(data: any, children: (d:any)=>void) : any;
	}
	export var hierarchy: Hierarchy;
}
