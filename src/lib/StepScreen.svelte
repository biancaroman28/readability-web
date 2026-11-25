<script lang="ts">
  import { tick } from 'svelte';
  import type { Letter, Step } from './participant';

  let { step, total, pending, error, selected = $bindable(), oncontinue }: {
    step: Step | null; total: number; pending: boolean; error: string;
    selected: Letter | undefined; oncontinue: (pas: number, letter: Letter) => void | Promise<void>
  } = $props();
  let heading = $state<HTMLHeadingElement>();

  $effect(() => {
    const pas = step?.pas;
    void tick().then(() => { if (step?.pas === pas) heading?.focus(); });
  });
</script>

<main>
  {#if step}
    {@const pas = step.pas}
    <p class="progress" aria-label="Progres">{pas} / {total}</p>
    {#key pas}
      {#if step.tip === 'pereche'}
        <h1 class="question" tabindex="-1" bind:this={heading}>Care text este mai ușor de citit și de înțeles?</h1>
        <div class="pair" role="group" aria-label="Fragmente">
          <button type="button" aria-pressed={selected === 'A'} disabled={pending} onclick={() => { selected = 'A'; }}>
            <strong>Text A</strong>
            <span>„{step.fragmentA}”</span>
            {#if step.attributionA}
              <span class="attribution">{step.attributionA.author}, <cite>{step.attributionA.title}</cite> ({step.attributionA.year})</span>
            {/if}
          </button>
          <button type="button" aria-pressed={selected === 'B'} disabled={pending} onclick={() => { selected = 'B'; }}>
            <strong>Text B</strong>
            <span>„{step.fragmentB}”</span>
            {#if step.attributionB}
              <span class="attribution">{step.attributionB.author}, <cite>{step.attributionB.title}</cite> ({step.attributionB.year})</span>
            {/if}
          </button>
        </div>
      {:else}
        <h1 class="question" tabindex="-1" bind:this={heading}>{step.question}</h1>
        <div class="options" role="group" aria-label="Variante">
          {#each step.options as option (option.letter)}
            <button type="button" aria-pressed={selected === option.letter} disabled={pending}
              onclick={() => { selected = option.letter; }}>
              <strong>{option.letter}</strong>
              <span>{option.text}</span>
            </button>
          {/each}
        </div>
      {/if}
    {/key}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <button class="continue" disabled={!selected || pending} onclick={() => { if (selected) void oncontinue(pas, selected); }}>
      {pending ? 'Se salvează…' : 'Continuă'}
    </button>
  {:else}
    <h1 tabindex="-1" bind:this={heading}>Ai terminat sesiunea</h1>
  {/if}
</main>


<style>
  :global(body) {
    margin: 0;
    background: #eef2f7;
    color: #17283e;
    font-family: Calibri, sans-serif;
  }

  main {
    max-width: 100rem;
    margin: 0 auto;
    padding: clamp(2.75rem, 7vh, 4.5rem) clamp(1rem, 2vw, 2rem) 1rem;
  }
  .progress { color: #4b5d76; font-size: 1.125rem; line-height: 1.2; font-variant-numeric: tabular-nums; margin: 0 0 .35rem; }
  h1 { font-size: 1.5rem; line-height: 1.25; margin: 0 0 .75rem; }
  .question { margin-inline-start: 1rem; }
  .pair, .options { display: grid; gap: .65rem; }
  .pair { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  button {
    display: block;
    text-align: left;
    color: inherit;
    background: #ffffff;
    border: 1px solid #a4b3c7;
    border-radius: .75rem;
    padding: .75rem 1rem;
    cursor: pointer;
    font: inherit;
    font-size: 1.5rem;
    line-height: 1.35;
  }
  button:disabled { cursor: default; }
  .continue { margin-top: .75rem; background: #294974; color: white; font-size: 1.2rem; }
  .continue:disabled { opacity: .55; }
  .continue:not(:disabled):hover { background: #395985; }
  button:hover, button[aria-pressed="true"] { background: #fff0cc; border-color: #93601c; }
  button:focus-visible { outline: 3px solid #235695; outline-offset: 3px; }
  span { white-space: pre-wrap; overflow-wrap: anywhere; }
  .pair button { display: flex; flex-direction: column; gap: .4rem; }
  .attribution { align-self: stretch; text-align: right; font-size: 1rem; }
  .options button { display: grid; grid-template-columns: 1.5em minmax(0, 1fr); align-items: center; gap: .75rem; }
  .options strong { font-size: 1.5rem; text-align: center; }
  strong { color: #294974; font-size: 1.375rem; }
  .error { color: #982c21; }

  @media (max-width: 44rem) { .pair { grid-template-columns: 1fr; } }
</style>

