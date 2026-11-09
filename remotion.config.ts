import {Config} from '@remotion/cli/config';
import {loudnessOverride} from './scripts/shared/render-loudness.cjs';

// Studio renders go to projects/<project-slug>/<CompositionId>.<ext> (see src/projects/render-output.ts),
// never the shared out/ folder. Only for Studio: for `remotion render` a configured output location would
// replace the output file name, so CLI renders keep passing their own path.
if (process.argv.includes('studio')) {
	Config.setOutputLocation('projects');
}

// Every video render (Studio's Render button included) comes out at YouTube loudness: -14 LUFS, true peak
// ≤ -1 dBTP, normalized while Remotion stitches the final file (scripts/shared/render-loudness.cjs).
// Set REMOTION_LOUDNORM=0 to keep the raw mix.
Config.overrideFfmpegCommand(loudnessOverride);
