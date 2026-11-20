// HomeLift-kort för Home Assistant: nästa pass, dagens plan och statistik för en profil.
// Konfiguration: type: custom:homelift-card, entity: sensor.<profil>_nasta_pass (valfritt, hittas annars automatiskt)
const HL_TEXT = {
  sv: {
    today: 'Idag', rest: 'Vilodag idag', done: 'Klart för idag', next: 'Nästa pass', nextDay: 'Nästa träningsdag',
    week: 'Denna vecka', goal: 'pass (mål)', goalStreak: 'Mål i rad', streak: 'Veckor i rad', total: 'Pass totalt', bmi: 'BMI', weight: 'Vikt', last: 'Senaste pass',
    exercises: 'övningar', min: 'min', open: 'Öppna HomeLift', none: 'Ingen HomeLift-profil hittades. Lägg till integrationen HomeLift.',
    noProgram: 'Inget schema ännu', strength: 'Styrka', cardio: 'Cardio',
    days: ['mån', 'tis', 'ons', 'tor', 'fre', 'lör', 'sön'],
    cardioTypes: { crosstrainer: 'Crosstrainer', lopning: 'Löpning', skidor: 'Skidor', cykel: 'Cykel', rodd: 'Rodd', promenad: 'Promenad', simning: 'Simning', trappmaskin: 'Trappmaskin', hopprep: 'Hopprep' },
  },
  en: {
    today: 'Today', rest: 'Rest day', done: 'Done for today', next: 'Next workout', nextDay: 'Next training day',
    week: 'This week', goal: 'workouts (goal)', goalStreak: 'Goal streak', streak: 'Week streak', total: 'Total workouts', bmi: 'BMI', weight: 'Weight', last: 'Last workout',
    exercises: 'exercises', min: 'min', open: 'Open HomeLift', none: 'No HomeLift profile found. Add the HomeLift integration.',
    noProgram: 'No program yet', strength: 'Strength', cardio: 'Cardio',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    cardioTypes: { crosstrainer: 'Cross-trainer', lopning: 'Running', skidor: 'Skiing', cykel: 'Cycling', rodd: 'Rowing', promenad: 'Walking', simning: 'Swimming', trappmaskin: 'Stair climber', hopprep: 'Jump rope' },
  },
};
const HL_LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="hlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#hlg)"/><g fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 30.5 32 13l21 17.5"/><path d="M16.5 26v22.5h31V26"/><path d="M20 38.5h24"/><path d="M25 32.5v12M39 32.5v12"/><path d="M21.5 35v7M42.5 35v7"/></g></svg>`;

class HomeLiftCard extends HTMLElement {
  setConfig(config) { this._config = config || {}; }
  static getStubConfig(hass) {
    const e = Object.keys(hass.states).find(id => hass.states[id].attributes?.homelift);
    return { entity: e || '' };
  }
  getCardSize() { return 4; }

  set hass(hass) {
    this._hass = hass;
    const id = this._config.entity || Object.keys(hass.states).find(k => hass.states[k].attributes?.homelift);
    const st = id && hass.states[id];
    const key = JSON.stringify([st?.last_updated, st?.state, hass.language]);
    if (key === this._last) return;
    this._last = key;
    this.render(st, (hass.language || 'en').startsWith('sv') ? HL_TEXT.sv : HL_TEXT.en);
  }

