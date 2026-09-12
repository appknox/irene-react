/** Placeholder. Deployments that inject config replace this file at container
 * start; the ones that bake config at build time leave it as is.
 *
 * This matches what staticserver's /runtimeconfig.js route sends.
 */
var runtimeGlobalConfig = {}; // NOSONAR — we need to be able to assign to window.runtimeGlobalConfig
