import { CONFIG_KEYS, getConfig, getConfigFlag, getConfigText } from '@irene/config';

export function App() {
  return (
    <main className="p-4">
      <h1 className="text-lg font-semibold">Appknoxy</h1>
      <p className="text-sm">API host: {getConfigText('IRENE_API_HOST')}</p>
      <p className="text-sm">Enterprisess: {getConfigFlag('ENTERPRISE') ? 'Yes' : 'No'}</p>

      {CONFIG_KEYS.map((key) => (
        <p key={key} className="text-sm">
          {key}: {String(getConfig(key))}
        </p>
      ))}
    </main>
  );
}
