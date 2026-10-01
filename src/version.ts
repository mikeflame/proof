import pkg from '../package.json' with { type: 'json' };

/** The one version source is package.json; the build writes it into the plugin manifest (spec 9.3). */
export const VERSION: string = pkg.version;
