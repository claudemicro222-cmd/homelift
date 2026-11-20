# Ändringslista

Önskade ändringar samlas här. Ingen ny version byggs förrän du säger **kör**. Då genomförs allt
under *Att göra*, en ny image pushas och punkterna flyttas till *Klart* med versionsnummer.

## Att göra

_Tom just nu._

## Klart

### 0.3.0 (2026-11-20)
- [x] **Fixa videonedladdningen.** Nedladdning av video misslyckas och appen visar bara "Kunde inte ladda ner:" utan orsak. Visa det riktiga felet, ta reda på varför hämtningen misslyckas (t.ex. att yt-dlp numera behöver en JavaScript-motor för YouTube, eller att YouTube spärrar servern) och se till att det fungerar. *(tillagd 2026-11-20)*
- [x] **Allt på svenska när svenska är valt.** Övningsinstruktionerna (och övningsnamnen) kommer i dag på engelska från övningsdatabasen. Översätt alla ca 870 övningar till svenska och lägg översättningen i appen, så att inget engelskt syns när svenska är valt. Sök ska fungera på både svenska och engelska. *(tillagd 2026-11-20)*
- [x] **Namn och ikon i Unraid.** Containern heter fortfarande "traning" och har bicepsikonen. Ikonen i mallen pekar på GitHub, som inte går att nå när repot är privat. Peka ikonen på en adress som fungerar och ge instruktion för att byta namn och ikon på den befintliga containern. *(tillagd 2026-11-20)*
- [x] **Installera via "marknadsplatser" i stället för terminalen.** Home Assistant-integrationen och kortet ska gå att installera via HACS (som eget repository), och Unraid-appen via Community Apps (mall klar att skicka in). Båda kräver ett publikt GitHub-repo, och hela homelift får bli publikt (godkänt 2026-11-20) så länge inget personligt läcker. Innan dess: byt demonamnet i README och skärmbilder mot ett påhittat namn, och slå ihop git-historiken så att gamla kontonamn och sessionslänkar försvinner. *(tillagd 2026-11-20)*
- [x] **Inbäddade instruktionsvideor som standard.** Videon ska spelas direkt på övningssidan utan att man lämnar appen. Servern letar upp en passande YouTube-video per övning och sparar den, och sidan bäddar in den. Finns videon nedladdad lokalt visas den i stället (reklamfritt). Nedladdningen finns kvar. *(tillagd 2026-11-20)*
- [x] **Obegränsat antal scheman.** Skapa, spara, döpa om, växla mellan och ta bort hur många scheman som helst, även det aktiva. Tydlig lista över alla scheman på Schema-sidan. Ett schema är aktivt åt gången och man växlar enkelt mellan dem. *(tillagd 2026-11-20)*
- [x] **Bättre vilotimer.** Finns redan (startar när ett set loggas, piper och vibrerar). Lägg till: egen vilotid per övning, ljud av/på, och notis när appen ligger i bakgrunden. *(tillagd 2026-11-20)*
- [x] **Fira personbästa.** Visa en tydlig markering direkt i passet när du slår ett rekord, och en rekordlista per övning (tyngsta vikt, flest reps, bästa 1RM, längsta tid) med datum. *(tillagd 2026-11-20)*
- [x] **Smartare progression.** Viktförslag finns redan. Lägg till förslag för reps och tid, ett "använd förslaget"-tryck och en lättare vecka (deload) om du stått still flera pass. *(tillagd 2026-11-20)*
- [x] **Förra gången bredvid varje set.** Visas redan som text ovanför seten. Gör det tydligare: förra passets vikt och reps direkt på varje setrad. *(tillagd 2026-11-20)*
- [x] **Plattkalkylator.** Räknar ut vilka viktskivor som ska på varje sida av stången för en viss vikt, utifrån stångvikt och skivor du har. *(tillagd 2026-11-20)*
- [x] **Kroppsmått.** Logga midja, bröst, armar, lår m.m. över tid, med grafer. *(tillagd 2026-11-20)*
- [x] **Backup och export.** Export av all data som JSON (utöver CSV), import från fil, och automatisk backup till datamappen varje natt. *(tillagd 2026-11-20)*
- [x] **Veckomål och streaks.** Sätt ett mål för antal pass per vecka, se framsteg och streak mot målet, och få "veckomål nått" som sensor i Home Assistant. *(tillagd 2026-11-20)*
- [x] **Superset och cirkelträning.** Gruppera övningar i passet som körs i följd utan vila mellan, med vila först efter hela varvet. *(tillagd 2026-11-20)*

