'use strict';
// Illustrationer och steg-för-steg för uppvärmning och stretch.
// Varje rörelse ritas som en enkel figur som växlar mellan två lägen (a och b).
// Ett läge är punkterna: huvud, axlar, höft, vänster armbåge, vänster hand, höger armbåge, höger hand,
// vänster knä, vänster fot, höger knä, höger fot och (valfritt) mitten av ryggen.
// Koordinater i en ruta 0–100, golvet ligger på y = 95.
const STAND = '50,14 50,24 50,52 45,38 43,52 55,38 57,52 47,73 46,94 53,73 54,94';
const MOVES = {
  // ---------- Uppvärmning ----------
  jacks: {
    a: STAND,
    b: '50,14 50,24 50,52 38,14 32,4 62,14 68,4 41,73 33,94 59,73 67,94',
    sv: ['Stå med fötterna ihop och armarna längs sidorna.', 'Hoppa ut med fötterna och för armarna upp över huvudet.', 'Hoppa tillbaka till start. Håll ett jämnt, lätt tempo.'],
    en: ['Stand with your feet together and arms by your sides.', 'Jump your feet out and raise your arms above your head.', 'Jump back to the start. Keep an even, light pace.'],
  },
  inchworm: {
    a: '58,84 57,76 46,52 58,86 59,95 59,86 60,95 46,73 46,94 46,73 46,94',
    b: '14,74 22,80 52,84 22,88 22,95 23,88 23,95 68,89 84,94 68,89 84,94',
    sv: ['Stå upprätt och fäll framåt tills händerna når golvet. Böj knäna lite om det behövs.', 'Gå ut med händerna tills du står i en hög planka.', 'Gå tillbaka med händerna mot fötterna och res dig upp.'],
    en: ['Stand tall and hinge forward until your hands reach the floor. Bend your knees a little if needed.', 'Walk your hands out until you are in a high plank.', 'Walk your hands back towards your feet and stand up.'],
  },
  armcircles: {
    a: '50,14 50,24 50,52 38,25 26,25 62,25 74,25 47,73 46,94 53,73 54,94',
    b: '50,14 50,24 50,52 39,17 31,10 61,17 69,10 47,73 46,94 53,73 54,94',
    sv: ['Stå stadigt och lyft armarna rakt ut åt sidorna.', 'Gör små cirklar som blir större och större.', 'Byt håll efter halva tiden.'],
    en: ['Stand steady and lift your arms straight out to the sides.', 'Make small circles that get bigger and bigger.', 'Change direction halfway through.'],
  },
  armswings: {
    a: '50,14 50,24 50,52 37,26 24,26 63,26 76,26 47,73 46,94 53,73 54,94',
    b: '50,14 50,24 50,52 43,33 60,35 57,33 40,35 47,73 46,94 53,73 54,94',
    sv: ['Stå med armarna rakt ut åt sidorna.', 'Sväng armarna in och korsa dem framför bröstet.', 'Sväng ut brett igen så att bröstet öppnas. Växla vilken arm som är överst.'],
    en: ['Stand with your arms straight out to the sides.', 'Swing your arms in and cross them in front of your chest.', 'Swing them wide again to open your chest. Alternate which arm is on top.'],
  },
  catcow: {
    a: '22,56 30,64 64,62 30,75 30,86 31,75 31,86 64,86 82,87 65,86 83,87 47,70',
    b: '24,72 30,62 64,60 30,74 30,86 31,74 31,86 64,86 82,87 65,86 83,87 47,51',
    sv: ['Stå på alla fyra med händerna under axlarna och knäna under höfterna.', 'Andas in, sänk magen mot golvet och lyft blicken (svank).', 'Andas ut, runda ryggen mot taket och låt huvudet hänga (kattrygg).'],
    en: ['Get on all fours with hands under shoulders and knees under hips.', 'Breathe in, drop your belly towards the floor and look up (cow).', 'Breathe out, round your back towards the ceiling and let your head hang (cat).'],
  },
  shoulderrolls: {
    a: '50,15 50,25 50,52 44,39 43,53 56,39 57,53 47,73 46,94 53,73 54,94',
    b: '50,14 50,20 50,52 44,34 43,48 56,34 57,48 47,73 46,94 53,73 54,94',
    sv: ['Stå avslappnat med armarna längs sidorna.', 'Dra upp axlarna mot öronen och rulla dem bakåt och ned.', 'Gör hälften av tiden bakåt och hälften framåt.'],
    en: ['Stand relaxed with your arms by your sides.', 'Lift your shoulders towards your ears and roll them back and down.', 'Do half the time backwards and half forwards.'],
  },
  inclinepush: {
    a: '24,48 30,54 60,72 30,63 30,72 31,63 31,72 73,83 86,94 73,83 86,94',
    b: '21,58 28,64 60,77 38,62 30,72 39,62 31,72 73,85 86,94 73,85 86,94',
    prop: 'bench',
    sv: ['Sätt händerna mot en bänk eller ställ dig på knä, lite bredare än axlarna.', 'Sänk bröstet kontrollerat mot bänken med rak kropp.', 'Tryck upp igen. Lugnt tempo, det här är bara uppvärmning.'],
    en: ['Put your hands on a bench or kneel, slightly wider than your shoulders.', 'Lower your chest towards the bench with a straight body.', 'Press back up. Calm pace, this is only a warm-up.'],
  },
  hipcircles: {
    a: '50,14 50,24 45,52 40,40 44,51 60,40 56,51 44,73 46,94 51,73 54,94',
    b: '50,14 50,24 55,52 40,40 48,51 60,40 60,51 49,73 46,94 56,73 54,94',
    sv: ['Stå med fötterna axelbrett och händerna på höfterna.', 'Rita stora cirklar med höften utan att flytta fötterna.', 'Byt håll efter halva tiden.'],
    en: ['Stand with feet shoulder-width apart and hands on your hips.', 'Draw big circles with your hips without moving your feet.', 'Change direction halfway through.'],
  },
  legswings: {
    a: '50,14 50,24 50,52 44,36 36,44 56,36 60,48 50,73 50,94 62,68 74,82',
    b: '50,14 50,24 50,52 44,36 36,44 56,36 60,48 50,73 50,94 42,72 32,88',
    prop: 'wall-left',
    sv: ['Stå på ett ben och håll i en vägg eller ett ställ för balansen.', 'Pendla det fria benet framåt och bakåt i en avslappnad båge.', 'Låt rörelsen bli större efter hand. Byt ben halvvägs.'],
    en: ['Stand on one leg and hold a wall or rack for balance.', 'Swing the free leg forward and back in a relaxed arc.', 'Let the movement grow gradually. Switch legs halfway.'],
  },
  airsquat: {
    a: '50,14 50,24 50,52 58,32 68,32 58,32 68,32 52,73 50,94 52,73 50,94',
    b: '55,40 52,49 37,70 62,50 72,50 62,50 72,50 58,73 50,94 58,73 50,94',
    sv: ['Stå med fötterna axelbrett och tårna lite utåt.', 'Skjut bak höften och böj knäna tills låren är parallella med golvet. Armarna framåt för balans.', 'Tryck ifrån genom hela foten och res dig upp.'],
    en: ['Stand with feet shoulder-width apart and toes slightly out.', 'Push your hips back and bend your knees until your thighs are parallel to the floor. Arms forward for balance.', 'Push through your whole foot and stand up.'],
  },
  wgs: {
    a: '58,30 56,40 48,66 60,64 62,90 58,62 62,90 64,72 70,94 34,84 22,92',
    b: '56,30 54,40 48,66 60,64 62,90 56,26 54,10 64,72 70,94 34,84 22,92',
    sv: ['Ta ett långt utfall framåt och sätt händerna i golvet innanför främre foten.', 'För armbågen ned mot golvet, vrid sedan upp samma arm mot taket och följ handen med blicken.', 'Kliv tillbaka och byt sida.'],
    en: ['Take a long lunge forward and put your hands on the floor inside your front foot.', 'Lower your elbow towards the floor, then rotate the same arm up to the ceiling and follow your hand with your eyes.', 'Step back and switch sides.'],
  },
  glutebridge: {
    a: '14,86 22,88 50,90 32,92 42,93 32,92 42,93 64,74 74,94 64,74 74,94',
    b: '14,86 22,86 50,74 32,92 42,93 32,92 42,93 66,72 74,94 66,72 74,94',
    sv: ['Ligg på rygg med böjda knän och fötterna i golvet.', 'Spänn sätet och lyft höften tills kroppen är rak från knä till axlar.', 'Sänk kontrollerat och upprepa.'],
    en: ['Lie on your back with bent knees and feet on the floor.', 'Squeeze your glutes and lift your hips until your body is straight from knees to shoulders.', 'Lower with control and repeat.'],
  },
  // ---------- Stretch ----------
  chestdoor: {
    a: '46,14 46,24 48,52 34,24 32,12 52,38 54,50 49,73 48,94 53,73 54,94',
    b: '52,15 51,25 52,52 34,24 32,12 56,38 58,50 52,73 50,94 56,73 56,94',
    prop: 'door',
    sv: ['Ställ dig i en dörröppning och lägg underarmen mot karmen, armbågen i axelhöjd.', 'Luta dig sakta framåt tills du känner en stretch i bröstet.', 'Andas lugnt och håll. Byt sida.'],
    en: ['Stand in a doorway and place your forearm on the frame, elbow at shoulder height.', 'Lean slowly forward until you feel a stretch in your chest.', 'Breathe calmly and hold. Switch sides.'],
  },
  child: {
    a: '30,82 40,78 62,84 26,86 14,90 27,86 15,90 44,93 66,93 45,93 67,93',
    b: '26,86 36,82 64,86 22,90 8,92 23,90 9,92 44,93 66,93 45,93 67,93',
    sv: ['Sitt på knä och sätt dig ned på hälarna.', 'Fäll fram överkroppen och sträck armarna långt fram i golvet.', 'Slappna av i ryggen och andas djupt ned i magen.'],
    en: ['Kneel and sit back on your heels.', 'Fold your upper body forward and reach your arms far forward on the floor.', 'Relax your back and breathe deeply into your belly.'],
  },
  lat: {
    a: '44,14 44,24 46,52 34,26 24,28 35,26 25,28 46,73 46,94 48,73 48,94',
    b: '32,36 40,40 70,56 31,36 22,30 32,36 23,30 64,74 58,94 65,74 59,94',
    prop: 'pole',
    sv: ['Håll i en stolpe eller ett ställ i axelhöjd med raka armar.', 'Skjut höften bakåt och sjunk ned så att armarna och ryggen sträcks.', 'Vrid lite åt sidan för att känna mer i ena sidan. Byt sida.'],
    en: ['Hold a pole or rack at shoulder height with straight arms.', 'Push your hips back and sink down so your arms and back stretch.', 'Turn slightly to one side to feel more on that side. Switch sides.'],
  },
  crossbody: {
    a: '50,14 50,24 50,52 43,32 47,27 44,28 34,26 47,73 46,94 53,73 54,94',
    b: '50,14 50,24 50,52 43,32 48,27 42,28 30,26 47,73 46,94 53,73 54,94',
    sv: ['Stå eller sitt upprätt och för ena armen rakt över bröstet.', 'Dra armen närmare kroppen med andra handen, strax ovanför armbågen.', 'Håll axeln sänkt och andas. Byt arm.'],
    en: ['Stand or sit tall and bring one arm straight across your chest.', 'Pull the arm closer with your other hand, just above the elbow.', 'Keep your shoulder down and breathe. Switch arms.'],
  },
  tricepsoh: {
    a: '50,14 50,24 50,52 44,12 52,8 55,9 47,20 47,73 46,94 53,73 54,94',
    b: '50,14 50,24 50,52 43,11 51,7 53,8 45,22 47,73 46,94 53,73 54,94',
    sv: ['Lyft ena armen och böj armbågen så att handen hamnar bakom huvudet.', 'Ta tag i armbågen med andra handen och tryck den försiktigt bakåt.', 'Håll huvudet upprätt. Byt arm.'],
    en: ['Raise one arm and bend the elbow so your hand ends up behind your head.', 'Hold the elbow with your other hand and press it gently back.', 'Keep your head upright. Switch arms.'],
  },
  bicepswall: {
    a: '46,14 46,24 47,52 34,28 22,30 52,38 54,50 48,73 47,94 52,73 53,94',
    b: '54,14 52,24 51,52 34,28 22,30 58,38 60,50 52,73 50,94 56,73 56,94',
    prop: 'wall-left',
    sv: ['Ställ dig med sidan mot en vägg och lägg handflatan mot väggen bakom dig, armen rak.', 'Vrid sakta bort kroppen från väggen tills du känner en stretch i biceps och bröst.', 'Håll och andas. Byt arm.'],
    en: ['Stand side-on to a wall and place your palm on the wall behind you, arm straight.', 'Slowly turn your body away from the wall until you feel a stretch in your biceps and chest.', 'Hold and breathe. Switch arms.'],
  },
  quad: {
    a: '50,14 50,24 50,52 56,36 60,48 44,40 40,57 50,73 50,94 50,74 40,58',
    b: '50,14 50,24 50,52 56,36 60,48 44,42 39,55 50,73 50,94 49,75 38,56',
    sv: ['Stå på ett ben, håll gärna i något för balansen.', 'Böj det andra knät och dra hälen mot rumpan med handen.', 'Håll knäna ihop och skjut fram höften lite. Byt ben.'],
    en: ['Stand on one leg, holding something for balance if you like.', 'Bend the other knee and pull your heel towards your glutes with your hand.', 'Keep your knees together and push your hips slightly forward. Switch legs.'],
  },
  hamstring: {
    a: '30,52 30,62 30,88 36,74 44,84 37,74 45,84 50,90 70,90 51,90 71,90',
    b: '54,72 46,72 30,88 56,82 66,88 57,82 67,88 50,90 70,90 51,90 71,90',
    sv: ['Sitt på golvet med raka ben framför dig.', 'Fäll fram från höften med rak rygg och sträck händerna mot fötterna.', 'Gå bara så långt att det drar lagom på baksidan av låren, och håll.'],
    en: ['Sit on the floor with your legs straight in front of you.', 'Hinge forward from the hips with a straight back and reach towards your feet.', 'Only go as far as a comfortable pull in the back of your thighs, and hold.'],
  },
  hipflexor: {
    a: '46,32 46,42 46,68 52,52 58,64 42,52 40,64 60,72 64,94 36,93 20,93',
    b: '50,36 50,46 52,72 56,56 62,66 46,56 44,66 62,74 64,94 36,93 20,93',
    sv: ['Gå ned i ett utfall med bakre knät i golvet.', 'Spänn sätet på bakre benet och skjut höften framåt.', 'Håll överkroppen upprätt. Byt sida.'],
    en: ['Kneel into a lunge with the back knee on the floor.', 'Squeeze the glute of the back leg and push your hips forward.', 'Keep your upper body upright. Switch sides.'],
  },
  figure4: {
    a: '12,86 20,88 48,88 34,78 52,74 34,80 54,76 60,70 72,88 52,64 62,68',
    b: '12,86 20,88 47,88 32,76 46,70 32,78 48,72 52,64 64,80 44,58 54,62',
    sv: ['Ligg på rygg med böjda knän och lägg ena foten över motsatt knä.', 'Ta tag bakom låret på det undre benet och dra det mot bröstet.', 'Håll huvudet och axlarna i golvet. Byt sida.'],
    en: ['Lie on your back with bent knees and cross one ankle over the opposite knee.', 'Hold behind the thigh of the lower leg and pull it towards your chest.', 'Keep your head and shoulders on the floor. Switch sides.'],
  },
  calf: {
    a: '66,26 62,34 50,56 72,30 82,28 72,32 82,30 64,74 64,94 36,76 24,94',
    b: '70,28 66,36 54,58 74,32 82,28 74,34 82,30 66,74 64,94 38,76 24,94',
    prop: 'wall-right',
    sv: ['Stå vänd mot en vägg med händerna mot väggen och ena foten långt bak.', 'Håll bakre benet rakt och hälen i golvet, böj främre knät.', 'Luta dig fram tills det drar i vaden. Byt ben.'],
    en: ['Face a wall with your hands on it and one foot far back.', 'Keep the back leg straight and the heel on the floor, bend the front knee.', 'Lean forward until you feel a stretch in the calf. Switch legs.'],
  },
  cobra: {
    a: '14,86 22,90 52,92 24,92 30,93 25,92 31,93 70,93 86,93 70,93 86,93',
    b: '16,64 24,74 52,90 25,84 28,93 26,84 29,93 70,93 86,93 70,93 86,93',
    sv: ['Ligg på mage med händerna under axlarna.', 'Pressa upp överkroppen med armarna och låt höften ligga kvar i golvet.', 'Slappna av i sätet och titta framåt. Sänk lugnt.'],
    en: ['Lie on your stomach with your hands under your shoulders.', 'Press your upper body up with your arms and keep your hips on the floor.', 'Relax your glutes and look forward. Lower slowly.'],
  },
};

