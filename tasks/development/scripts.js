import {rollup} from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import {log, colors} from 'gulp-util';


export function buildRollup(){
	return rollup({
		entry: 'src/app.ts',
		plugins: [
			typescript(),
			nodeResolve({ jsnext: true, main: true }),
    		commonjs()
		]
	}).then(function(bundle) {
		return bundle.write({
			format: 'iife',
  			moduleName: 'infographics',
			dest: 'build/app/app.js'
		});
	}).catch(err => {
		log(colors.red(err.stack));	
	});
}
