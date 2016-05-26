declare module "d3-selection" {
	export class creator { }
	export class matcher { }
	export class mouse { }
	export class namespace { }
	export class namespaces { }
	export class selectAll { }
	export class selection { }
	export class selector { }
	export class selectorAll { }
	export class touch { }
	export class touches { }
	export class window { }
	export class event { }
	export class customEvent { }

	export interface Select {
		(element: string): void;
	}

	export var select: Select;
	

}