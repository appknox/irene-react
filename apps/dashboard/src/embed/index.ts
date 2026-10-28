import { mountIreneComponent } from './mount-component';

export { mountIreneComponent };

export type {
  ComponentMountOptions,
  IreneComponentName,
  MountedComponent,
} from './mount-component';

/*
  Also published on the global, for a host whose build cannot import this
  bundle lazily by URL. Ember's classic build rejects a dynamic relative
  import outright, so the host loads this with a script tag and reads what it
  left here once the tag fires its load event.
*/
(globalThis as Record<string, unknown>)['__ireneEmbed'] = { mountIreneComponent };