### 0.2.0 (2026-11-19)
- [x] **Språkval svenska/engelska.** Man ska kunna byta språk mellan svenska och engelska, och det ska gälla allt i användargränssnittet. *(tillagd 2026-11-19)*
- [x] **Byt namn till HomeLift.** Appens namn i gränssnittet, manifest, sidtitel, Unraid-mall och README. *(tillagd 2026-11-19)*
- [x] **Ny logga.** Modern ikon i stället för biceps (valt förslag 1): vit linjeikon med ett hus (kontur med tak) och en hantel (stång med två viktskivor) inuti, på en rundad blå kvadrat. Används som logga och app-ikoner (192/512 px, hemskärm). *(tillagd 2026-11-19, uppdaterad 2026-11-19)*
- [x] **Enhetligt grafiskt gränssnitt.** Samma visuella stil i hela appen, i linje med den nya loggan. *(tillagd 2026-11-19)*
- [x] **Ladda ner instruktionsvideor lokalt.** Ett val (t.ex. i inställningar) som laddar ner alla instruktionsvideor till servern så att de spelas upp därifrån. Syftet är att slippa reklamen: videorna ska spelas reklamfritt direkt från servern. *(tillagd 2026-11-19, förtydligad 2026-11-19)*
- [x] **Ljust och mörkt läge.** Möjlighet att växla mellan light mode och dark mode. *(tillagd 2026-11-19)*
- [x] **Home Assistant-integration (ersätter Google Kalender).** Allt lokalt, appen ska inte behöva nås från internet. Notifikationer via Home Assistant på dagar man ska träna, plus ett eget kort i Home Assistant som visar statistik och info om nästa pass. *(tillagd 2026-11-19, ändrad 2026-11-19)*
- [x] **Cardiopass i schemat.** Möjlighet att lägga till cardiopass, t.ex. crosstrainer, löpning och skidor. *(tillagd 2026-11-19)*
- [x] **Vikt, längd och BMI i profilen.** Ange vikt och längd i profilen, se nuvarande BMI och uppdatera vikten allt eftersom (kopplas till den befintliga kroppsviktskurvan i statistiken). *(tillagd 2026-11-19)*
- [x] **Uppvärmning och stretch runt passet.** Standard: dynamisk uppvärmning/rörlighet före passet (5–8 min) och statisk stretch efter (5 min), anpassat till dagens muskelgrupper. Före och efter kan slås på/av var för sig i inställningarna. *(tillagd 2026-11-19)*
- [x] **Timer för tidsövningar.** Inbyggd timer för övningar som räknas i tid, t.ex. plankan: sekunder i stället för reps, nedräkning med ljud/vibration och tiden loggas per set. *(tillagd 2026-11-19)*
- [x] **Bättre README på GitHub.** Mer inbjudande startsida med logga, skärmbilder, tydlig beskrivning av vad appen gör och en enkel steg-för-steg-installation på Unraid (som fungerar även när repot är privat). *(tillagd 2026-11-19)*


### 0.1.0 (2026-11-19)
- [x] Första versionen: schemagenerator, passläge med vilotimer, övningsbibliotek, statistik, profiler, CSV-export.
- [x] Docker-image byggs automatiskt till GHCR vid push till `main`.
