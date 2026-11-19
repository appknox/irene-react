import { mountIreneComponent } from './mount-component';

/* Ember loads this with a script tag, which cannot read a module's exports. */
declare global {
  var __ireneEmbed: { mountIreneComponent: typeof mountIreneComponent } | undefined;
}

globalThis.__ireneEmbed = { mountIreneComponent };
