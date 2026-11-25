import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = env.VITE_PAGES_BASE || '';
  if (base && !/^\/[A-Za-z0-9_.-]+$/.test(base)) throw new Error('Prefix GitHub Pages invalid.');
  return {
    plugins: [
      sveltekit({ adapter: adapter(), paths: { base: base as '' | `/${string}` } }),
      {
        name: 'require-supabase-url',
        apply: 'build',
        buildStart() {
          const endpoint = new URL(env.VITE_SUPABASE_URL || 'invalid:');
          if (endpoint.href !== endpoint.origin + '/' ||
            !(endpoint.protocol === 'https:' || (endpoint.protocol === 'http:' && endpoint.hostname === '127.0.0.1'))) {
            throw new Error('VITE_SUPABASE_URL trebuie să conțină originea serviciului Supabase.');
          }
        }
      }
    ],
    server: {
      fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/*.csv', '**/.readability-local/**', '**/supabase/**', '**/scripts/**'] }
    }
  };
});

