// Schemagenerator: gör om svaren från guiden till ett veckoschema.
'use strict';

// Utrustning i guiden -> värden i övningsdatabasen
const EQUIPMENT = {
  kroppsvikt: ['body only'],
  hantlar: ['dumbbell'],
  skivstang: ['barbell', 'e-z curl bar'],
  kettlebell: ['kettlebells'],
  gummiband: ['bands'],
  kabel: ['cable'],
  maskiner: ['machine'],
  medicinboll: ['medicine ball'],
  pilatesboll: ['exercise ball'],
};

// Kroppsviktsövningar som ändå kräver en viss pryl, upptäckt via namnet
const NEEDS = {
  bank: /bench|incline|decline|preacher|bench dips|seated|lying/i,
  rack: /pull-?ups?|chin|hanging|muscle.?up|gorilla|\bdips?\b/i,
};
function hasRequirements(ex, sel) {
  for (const [key, re] of Object.entries(NEEDS)) if (re.test(ex.name) && !sel.includes(key)) return false;
  return true;
}

// Kroppsdelar i guiden -> muskler i övningsdatabasen
const GROUPS = {
  brost: ['chest'],
  rygg: ['lats', 'middle back', 'lower back', 'traps'],
  axlar: ['shoulders'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  ben: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  mage: ['abdominals'],
};

// Hur många "platser" varje grupp får relativt de andra (stora muskler först)
const GROUP_WEIGHT = { ben: 3, rygg: 2.5, brost: 2, axlar: 1.5, mage: 1, biceps: 1, triceps: 1 };
const GROUP_ORDER = ['ben', 'rygg', 'brost', 'axlar', 'triceps', 'biceps', 'mage'];

// Undergrupper per grupp, så att t.ex. "ben" roterar mellan framsida, baksida och säte
const SUBTARGETS = {
  ben: ['quadriceps', 'hamstrings', 'glutes', 'quadriceps', 'calves'],
  rygg: ['lats', 'middle back', 'lats', 'lower back', 'traps'],
  brost: ['chest'], axlar: ['shoulders'], biceps: ['biceps'], triceps: ['triceps'], mage: ['abdominals'],
};

// Välkända basövningar får förtur framför udda varianter
const POPULAR = [
  'bench press', 'squat', 'deadlift', 'row', 'pull-up', 'pullup', 'chin-up', 'push-up', 'pushups', 'lunge',
  'overhead press', 'shoulder press', 'military press', 'curl', 'dip', 'plank', 'crunch', 'lat pulldown',
  'leg press', 'hip thrust', 'glute bridge', 'romanian', 'goblet', 'lateral raise', 'fly', 'calf raise',
  'face pull', 'triceps extension', 'pushdown', 'leg curl', 'leg extension', 'split squat', 'step-up',
  'swing', 'russian twist', 'hanging leg raise', 'skullcrusher', 'arnold',
];
const AVOID = ['smith', 'one arm', 'one-arm', 'single-arm', 'kneeling', 'band good morning', 'with chains', 'with bands', 'board press', 'pin presses', 'floor press', 'speed', 'rack pull', 'reverse band', 'zercher', 'jefferson', 'anderson', 'sots', 'powerlifting', 'with a twist', 'plie', 'plate movers', 'gorilla', 'freehand', 'natural glute', 'bottoms', 'partial', 'kneeling', 'side to side', 'suspended', 'atlas', 'crossover reverse', 'guillotine'];

const LEVELS = { nyborjare: ['beginner'], medel: ['beginner', 'intermediate'], avancerad: ['beginner', 'intermediate', 'expert'] };

const SPLITS = {
  helkropp: { name: 'Helkropp', days: [['*']] },
  overunder: { name: 'Över-/underkropp', days: [['brost', 'rygg', 'axlar', 'biceps', 'triceps'], ['ben', 'mage']] },
  ppl: { name: 'Push / Pull / Ben', days: [['brost', 'axlar', 'triceps'], ['rygg', 'biceps'], ['ben', 'mage']] },
};
const DAY_NAMES = { helkropp: ['Helkropp'], overunder: ['Överkropp', 'Underkropp'], ppl: ['Push', 'Pull', 'Ben & mage'] };

// Enkel deterministisk slump så att samma inställningar + seed ger samma schema
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function scoreExercise(ex, r, level) {
  const n = ex.name.toLowerCase();
  let score = r() * 3;
  if (isCompound(ex)) score += 2;
  if (POPULAR.some(p => n.includes(p))) score += 4;
  if (AVOID.some(p => n.includes(p))) score -= 5;
  if (ex.images && ex.images.length) score += 1;
  if (level === 'nyborjare' && ex.level === 'beginner') score += 1;
  if (level === 'avancerad' && ex.level !== 'beginner') score += 1;
  return score;
}

function chooseSplit(groups, daysPerWeek) {
  const has = g => groups.includes(g);
  const upper = ['brost', 'rygg', 'axlar', 'biceps', 'triceps'].some(has);
  const lower = ['ben'].some(has);
  if (daysPerWeek >= 5 && upper && lower && (has('brost') || has('axlar')) && has('rygg')) return 'ppl';
  if (daysPerWeek === 4 && upper && lower) return 'overunder';
  return 'helkropp';
}

const ISOLATION = /fly|flye|curl|raise|extension|kickback|pushdown|crossover|shrug|crunch/i;
function isCompound(ex) { return ex.mechanic === 'compound' && !ISOLATION.test(ex.name); }

// Övningar som mäts i tid i stället för reps
const TIMED = /^plank$|side bridge|wall sit|isometric neck|isometric chest|one handed hang|dead hang|hollow hold|l-sit/i;
function isTimed(ex) { return !!ex && (ex.custom ? !!ex.timedCustom : TIMED.test(ex.name)); }
function timedScheme(level) {
  const [secMin, secMax] = { nyborjare: [20, 30], medel: [30, 45], avancerad: [45, 60] }[level] || [20, 30];
  return { timed: true, sets: 3, secMin, secMax, repsMin: secMin, repsMax: secMax, rest: 60 };
}

// Cardiotyper som kan läggas in i schemat. ex = övning i databasen med bild, om någon finns.
const CARDIO_TYPES = [
  { id: 'crosstrainer', ex: 'Elliptical_Trainer' },
  { id: 'lopning', ex: 'Running_Treadmill' },
  { id: 'skidor', ex: null },
  { id: 'cykel', ex: 'Bicycling_Stationary' },
  { id: 'rodd', ex: 'Rowing_Stationary' },
  { id: 'promenad', ex: 'Walking_Treadmill' },
  { id: 'simning', ex: null },
  { id: 'trappmaskin', ex: 'Stairmaster' },
  { id: 'hopprep', ex: 'Rope_Jumping' },
];

// Standardveckodagar (0 = måndag) för ett visst antal pass
function defaultDays(n) {
  return { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] }[n] || [0, 2, 4];
}

