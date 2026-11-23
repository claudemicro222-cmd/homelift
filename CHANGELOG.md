# Nyheter

Vad som är nytt i varje version av HomeLift. Uppdatera containern i Unraid (**Docker → Check for Updates**) för att få den senaste versionen. Din data ligger kvar.

## 0.5.0 (2026-11-23)

- **Animation och muskelbild på alla övningar.** Övningssidan visar först en animation och en kroppsfigur där musklerna som tränas mest lyser rött och de som hjälper till gult. Samma sak finns direkt i passet under "Så gör du".
- **Figurer och steg-för-steg för uppvärmning och stretch.** Varje rörelse har en animerad figur och tre steg, både i listan och i den guidade timern.
- **Välj animation, video eller båda.** Ny inställning under Utseende. Animation är standard och laddar ingen video. Videon kan alltid visas med en knapp.
- **Förra passets vikter förifyllda.** Vikt och reps från förra gången står i grått i varje set. Tryck bara på bocken så sparas de.
- **Behåll platsen i passet.** Går du in på en övning och sedan tillbaka hamnar du på samma ställe i passet.
- **Vilotimern följer med.** Timern syns på alla sidor. Tryck på den för att gå tillbaka till passet.

## 0.4.0 (2026-11-20)

- **Tydligare lokal video.** "Sparad på servern" i en grön ruta med en knapp för att ta bort videon. Tas den bort kommer "Ladda ner" tillbaka.
- **Uppskattat 1RM över tid** på övningssidan och i statistiken, med växling mellan 1RM och tyngsta vikt.
- **Månadsrapport** med pass, volym, tid, nya rekord och viktförändring jämfört med förra månaden.
- **Muskelkarta** över veckans träning och över vilka muskler som är återhämtade.
- **Vilodagsförslag** på startsidan när musklerna i dagens pass inte har hunnit återhämta sig.
- **Byt övning mitt i passet** utan att schemat ändras.
- **Hur tungt kändes det?** Valfritt betyg per set (lätt, lagom, tungt, max) som används i viktförslagen.
- **Snabbpass på 15–20 minuter**, byggt av dagens pass.
- **Röstcoach** som läser upp nästa övning och räknar ner vilan.
- **Egna övningar** med muskler, utrustning, instruktioner och video, som kan läggas in i schemat.
- **Offlineläge.** Set som loggas utan kontakt med servern sparas i mobilen och skickas när anslutningen är tillbaka.

## 0.3.0 (2026-11-20)

- **Allt på svenska.** Alla cirka 870 övningar har svenska namn och instruktioner. Sök fungerar på båda språken.
- **Inbäddade instruktionsvideor** på övningssidan. Du kan välja en egen YouTube-länk.
- **Bättre videonedladdning** med tydliga felmeddelanden, och möjlighet att ladda upp en egen fil.
- **Installation via HACS och Unraid-mall.** Home Assistant-integrationen och kortet installeras som ett anpassat arkiv i HACS. Unraid-containern får namn och ikon från mallen.
- **Hur många scheman som helst.** Spara, döp om, växla och ta bort.
- **Bättre vilotimer** med egen vilotid per övning, ljud av/på och notis när appen ligger i bakgrunden.
- **Personbästa** firas direkt i passet, och varje övning har en rekordlista med datum.
- **Smartare progression** med förslag på vikt, reps eller tid, "Använd förslaget" och lättare vecka vid platå.
- **Förra passets siffror** på varje setrad.
- **Skivkalkylator** för skivstången.
- **Kroppsmått** (midja, bröst, armar, lår med mera) med grafer.
- **Säkerhetskopior** varje natt, export som JSON och import från fil.
- **Veckomål och streak**, även som sensorer i Home Assistant.
- **Superset**: två övningar i följd utan vila emellan.

## 0.2.0 (2026-11-19)

- **Nytt namn och ny logga:** HomeLift, med ett hus och en hantel.
- **Svenska och engelska** i hela appen.
- **Ljust och mörkt läge.**
- **Home Assistant-integration** med sensorer, ett eget kort och påminnelser på träningsdagar.
- **Cardiopass** i schemat, till exempel crosstrainer, löpning och skidor.
- **Vikt, längd och BMI** i profilen.
- **Uppvärmning och stretch** runt passet, med guidad timer.
- **Timer för tidsövningar** som plankan.
- **Lokala instruktionsvideor** utan reklam, nedladdade till servern.

## 0.1.0 (2026-11-19)

- Första versionen: schemagenerator efter utrustning, passläge med vilotimer, övningsbibliotek, statistik, flera profiler och CSV-export.
