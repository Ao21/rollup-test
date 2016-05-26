import gulp from 'gulp';
import {buildRollup} from './scripts';
export function watchScripts() {
	gulp.watch('src', gulp.series(buildRollup));
}