function scheme(level, ex, group) {
  if (isTimed(ex)) return timedScheme(level);
  const compound = isCompound(ex);
  if (group === 'mage') return { sets: 3, repsMin: 12, repsMax: 20, rest: 60 };
  if (level === 'nyborjare') return { sets: 3, repsMin: 10, repsMax: 12, rest: 90 };
  if (level === 'medel') return compound ? { sets: 4, repsMin: 6, repsMax: 10, rest: 120 } : { sets: 3, repsMin: 10, repsMax: 12, rest: 75 };
  return compound ? { sets: 4, repsMin: 5, repsMax: 8, rest: 150 } : { sets: 3, repsMin: 10, repsMax: 15, rest: 75 };
}

/**
 * settings: { equipment: [...], groups: [...], level, daysPerWeek, minutes, seed }
 */
function generate(exercises, settings) {
  const equipment = new Set((settings.equipment || []).flatMap(e => EQUIPMENT[e] || []));
  equipment.add('body only'); // kroppsvikt fungerar alltid
  const groups = GROUP_ORDER.filter(g => (settings.groups || []).includes(g));
  if (!groups.length) throw new Error('Välj minst en kroppsdel');
  const level = LEVELS[settings.level] ? settings.level : 'nyborjare';
  const dayList = Array.isArray(settings.days) && settings.days.length
    ? [...new Set(settings.days.map(Number).filter(d => d >= 0 && d <= 6))].sort()
    : defaultDays(Math.min(6, Math.max(1, Number(settings.daysPerWeek) || 3)));
  const days = Math.min(6, dayList.length);
  const minutes = Math.min(120, Math.max(20, Number(settings.minutes) || 45));
  const seed = Number(settings.seed) || 1;

  const pool = exercises.filter(ex =>
    ['strength', 'powerlifting'].includes(ex.category) &&
    ex.equipment && equipment.has(ex.equipment) &&
    hasRequirements(ex, settings.equipment || []) &&
    LEVELS[level].includes(ex.level));

  const splitKey = chooseSplit(groups, days);
  const split = SPLITS[splitKey];
  const perSession = Math.min(8, Math.max(3, Math.floor(minutes / 8)));

  // Antal unika passtyper: helkropp med 2+ dagar får A/B-variant för variation
  const templates = splitKey === 'helkropp' ? (days >= 2 ? 2 : 1) : split.days.length;
  const r = rng(seed);
  const usedGlobal = new Map(); // övning -> antal gånger använd i schemat

  const plan = [];
  for (let t = 0; t < templates; t++) {
    const tplGroups = splitKey === 'helkropp' ? groups : split.days[t].filter(g => groups.includes(g));
    if (!tplGroups.length) continue;
    // Fördela platser mellan grupperna efter vikt
    const totalW = tplGroups.reduce((a, g) => a + GROUP_WEIGHT[g], 0);
    let slots = tplGroups.map(g => ({ g, n: Math.max(1, Math.round(perSession * GROUP_WEIGHT[g] / totalW)) }));
    let sum = slots.reduce((a, s) => a + s.n, 0);
    // Justera så summan blir perSession (men minst en per grupp)
    while (sum > perSession && slots.some(s => s.n > 1)) {
      const s = slots.filter(s => s.n > 1).sort((a, b) => GROUP_WEIGHT[a.g] - GROUP_WEIGHT[b.g])[0];
      s.n--; sum--;
    }
    while (sum < perSession) { slots.sort((a, b) => b.n / GROUP_WEIGHT[b.g] - a.n / GROUP_WEIGHT[a.g]).reverse(); slots[0].n++; sum++; }
    slots.sort((a, b) => GROUP_ORDER.indexOf(a.g) - GROUP_ORDER.indexOf(b.g));

    const used = new Set();
    const items = [];
    for (const { g, n } of slots) {
      for (let i = 0; i < n; i++) {
        const sub = SUBTARGETS[g][(i + t) % SUBTARGETS[g].length];
        let cands = pool.filter(ex => ex.primaryMuscles.includes(sub) && !used.has(ex.id));
        if (!cands.length) cands = pool.filter(ex => ex.primaryMuscles.some(m => GROUPS[g].includes(m)) && !used.has(ex.id));
        if (!cands.length) continue;
        // Första övningen i en grupp bör vara en basövning
        const best = cands
          .map(ex => ({ ex, s: scoreExercise(ex, r, level) - 3 * (usedGlobal.get(ex.id) || 0) + (i === 0 && isCompound(ex) ? 2 : 0) }))
          .sort((a, b) => b.s - a.s)[0].ex;
        used.add(best.id);
        usedGlobal.set(best.id, (usedGlobal.get(best.id) || 0) + 1);
        items.push({ exerciseId: best.id, group: g, ...scheme(level, best, g) });
      }
    }
    // Basövningar först inom passet, mage sist
    items.sort((a, b) => (a.group === 'mage') - (b.group === 'mage'));
    const baseName = DAY_NAMES[splitKey][splitKey === 'helkropp' ? 0 : t];
    const fullBody = splitKey !== 'helkropp' || ['ben', 'rygg', 'brost'].every(g => groups.includes(g));
    const name = splitKey === 'helkropp' ? `${fullBody ? baseName : 'Pass'}${templates > 1 ? ' ' + 'AB'[t] : ''}` : baseName;
    plan.push({ name, items });
  }

  // Lägg ut passtyperna över veckans dagar
  const week = Array.from({ length: dayList.length }, (_, i) => i % plan.length);
  // Cardiopass: valda typer roteras över valda dagar
  const types = (settings.cardioTypes || []).filter(t => CARDIO_TYPES.some(c => c.id === t));
  const cardioDays = types.length ? [...new Set((settings.cardioDays || []).map(Number).filter(d => d >= 0 && d <= 6))].sort() : [];
  const cardioMinutes = Math.min(240, Math.max(5, Number(settings.cardioMinutes) || 30));
  const cardio = cardioDays.map((day, i) => ({ type: types[i % types.length], day, minutes: cardioMinutes }));
  return { split: splitKey, splitName: split.name, perSession, templates: plan, week, days: dayList, cardio };
}

