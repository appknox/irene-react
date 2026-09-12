// Apps import components by subpath — `@irene/ui/ak-button` — so this entry
// stays empty of component re-exports. A barrel would evaluate every module it
// reaches, and `import './index.scss'` is a side effect the bundler cannot drop,
// so one import would pull in every stylesheet in the package.
export {};
