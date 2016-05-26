import gulp from 'gulp';
import {buildRollup} from './tasks/development/scripts';

const build = gulp.series(buildRollup);
export default build;