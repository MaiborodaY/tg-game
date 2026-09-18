import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  // Embed the identity in this HTML build. A cached page must keep its old label,
  // rather than showing today's time or a newer version fetched from the server.
  const builtAt = new Date().toISOString();
  const buildId = `${builtAt.slice(2, 10).replaceAll('-', '')}-${builtAt.slice(11, 19).replaceAll(':', '')}`;
  const dateLabel = `${builtAt.slice(8, 10)}.${builtAt.slice(5, 7)}.${builtAt.slice(0, 4)} · ${builtAt.slice(11, 19)} UTC`;
  const version = `<span>Version ${buildId}${command === 'serve' ? ' · Local' : ''}</span><time datetime="${builtAt}">${dateLabel}</time>`;
  return {
    base: './',
    server: { host: '127.0.0.1', port: 5187, strictPort: true },
    build: { outDir: '../public/king-defense-toon', emptyOutDir: true },
    plugins: [{
      name: 'brotd-build-version',
      transformIndexHtml(html) {
        return html.replace(/(<p id="profile-version"[^>]*>)[\s\S]*?(<\/p>)/, `$1${version}$2`);
      },
    }],
  };
});
