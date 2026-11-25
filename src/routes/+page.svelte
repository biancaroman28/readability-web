<script lang="ts">
  import { onMount } from 'svelte';
  import type { Letter, Session } from '../lib/participant';
  import StepScreen from '../lib/StepScreen.svelte';

  let session = $state<Session | null>(null);
  let pending = $state(false);
  let error = $state('');
  let name = $state('');
  let email = $state('');
  let selected = $state<Letter>();
  let token: string | undefined;
  let sessionVersion = 0;

  function storageKey() {
    return 'readability:session:' + location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
  }

  function leaveSession() {
    localStorage.removeItem(storageKey());
    clearSession();
  }

  function clearSession() {
    sessionVersion++;
    token = undefined;
    pending = false;
    error = '';
    selected = undefined;
    name = '';
    email = '';
    session = { enrolled: false };
  }

  function browserToken() {
    const key = storageKey();
    const existing = localStorage.getItem(key);
    if (existing && /^[a-f0-9]{64}$/.test(existing)) return existing;
    const value = Array.from(crypto.getRandomValues(new Uint8Array(32)),
      (byte) => byte.toString(16).padStart(2, '0')).join('');
    // Save the proof before the first POST so a lost response can be retried.
    localStorage.setItem(key, value);
    return value;
  }

  async function call(action: string, payload: Record<string, string | number> = {}) {
    if (pending) return;
    const version = sessionVersion;
    pending = true;
    error = '';
    try {
      token ||= browserToken();
      const origin = import.meta.env.VITE_SUPABASE_URL;
      if (!origin) throw new Error('Adresa Supabase nu este configurată.');
      const response = await fetch(new URL('/functions/v1/readability', origin), {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Readability-Proof': token },
        body: JSON.stringify({ action, ...payload }), cache: 'no-store', signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        if (version !== sessionVersion) return;
        if (failure?.code === 'expired') {
          session = { enrolled: false };
          selected = undefined;
        }
        throw new Error(failure?.message || 'Cererea nu a putut fi confirmată. Încearcă din nou.');
      }
      const next = await response.json() as Session;
      if (version !== sessionVersion) return;
      session = next;
      if (action === 'answer') selected = undefined;
      if (action === 'enroll') { name = ''; email = ''; }
    } catch (cause) {
      if (version !== sessionVersion) return;
      error = cause instanceof Error && cause.name === 'Error'
        ? cause.message : 'Cererea nu a putut fi confirmată. Încearcă din nou.';
    } finally {
      if (version === sessionVersion) pending = false;
    }
  }

  onMount(() => {
    void call('progress');
    function onStorage(event: StorageEvent) {
      if (event.key === storageKey() && event.newValue === null && event.oldValue === token) clearSession();
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  });
</script>

<svelte:head><title>Readability Experiment</title></svelte:head>

{#if session?.enrolled}
  <StepScreen step={session.step} total={session.total} {pending} {error} bind:selected
    oncontinue={(pas, letter) => call('answer', { pas, letter })} onleave={leaveSession} />
{:else}
  <main>
    <h1>Readability Experiment</h1>
    {#if session}
      <form onsubmit={(event) => { event.preventDefault(); void call('enroll', { name, email }); }} aria-busy={pending}>
        <label>Nume <input bind:value={name} autocomplete="name" required minlength="2" maxlength="120" /></label>
        <label>Adresă de email <input bind:value={email} type="email" autocomplete="email" required maxlength="254" /></label>
        {#if error}<p role="alert">{error}</p>{/if}
        <button disabled={pending}>{pending ? 'Se salvează…' : 'Începe'}</button>
      </form>
    {:else if error}
      <p role="alert">{error}</p>
      <button onclick={() => call('progress')}>Încearcă din nou</button>
    {:else}
      <p role="status">Se încarcă…</p>
    {/if}
  </main>
{/if}

<style>
  :global(body) { margin: 0; background: #eef2f7; color: #17283e; font-family: Calibri, sans-serif; }
  main { max-width: 35rem; margin: 0 auto; padding: clamp(2.75rem, 7vh, 4.5rem) 1.5rem 1rem; }
  h1 { margin: 0 0 1rem; font-size: 1.5rem; }
  form { display: grid; gap: 1rem; background: #fff; border: 1px solid #a4b3c7; border-radius: .75rem; padding: 1.5rem; }
  label { display: grid; gap: .35rem; font-size: 1.2rem; }
  input, button { font: inherit; color: inherit; border: 1px solid #a4b3c7; padding: .6rem .75rem; border-radius: .45rem; }
  input { min-width: 0; }
  button { justify-self: start; background: #e5edf8; font-size: 1.2rem; cursor: pointer; }
  button:hover { background: #fff0cc; border-color: #93601c; }
  :is(input, button):focus-visible { outline: 3px solid #235695; outline-offset: 3px; }
  p { margin: 0; }
  [role="alert"] { color: #982c21; }
</style>

