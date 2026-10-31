import {Config} from '@remotion/cli/config';

// Studio renders go to projects/<project-slug>/<CompositionId>.<ext> (see src/projects/render-output.ts),
// never the shared out/ folder. Only for Studio: for `remotion render` a configured output location would
// replace the output file name, so CLI renders keep passing their own path.
if (process.argv.includes('studio')) {
	Config.setOutputLocation('projects');
}