// Ritar en rörelse som en animerad SVG-figur
function moveSvg(id, cls = '') {
  const m = MOVES[id];
  if (!m) return '';
  const parse = s => { const p = s.trim().split(/\s+/).map(x => x.split(',').map(Number)); if (!p[11]) p[11] = [(p[1][0] + p[2][0]) / 2, (p[1][1] + p[2][1]) / 2]; return p; };
  const A = parse(m.a), Bp = parse(m.b);
  const lines = [[1, 11, 2], [1, 3, 4], [1, 5, 6], [2, 7, 8], [2, 9, 10]];
  const pts = (P, l) => l.map(i => P[i].join(',')).join(' ');
  const anim = (attr, a, b) => `<animate attributeName="${attr}" values="${a};${b};${b};${a};${a}" keyTimes="0;.35;.5;.85;1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines=".4 0 .2 1;0 0 1 1;.4 0 .2 1;0 0 1 1"/>`;
  const props = {
    bench: '<rect x="18" y="72" width="22" height="5" rx="1.5" class="prop"/><path d="M21 77v18M37 77v18" class="propline"/>',
    door: '<path d="M30 4v91M30 4h-8" class="propline"/>',
    pole: '<path d="M20 4v91" class="propline"/>',
    'wall-left': '<path d="M18 4v91" class="propline wall"/>',
    'wall-right': '<path d="M84 4v91" class="propline wall"/>',
  };
  return `<svg class="move ${cls}" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M4 95.5h92" class="floor"/>${props[m.prop] || ''}
    ${lines.map(l => `<polyline points="${pts(A, l)}">${anim('points', pts(A, l), pts(Bp, l))}</polyline>`).join('')}
    <circle r="5.5" cx="${A[0][0]}" cy="${A[0][1]}">${anim('cx', A[0][0], Bp[0][0])}${anim('cy', A[0][1], Bp[0][1])}</circle>
  </svg>`;
}