  render(st, t) {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    if (!st) { this.shadowRoot.innerHTML = `<ha-card><div class="pad">${t.none}</div></ha-card>`; return; }
    const a = st.attributes;
    const name = w => w ? (w.kind === 'cardio' ? (t.cardioTypes[w.cardio_type] || w.name) : w.name) : '';
    const today = a.today;
    const next = a.next_workout;
    const goal = a.weekly_goal || a.planned_per_week;
    const pct = goal ? Math.min(100, Math.round(100 * (a.sessions_this_week || 0) / goal)) : 0;
    const dateLabel = d => { if (!d) return '–'; const x = new Date(d + 'T12:00:00'); return `${t.days[(x.getDay() + 6) % 7]} ${x.getDate()}/${x.getMonth() + 1}`; };
    const todayHtml = !a.program ? `<div class="today rest">${t.noProgram}</div>`
      : today ? `<div class="today ${today.done ? 'ok' : 'on'}"><span class="dot"></span><div><small>${today.done ? t.done : t.today}</small><b>${esc(name(today))}</b></div><span class="tag">${today.kind === 'cardio' ? t.cardio : t.strength}${today.minutes ? ` · ${today.minutes} ${t.min}` : ''}</span></div>`
      : `<div class="today rest"><span class="dot"></span><div><small>${t.rest}</small><b>${t.nextDay}: ${dateLabel(a.next_training_date)}</b></div></div>`;
    const days = (a.training_days || []);
    this.shadowRoot.innerHTML = `
      <style>
        :host { --hl: #2563eb; }
        ha-card { overflow: hidden; }
        .head { display: flex; align-items: center; gap: 12px; padding: 16px 16px 8px; }
        .head svg { width: 40px; height: 40px; flex: none; }
        .head b { display: block; font-size: 1.1rem; }
        .head small, small { color: var(--secondary-text-color); font-size: .8rem; display: block; }
        .head a { margin-left: auto; color: var(--hl); text-decoration: none; font-size: .85rem; font-weight: 600; }
        .pad { padding: 16px; }
        .today { display: flex; align-items: center; gap: 12px; margin: 4px 16px 12px; padding: 12px 14px; border-radius: 14px; background: color-mix(in srgb, var(--hl) 12%, transparent); }
        .today b { font-size: 1.05rem; }
        .today .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--hl); flex: none; }
        .today.ok { background: color-mix(in srgb, #16a34a 14%, transparent); } .today.ok .dot { background: #16a34a; }
        .today.rest { background: var(--secondary-background-color, rgba(127,127,127,.1)); } .today.rest .dot { background: var(--secondary-text-color); }
        .tag { margin-left: auto; font-size: .75rem; font-weight: 600; color: var(--hl); white-space: nowrap; }
        .next { padding: 0 16px 12px; }
        .next b { font-size: 1rem; }
        .bar { height: 8px; border-radius: 8px; background: var(--divider-color, rgba(127,127,127,.2)); overflow: hidden; margin-top: 6px; }
        .bar i { display: block; height: 100%; width: ${pct}%; background: ${a.weekly_goal_reached ? '#16a34a' : 'var(--hl)'}; border-radius: 8px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--divider-color, rgba(127,127,127,.2)); }
        .grid div { padding: 12px 8px; text-align: center; }
        .grid div + div { border-left: 1px solid var(--divider-color, rgba(127,127,127,.2)); }
        .grid b { display: block; font-size: 1.25rem; }
        .week { display: flex; gap: 4px; margin-top: 8px; }
        .week span { flex: 1; text-align: center; font-size: .7rem; padding: 3px 0; border-radius: 6px; color: var(--secondary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.08)); }
        .week span.on { background: var(--hl); color: #fff; font-weight: 600; }
      </style>
      <ha-card>
        <div class="head">${HL_LOGO}<div><b>${esc(a.profile)}</b><small>${esc(a.program || 'HomeLift')}</small></div>${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${t.open} ›</a>` : ''}</div>
        ${todayHtml}
        ${next && !(today && !today.done && today.kind !== 'cardio') ? `<div class="next"><small>${t.next}</small><b>${esc(next.name)}</b> <small style="display:inline">· ${next.exercises} ${t.exercises} · ${next.minutes} ${t.min}</small></div>` : ''}
        ${goal ? `<div class="next"><div style="display:flex;justify-content:space-between"><small>${t.week}</small><small>${a.weekly_goal_reached ? '✓ ' : ''}${a.sessions_this_week || 0} / ${goal} ${t.goal}</small></div><div class="bar"><i></i></div>
          <div class="week">${t.days.map((d, i) => `<span class="${days.includes(i) ? 'on' : ''}">${d}</span>`).join('')}</div></div>` : ''}
        <div class="grid">
          <div><b>${a.week_streak ?? 0}</b><small>${t.streak}</small></div>
          <div><b>${a.goal_streak ?? 0}</b><small>${t.goalStreak}</small></div>
          <div><b>${a.total_sessions ?? 0}</b><small>${t.total}</small></div>
          <div><b>${a.bmi ?? (a.weight ? a.weight + ' kg' : '–')}</b><small>${a.bmi ? t.bmi : t.weight}</small></div>
        </div>
      </ha-card>`;
  }
}
if (!customElements.get('homelift-card')) customElements.define('homelift-card', HomeLiftCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'homelift-card')) {
  window.customCards.push({ type: 'homelift-card', name: 'HomeLift', description: 'Nästa pass, dagens plan och träningsstatistik / Next workout and stats', preview: true });
}
