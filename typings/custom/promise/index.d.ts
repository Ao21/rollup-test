declare class Promise {
	constructor(callback: (resolve: Function, reject: Function) => void);
	then(doneFilter: Function, failFilter?: Function, progressFilter?: Function): Promise;
	done(...callbacks: Function[]): Promise;
	fail(...callbacks: Function[]): Promise;
	always(...callbacks: Function[]): Promise;
}
declare interface Promise {
	callback: (resolve: Function, reject: Function) => Promise;
	then(doneFilter: Function, failFilter?: Function, progressFilter?: Function): Promise;
	done(...callbacks: Function[]): Promise;
	fail(...callbacks: Function[]): Promise;
	always(...callbacks: Function[]): Promise;
}