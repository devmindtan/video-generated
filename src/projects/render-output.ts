import type {CalculateMetadataFunction} from 'remotion';

// Studio renders under `projects/` (remotion.config.ts); this adds the project folder, so a
// render of <Composition id="X"> in project `slug` defaults to projects/<slug>/X.<ext>, not out/.
// Wrap an existing calculateMetadata instead of replacing it.
export const renderTo = <P extends Record<string, unknown>>(
	project: string,
	calculate?: CalculateMetadataFunction<P>,
): CalculateMetadataFunction<P> => async (options) => {
	const metadata = calculate ? await calculate(options) : {};
	return {...metadata, defaultOutName: `${project}/${options.compositionId}`};
};
