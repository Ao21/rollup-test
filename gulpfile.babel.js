import gulp from 'gulp';
import {buildRollup} from './tasks/development/scripts';
import {watchScripts} from './tasks/development/watch';

gulp.task('watch', watchScripts);
const build = gulp.series(buildRollup);
export default build;