function alternatives(exercises, settings, exerciseId, group, excludeIds = []) {
  const equipment = new Set((settings.equipment || []).flatMap(e => EQUIPMENT[e] || []));
  equipment.add('body only');
  const level = LEVELS[settings.level] ? settings.level : 'nyborjare';
  const current = exercises.find(e => e.id === exerciseId);
  const primary = current ? current.primaryMuscles : GROUPS[group] || [];
  const r = rng(7);
  const find = muscles => exercises
    .filter(ex => ex.id !== exerciseId && !excludeIds.includes(ex.id) &&
      ['strength', 'powerlifting'].includes(ex.category) && ex.equipment && equipment.has(ex.equipment) &&
      LEVELS[level].includes(ex.level) && hasRequirements(ex, settings.equipment || []) && ex.primaryMuscles.some(m => muscles.includes(m)))
    .map(ex => ({ ex, s: scoreExercise(ex, r, level) + (ex.primaryMuscles[0] === primary[0] ? 3 : 0) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 12)
    .map(x => x.ex);
  // Få träffar på exakt samma muskel? Bredda till hela kroppsdelen.
  const exact = find(primary);
  return exact.length >= 5 ? exact : find([...new Set([...primary, ...(GROUPS[group] || [])])]);
}

module.exports = { generate, alternatives, scheme, isTimed, timedScheme, defaultDays, CARDIO_TYPES, EQUIPMENT, GROUPS, hasRequirements };
