/* ══════════════════════════════════════════════════════════
   ZEPHORIS — spoločná logika inzerátov a kalkulačky
   Vykresľuje kartičky inzerátov a obsluhuje posuvníky.
   Spoločné pre všetky stránky — zmena tu platí na celom webe.
   ══════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════
   ZEPHORIS — zdroj inzerátov
   ──────────────────────────────────────────────────────────
   Toto je dočasný zdroj údajov. Stránky si inzeráty vykresľujú
   odtiaľto cez Z.renderAds(), takže keď neskôr prejdeme na
   databázu (Supabase), vymení sa iba tento súbor a v HTML
   sa nemení nič.

   Polia:
     typ         'osoba' | 'firma'
     ucel        text zobrazený ako nadpis inzerátu
     suma        hľadaná suma v eurách
     mesiace     predpokladaná doba — minimum je 6
     splatka     koľko zadávateľ podľa VLASTNÉHO vyjadrenia zvládne
                 mesačne splácať. NIE JE to výška splátky úveru ani
                 údaj o jeho cene — portál žiadne sadzby neurčuje.
     kraj        krajina
     zobrazenia  počet zobrazení inzerátu
     balik       'rocny' | 'polrocny' | 'mesacny' — zaplatený balík.
                 Určuje poradie vo výpise aj farebné zvýraznenie:
                   rocny     farebné zvýraznenie + prednostné poradie (hore)
                   polrocny  farebné zvýraznenie, poradie za ročnými
                   mesacny   základné zobrazenie, na konci výpisu
                 Radenie robí Z.renderAds(), netreba ho riešiť v HTML.
     zverejnene  dátum zverejnenia vo formáte RRRR-MM-DD. Štítok „Nový“
                 sa zobrazuje sám, kým je inzerát mladší ako 7 dní, a
                 potom sám zmizne. Nič sa neprepína ručne.
     konci       posledný deň zaplatenej doby (RRRR-MM-DD). Po ňom inzerát
                 sám zmizne z celého webu. Nepovinné, na webe sa nezobrazuje.
   ══════════════════════════════════════════════════════════ */

var INZERATY_SK = [
  /* Údaje inzerátov. Účel je vždy jedna z hodnôt z roletky vo formulári,
     popis je vlastný text zadávateľa — presne ako to vyzerá v náhľade. */
  /* Skutočný inzerát, zaplatený 12. 9. 2026 (prvá objednávka z reklamy). */
  { id: 'A-4863', typ: 'osoba', ucel: 'Dostavba dvojdomu (rezervovaný na predaj)', suma: 100000, mesiace: 12, splatka: null, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-09-12', konci: '2026-12-12',
    popis: 'Mám rozostavaný dvojdom, znalecká hodnota 180 tis. €. Hodnota stúpa, na stavbe sa pracuje. Do konca roka 2026 budú domy postavené do štandardu. Celková znalecká hodnota bude spolu 616 000 €. Predajná cena: 1. dom (rezervovaný) v cene 280 000 €, 2. dom v predaji za 290 000 €, voľný. Hľadám investora na výpomoc pri dostavbe. Úver 150 - 200 tis. € vyplatený najneskôr 02/2027 z predaja 1. dvojdomu. Ideálne splatiť všetko na konci alebo mesačne iba úroky, je to na dohode.' },
  { id: 'A-4821', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 14000, mesiace: 48, splatka: 340, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-07-28',
    popis: 'Prerábam kúpeľňu a kuchyňu v byte, kde bývam. Materiál mám vybraný a remeselníkov dohodnutých na jeseň. Rozpočet od nich viem poslať.' },
  { id: 'A-4794', typ: 'osoba', ucel: 'Kúpa auta', suma: 11000, mesiace: 48, splatka: 270, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-02',
    popis: 'Potrebujem auto na dochádzanie do práce, doterajšie mi doslúžilo. Hľadám ojazdené od predajcu so zárukou, konkrétny model mám vybraný.' },
  { id: 'A-4838', typ: 'osoba', ucel: 'Kúpa bytu', suma: 62000, mesiace: 120, splatka: 620, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-08-21',
    popis: 'Hľadám dvojizbový byt v meste, kde pracujem. Chodím na osobné obhliadky, jeden byt mám už vytipovaný a znalecký posudok viem dodať.' },
  { id: 'A-4830', typ: 'osoba', ucel: 'Kúpa domu', suma: 85000, mesiace: 180, splatka: 640, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-08-19',
    popis: 'Starší rodinný dom na okraji mesta, ktorý chcem postupne opravovať vlastnými silami. Kúpna cena je dohodnutá s predávajúcim, zmluvu pripravuje advokát.' },
  { id: 'A-4817', typ: 'osoba', ucel: 'Refinancovanie', suma: 9000, mesiace: 36, splatka: 280, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-07-14',
    popis: 'Mám dva staršie splátkové záväzky a chcel by som ich spojiť do jedného, aby som mal jednu splátku a jasný termín doplatenia.' },
  { id: 'A-4806', typ: 'osoba', ucel: 'Štúdium', suma: 6500, mesiace: 36, splatka: 200, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-23',
    popis: 'Dvojročný večerný program popri zamestnaní. Školné sa platí po semestroch, potvrdenie o prijatí a rozpis platieb viem poslať.' },
  { id: 'A-4788', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 3500, mesiace: 24, splatka: 160, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-11',
    popis: 'Vybavenie do novej kuchyne a práčka po sťahovaní. Mám konkrétny zoznam spotrebičov aj cenovú ponuku z predajne.' },
  { id: 'A-4844', typ: 'osoba', ucel: 'Kúpa auta', suma: 16500, mesiace: 60, splatka: 320, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-08-12',
    popis: 'Rodinné auto pre štyroch, doterajšie je po nehode. Mám vybraté dva konkrétne kusy od predajcov a viem doložiť ich servisnú históriu.' },
  { id: 'A-4841', typ: 'osoba', ucel: 'Úhrada dlhov', suma: 7500, mesiace: 36, splatka: 240, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-08-23',
    popis: 'Chcem doplatiť tri menšie záväzky naraz a mať prehľad v jednej dohode s jasným termínom. Zoznam záväzkov viem poslať.' },
  { id: 'A-4835', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 22000, mesiace: 72, splatka: 380, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-07-05',
    popis: 'Výmena strechy a zateplenie staršieho domu. Mám cenovú ponuku od firmy aj harmonogram prác na budúcu jar.' },
  { id: 'A-4828', typ: 'osoba', ucel: 'Kúpa bytu', suma: 48000, mesiace: 120, splatka: 520, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-07-21',
    popis: 'Menší byt v krajskom meste, kde mám prácu na dobu neurčitú. Byt mám vytipovaný a chodím na obhliadky s realitným maklérom.' },
  { id: 'A-4812', typ: 'osoba', ucel: 'Refinancovanie', suma: 12500, mesiace: 48, splatka: 300, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-15',
    popis: 'Mám staršiu dohodu, ktorú chcem nahradiť jednou novou s dlhším termínom. Podklady k pôvodnej dohode viem predložiť.' },
  { id: 'A-4801', typ: 'osoba', ucel: 'Štúdium', suma: 4200, mesiace: 24, splatka: 180, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-02',
    popis: 'Rekvalifikačný kurz s certifikátom, ktorý si viem popri práci dokončiť za rok. Prihlášku aj rozpis platieb mám k dispozícii.' },
  { id: 'A-4796', typ: 'osoba', ucel: 'Dovolenka', suma: 2800, mesiace: 18, splatka: 150, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-05-30',
    popis: 'Zájazd pre celú rodinu, ktorý plánujeme na budúce leto. Zálohu platíme na jeseň, zvyšok mesiac pred odletom.' },
  { id: 'A-4783', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 2100, mesiace: 12, splatka: 175, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-05-18',
    popis: 'Nová chladnička a sporák do prenajatého bytu, staré spotrebiče už doslúžili. Konkrétne modely aj ceny mám vybraté.' }
  ,
  { id: 'A-4862', typ: 'osoba', ucel: 'Kúpa auta', suma: 4000, mesiace: 24, splatka: 190, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-09-02',
    popis: 'Hladam starsiu ojazdenu octaviu alebo fabiu na dochadzanie za pracou, cca 40 km denne. Auto chcem kupit od sukromnej osoby, mam vyhliadnute dve.' },
  { id: 'A-4861', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 8000, mesiace: 36, splatka: 260, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-09-01',
    popis: 'Dobrý deň, prerábame kúpeľňu v rodinnom dome po rodičoch. Rozvody vody a elektriny sú hotové, chýba obklad, dlažba, sanita a sprchový kút. Cenovú ponuku od obkladača aj zoznam materiálu z Merkury Marketu viem poslať e-mailom. Pracujem ako skladník na dobu neurčitú, manželka je učiteľka. Ďakujem za prečítanie.' },
  { id: 'A-4860', typ: 'osoba', ucel: 'Svadba', suma: 6000, mesiace: 24, splatka: 280, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-09-01',
    popis: 'Svadba je v máji budúceho roka, 80 hostí, sála aj kapela sú už rezervované. Chýba nám doplatiť catering a šaty. Obaja pracujeme.' },
  { id: 'A-4859', typ: 'osoba', ucel: 'Kúpa bytu', suma: 45000, mesiace: 144, splatka: 430, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-08-31',
    popis: 'Garsónka v Nitre, 28 m2, druhé poschodie, pôvodný stav. Väčšiu časť ceny mám našetrenú, predávajúci súhlasí s tým, že zvyšok doložím do konca roka. Mám stabilný príjem 6 rokov u jedného zamestnávateľa, znalecký posudok aj list vlastníctva viem poslať hneď po prvej správe.' },
  { id: 'A-4858', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 1500, mesiace: 12, splatka: 140, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-30',
    popis: 'Notebook do školy pre syna, začína strednú s IT zameraním. Vybraný model aj cena z Alzy.' },
  { id: 'A-4857', typ: 'osoba', ucel: 'Úhrada dlhov', suma: 3000, mesiace: 24, splatka: 135, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-30',
    popis: 'chcem si dat do poriadku dva mensie zavazky ktore mam u znamych, aby som ich vyplatil naraz a mal jednu dohodu s jasnym terminom. Som zamestnany, vyplatna paska nie je problem' },
  { id: 'A-4856', typ: 'osoba', ucel: 'Štúdium', suma: 9000, mesiace: 48, splatka: 210, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-08-29',
    popis: 'Magisterské štúdium v Brne, dva roky. Školné na súkromnej škole plus ubytovanie na intráku. Prijímacie skúšky mám za sebou, rozhodnutie o prijatí viem doložiť. Popri škole budem pracovať na dohodu.' },
  { id: 'A-4855', typ: 'osoba', ucel: 'Kúpa domu', suma: 70000, mesiace: 192, splatka: 520, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-08-28',
    popis: 'Rodinný dom na dedine pri Trenčíne, 4 izby, veľký pozemok, potrebuje nové okná a kúrenie. Cena je dohodnutá, predávajúca je staršia pani, ktorá sa sťahuje k dcére. Väčšinu ceny mám z úspor a z predaja bytu, chýba mi posledná časť. Som zvárač, 12 rokov v jednej firme, manželka pracuje v nemocnici ako administratívna pracovníčka. Deti dve. Všetky podklady k domu aj k príjmom viem poslať.' },
  { id: 'A-4854', typ: 'osoba', ucel: 'Dovolenka', suma: 1500, mesiace: 6, splatka: 260, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-27',
    popis: 'Týždeň v Chorvátsku s deťmi, apartmán už zaplatený, potrebujem na cestu a vreckové.' },
  { id: 'A-4853', typ: 'osoba', ucel: 'Kúpa motorky', suma: 5000, mesiace: 36, splatka: 160, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-27',
    popis: 'Ahojte. Hľadám na Yamahu MT-07, ročník 2019, od kamaráta. Motorku poznám, jazdil som na nej, servisná knižka je kompletná. Jazdím 8 rokov bez nehody. Vodičák A mám od 2018.' },
  { id: 'A-4852', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 30000, mesiace: 96, splatka: 380, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-08-26',
    popis: 'Kompletná rekonštrukcia bytu 3+1 v paneláku v Košiciach: elektrina, voda, jadro, podlahy, kuchyňa. Byt je v mojom vlastníctve bez ťarchy. Mám vypracovaný rozpočet od stavebnej firmy s rozpisom po položkách a harmonogram na 4 mesiace. Po prerábke sa do bytu sťahujem s rodinou, momentálne bývame v podnájme.' },
  { id: 'A-4851', typ: 'osoba', ucel: 'Refinancovanie', suma: 15000, mesiace: 60, splatka: 300, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-08-25',
    popis: 'Mám jednu staršiu dohodu na kúpu auta, ktorá mi končí o 2 roky, a chcel by som ju nahradiť novou s dlhšou dobou a nižšou mesačnou záťažou. Auto je v poriadku, splácam bez omeškania, výpis viem ukázať.' },
  { id: 'A-4850', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 1000, mesiace: 6, splatka: 140, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-24',
    popis: 'Pracka a susicka, stara pracka odisla. Rodina s 3 detmi, perieme kazdy den :)' },
  { id: 'A-4849', typ: 'osoba', ucel: 'Kúpa auta', suma: 20000, mesiace: 72, splatka: 320, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-08-23',
    popis: 'Hľadám financovanie na 5 rokov starú Škodu Kodiaq od autorizovaného predajcu, s predĺženou zárukou. Časť ceny platím z predaja súčasného auta. Auto potrebujem na prácu, som obchodný zástupca a najazdím okolo 50 tisíc km ročne. Faktúru od predajcu a moje daňové priznanie za posledné dva roky posielam na požiadanie.' },
  { id: 'A-4848', typ: 'osoba', ucel: 'Rozbeh živnosti', suma: 7000, mesiace: 36, splatka: 230, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-22',
    popis: 'Som vyučená kaderníčka, 9 rokov som robila u iných. Prenajala som si priestor v centre Prievidze a potrebujem vybavenie: dve kreslá, umývací box, zrkadlá, sušiče. Živnosť mám založenú od júla. Ponuku od dodávateľa vybavenia aj nájomnú zmluvu viem poslať.' },
  { id: 'A-4847', typ: 'osoba', ucel: 'Úhrada dlhov', suma: 12000, mesiace: 60, splatka: 250, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-08-21',
    popis: 'Rád by som zlúčil tri existujúce záväzky do jednej dohody s jedným termínom. Všetky tri splácam riadne, len mi nevyhovuje, že končia v rôznom čase a každý má inú splatnosť. Zoznam so zostatkami pošlem po prvom kontakte.' },
  { id: 'A-4846', typ: 'osoba', ucel: 'Kúpa pozemku', suma: 27500, mesiace: 120, splatka: 300, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-08-20',
    popis: 'Stavebný pozemok 650 m2 v obci pri Banskej Bystrici, inžinierske siete na hranici. Kúpna zmluva je pripravená u notára. O 2 až 3 roky plánujeme stavať, dovtedy chcem mať pozemok splatený. Obaja s partnerkou máme stále zamestnanie.' },
  { id: 'A-4845', typ: 'osoba', ucel: 'Štúdium', suma: 2500, mesiace: 12, splatka: 220, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-18',
    popis: 'Kurz zvárania s medzinárodným certifikátom, 3 mesiace, začiatok v októbri. Po kurze mám prisľúbené miesto vo firme.' },
  { id: 'A-4843', typ: 'osoba', ucel: 'Dovolenka', suma: 3500, mesiace: 24, splatka: 160, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-17',
    popis: 'Svadobná cesta do Talianska, 10 dní, na budúci jún. Sme mladí manželia, obaja zamestnaní v Bratislave.' },
  { id: 'A-4842', typ: 'osoba', ucel: 'Kúpa bytu', suma: 35000, mesiace: 120, splatka: 350, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-08-16',
    popis: 'Jednoizbový byt v Michalovciach, 36 m2, po rekonštrukcii. Väčšinu ceny mám z úspor a z predaja auta, chýba mi posledná časť. Kupujem pre seba, momentálne bývam u rodičov. Pracujem v automobilke na zmeny, zmluva na dobu neurčitú.' },
  { id: 'A-4840', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 5000, mesiace: 24, splatka: 230, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-15',
    popis: 'Nové plastové okná do bytu, 5 kusov plus balkónové dvere. Ponuka od firmy je na stole, montáž v novembri.' },
  { id: 'A-4839', typ: 'osoba', ucel: 'Kúpa auta', suma: 2500, mesiace: 12, splatka: 220, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-14',
    popis: 'Potrebujem lacne auto do prace, staci starsi peugeot alebo fiat. Som na materskej a manzel pracuje, vozime dieta do skolky 15km. Vsetko ostatne viem vysvetlit v sprave.' },
  { id: 'A-4837', typ: 'osoba', ucel: 'Fotovoltika', suma: 9000, mesiace: 60, splatka: 170, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-08-13',
    popis: 'Fotovoltická elektráreň na strechu rodinného domu, 5 kWp s batériou. Dodávateľ je vybraný, cenová ponuka a zmluva pripravená. Časť ceny pokryje dotácia zo Zelenej domácnostiam, na zvyšok hľadám financovanie. Dom je náš, bez ťarchy.' },
  { id: 'A-4836', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 3000, mesiace: 24, splatka: 180, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-12',
    popis: 'Zariadenie detskej izby pre dvojičky. Postieľky, skriňa, komoda, kočík pre dvojičky. Zoznam s cenami mám pripravený, termín je január.' },
  { id: 'A-4834', typ: 'osoba', ucel: 'Refinancovanie', suma: 6000, mesiace: 36, splatka: 190, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-11',
    popis: 'Nahradenie jednej existujucej dohody novou. Povodna ma kratku dobu a vysoku mesacnu zataz, chcem to rozlozit na dlhsie. Vsetko splacam nacas.' },
  { id: 'A-4833', typ: 'osoba', ucel: 'Kúpa domu', suma: 100000, mesiace: 240, splatka: 620, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-08-10',
    popis: 'Dobrý deň. S manželom kupujeme novostavbu v obci 20 km od Trnavy, dom je hotový, skolaudovaný, developer čaká na doplatenie. Väčšinu ceny sme už uhradili z predaja nášho bytu a z úspor, chýba nám posledná časť. Obaja pracujeme, ja v štátnej správe, manžel ako projektant. Máme dve deti a do presťahovania bývame v podnájme. Všetky dokumenty k domu aj k našim príjmom pošleme každému vážnemu záujemcovi. Ďakujeme.' },
  { id: 'A-4832', typ: 'osoba', ucel: 'Zubný zákrok', suma: 4500, mesiace: 24, splatka: 210, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-09',
    popis: 'Implantáty, cenová ponuka od kliniky v Bratislave, zákrok v dvoch fázach do jari.' },
  { id: 'A-4831', typ: 'osoba', ucel: 'Kúpa auta', suma: 8000, mesiace: 48, splatka: 200, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-08',
    popis: 'Ojazdený Ford Focus kombi z autobazáru, rok 2017, 140 tisíc km. Potrebujem väčšie auto, narodilo sa nám tretie dieťa. Súčasné auto predám a z toho časť vrátim skôr.' },
  { id: 'A-4829', typ: 'osoba', ucel: 'Štúdium', suma: 12000, mesiace: 72, splatka: 190, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-08-07',
    popis: 'MBA program v Bratislave popri zamestnaní, 18 mesiacov. Zamestnávateľ prepláca tretinu školného. Som manažér výroby, 34 rokov, prijímacie konanie ukončené, zmluvu so školou a potvrdenie od zamestnávateľa pošlem.' },
  { id: 'A-4827', typ: 'osoba', ucel: 'Dovolenka', suma: 1000, mesiace: 6, splatka: 180, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-06',
    popis: 'Lyžovačka v Alpách v januári pre dvoch, ubytovanie a skipas. Zamestnaný, žiadne iné záväzky.' },
  { id: 'A-4826', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 16000, mesiace: 60, splatka: 300, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-08-05',
    popis: 'Výmena kúrenia v dome, z plynového kotla na tepelné čerpadlo. Ponuka od montážnej firmy, práce naplánované na september až október. Dom v našom vlastníctve, príjem obaja stály. Rozpočet aj technický návrh viem poslať.' },
  { id: 'A-4825', typ: 'osoba', ucel: 'Úhrada dlhov', suma: 2000, mesiace: 12, splatka: 180, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-04',
    popis: 'Vyrovnanie nedoplatku za energie po ročnom vyúčtovaní, chcem to uhradiť naraz a nie po častiach dodávateľovi.' },
  { id: 'A-4824', typ: 'osoba', ucel: 'Kúpa karavanu', suma: 17000, mesiace: 84, splatka: 240, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-08-03',
    popis: 'Obytný príves Hobby, ročník 2017, od majiteľa z Rakúska. S manželkou sme v dôchodku, obaja s riadnym starobným dôchodkom, a chceme cestovať. Príves sme si osobne pozreli, je zachovalý. Fotky a kúpnu zmluvu pošleme.' },
  { id: 'A-4823', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 500, mesiace: 6, splatka: 90, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-08-02',
    popis: 'Mobil pre dcéru do školy.' },
  { id: 'A-4822', typ: 'osoba', ucel: 'Kúpa bytu', suma: 80000, mesiace: 216, splatka: 480, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-08-01',
    popis: 'Trojizbový byt v Žiline, novostavba, kolaudácia v decembri. Rezervačnú zálohu mám zaplatenú, väčšinu ceny platím z predaja súčasného bytu a developer akceptuje splátkový kalendár do kolaudácie, chýba mi posledná časť. Som IT vývojár na TPP, manželka fyzioterapeutka. Rezervačnú zmluvu a potvrdenia o príjme posielam vážnym záujemcom.' },
  { id: 'A-4820', typ: 'osoba', ucel: 'Kúpa auta', suma: 13000, mesiace: 60, splatka: 260, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-31',
    popis: 'Toyota Corolla hybrid 2021, od predajcu, 60 tis. km. Auto pre manželku, ktorá dochádza 35 km do nemocnice na zmeny. Doterajšie auto ide na protiúčet.' },
  { id: 'A-4819', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 2000, mesiace: 12, splatka: 180, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-30',
    popis: 'vymalovanie bytu a nove podlahy v dvoch izbach, robim si to sam, potrebujem len na material' },
  { id: 'A-4818', typ: 'osoba', ucel: 'Sťahovanie do zahraničia', suma: 4000, mesiace: 24, splatka: 190, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-29',
    popis: 'Od novembra nastupujem do práce v Holandsku ako technik, mám podpísanú zmluvu. Potrebujem na kauciu na byt, prvý nájom a sťahovanie. Pracovnú zmluvu viem doložiť, splácať budem z holandského platu.' },
  { id: 'A-4816', typ: 'osoba', ucel: 'Refinancovanie', suma: 25000, mesiace: 96, splatka: 330, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-07-28',
    popis: 'Chcem nahradiť dve existujúce dohody (rekonštrukcia a auto) jednou novou s dlhšou dobou. Obe splácam 3 roky bez jediného omeškania, výpisy pošlem. Cieľ je jedna splátka a jeden termín.' },
  { id: 'A-4815', typ: 'osoba', ucel: 'Štúdium', suma: 1500, mesiace: 12, splatka: 140, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-27',
    popis: 'Jazykový kurz nemčiny, intenzívny, 6 mesiacov. Potrebujem B2 na prácu v Rakúsku.' },
  { id: 'A-4814', typ: 'osoba', ucel: 'Kúpa domu', suma: 55000, mesiace: 168, splatka: 450, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-07-26',
    popis: 'Starší dom na Orave po babke, odkupujem podiely od dvoch súrodencov, aby dom ostal v rodine. Dohoda medzi nami je hotová, dedičské konanie skončené. Dom je obývateľný, budeme v ňom bývať. Som živnostník v stavebníctve 11 rokov, daňové priznania viem doložiť.' },
  { id: 'A-4813', typ: 'osoba', ucel: 'Dovolenka', suma: 2000, mesiace: 12, splatka: 180, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-25',
    popis: 'Cesta za synom do Kanady na Vianoce, letenky pre dvoch. Nevideli sme ho tri roky.' },
  { id: 'A-4811', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 4500, mesiace: 24, splatka: 210, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-24',
    popis: 'Kompletné zariadenie obývačky a spálne do nového bytu: sedačka, postel, skrine, stôl, TV. Sťahujeme sa v septembri, ponuku z Möbelixu a Ikey mám na 4 300 €.' },
  { id: 'A-4810', typ: 'osoba', ucel: 'Kúpa auta', suma: 6000, mesiace: 36, splatka: 190, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-23',
    popis: 'DOBRY DEN, HLADAM NA AUTO PRE SYNA KTORY ZACINA PRACOVAT V INOM MESTE. VW POLO 2018 OD ZNAMEHO, AUTO JE V DOBROM STAVE. SOM DOCHODCA, SPLACAT BUDEME SPOLOCNE SO SYNOM. DAKUJEM' },
  { id: 'A-4809', typ: 'osoba', ucel: 'Úhrada dlhov', suma: 5000, mesiace: 36, splatka: 170, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-22',
    popis: 'Spojenie dvoch menších záväzkov do jedného. Obidva splácam, ale radšej by som mal jednu dohodu s jedným človekom a jasný koniec. Viem doložiť všetko potrebné.' },
  { id: 'A-4808', typ: 'osoba', ucel: 'Vybavenie dielne', suma: 10000, mesiace: 48, splatka: 260, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-07-21',
    popis: 'Stolársku dielňu si zakladám v garáži pri dome. Potrebujem formátovaciu pílu, hrúbkovačku, odsávanie a ručné náradie. Som vyučený stolár, 15 rokov praxe vo firme, teraz chcem robiť na seba. Zoznam strojov s cenami od predajcu je hotový.' },
  { id: 'A-4807', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 12000, mesiace: 60, splatka: 240, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-20',
    popis: 'Zateplenie fasády rodinného domu 160 m2 plus nová omietka. Firma vybraná, ponuka platná do konca roka, práce na jar.' },
  { id: 'A-4805', typ: 'osoba', ucel: 'Kúpa bytu', suma: 22500, mesiace: 96, splatka: 280, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-07-19',
    popis: 'Doplatok kúpnej ceny bytu v Lučenci. Väčšinu mám z predaja rodičovského domu, chýba mi posledná časť. Byt je pre mňa a dcéru. Pracujem ako účtovníčka, 9 rokov v tej istej firme.' },
  { id: 'A-4804', typ: 'osoba', ucel: 'Kúpa auta', suma: 18000, mesiace: 72, splatka: 300, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-07-18',
    popis: 'Sedemmiestne auto pre rodinu s tromi deťmi, Škoda Kodiaq alebo Peugeot 5008, ojazdené od predajcu so zárukou. Som vodič MHD na dobu neurčitú, manželka pracuje v potravinách. Doterajšie auto ide na protiúčet, čo zníži potrebnú sumu.' },
  { id: 'A-4803', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 1000, mesiace: 6, splatka: 180, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-17',
    popis: 'Elektricky bicykel na dochadzanie do prace, 12 km jednym smerom, aby som nemusel autom. Vybrany model v predajni v Poprade.' },
  { id: 'A-4802', typ: 'osoba', ucel: 'Štúdium', suma: 5000, mesiace: 36, splatka: 160, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-16',
    popis: 'Dcéra ide na výmenný pobyt Erasmus do Španielska na celý rok. Štipendium pokryje asi polovicu, zvyšok na ubytovanie a stravu hľadám tu. Som učiteľka, manžel vodič z povolania.' },
  { id: 'A-4800', typ: 'osoba', ucel: 'Kúpa domu', suma: 90000, mesiace: 240, splatka: 560, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-07-15',
    popis: 'Starší dom v obci pri Lučenci, 4 izby, pozemok 8 árov, kupujeme od rodiny, ktorá sa sťahuje do zahraničia. Cena je dohodnutá, dom potrebuje nové okná a kúrenie. Máme vlastné zdroje na tretinu ceny. Ja som stavbyvedúci, manželka zubná asistentka, obaja na TPP. Znalecký posudok už máme vypracovaný.' },
  { id: 'A-4799', typ: 'osoba', ucel: 'Dovolenka', suma: 1000, mesiace: 6, splatka: 140, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-14',
    popis: 'Wellness pobyt pre rodičov k 40. výročiu svadby. Chcem im to dať ako prekvapenie.' },
  { id: 'A-4798', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 6000, mesiace: 36, splatka: 190, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-13',
    popis: 'Nová kuchyňa na mieru vrátane spotrebičov. Návrh a cenová ponuka od kuchynského štúdia v Trenčíne, výroba trvá 8 týždňov. Byt vlastný.' },
  { id: 'A-4797', typ: 'osoba', ucel: 'Úhrada dlhov', suma: 1500, mesiace: 12, splatka: 135, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-12',
    popis: 'Vyplatenie zvyšku nákupu na splátky, aby som mal uzavreté a mohol riešiť ďalšie veci. Malá suma, rýchle vyriešenie, všetko doložím.' },
  { id: 'A-4795', typ: 'osoba', ucel: 'Kúpa auta', suma: 3500, mesiace: 24, splatka: 160, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-11',
    popis: 'Dodávka Citroen Berlingo, staršia, na rozvoz pečiva. Mám živnosť 3 roky, dodávku potrebujem lebo stará mi odišla. Kupujem od predajcu v Nitre s krátkou zárukou.' },
  { id: 'A-4793', typ: 'osoba', ucel: 'Kúpa bytu', suma: 60000, mesiace: 192, splatka: 420, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-07-10',
    popis: 'Dvojizbový byt v Prešove v tehlovej bytovke, kompletne zrekonštruovaný. Kupujeme s priateľkou, obaja na TPP, ja ako elektrikár v priemysle, ona ako farmaceutka. Väčšinu ceny máme z vlastných úspor a s pomocou rodičov, hľadáme poslednú časť. Byt sme si pozreli trikrát, cena dohodnutá, list vlastníctva čistý.' },
  { id: 'A-4792', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 2000, mesiace: 12, splatka: 180, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-09',
    popis: 'Herný počítač pre syna k maturite, zostavu má vybranú do posledného kábla :) Cena podľa konfigurátora 1 950 €.' },
  { id: 'A-4791', typ: 'osoba', ucel: 'Klavír pre dcéru', suma: 4000, mesiace: 24, splatka: 190, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-08',
    popis: 'Dcéra chodí 6 rokov na klavír a ide na konzervatórium. Potrebuje poriadny nástroj, doma máme len digitálny. Vybrali sme použitý Yamaha U1 od predajcu v Bratislave, cena aj stav overené ladičom.' },
  { id: 'A-4790', typ: 'osoba', ucel: 'Refinancovanie', suma: 4000, mesiace: 24, splatka: 190, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-07',
    popis: 'Nahradenie starsej dohody s kratkym terminom, ktora mi konci na jar. Chcem to predlzit na 2 roky. Splacam pravidelne.' },
  { id: 'A-4789', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 25000, mesiace: 84, splatka: 360, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-07-06',
    popis: 'Prístavba k rodinnému domu, jedna izba a kúpeľňa pre starých rodičov, ktorí sa k nám sťahujú. Stavebné povolenie vydané, projekt hotový, rozpočet od stavebnej firmy 24 800 €. Práce od marca do augusta. Manželka aj ja pracujeme, dom je náš.' },
  { id: 'A-4787', typ: 'osoba', ucel: 'Štúdium', suma: 1000, mesiace: 6, splatka: 140, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-05',
    popis: 'Účtovnícky kurz s certifikátom, 2 mesiace, online.' },
  { id: 'A-4786', typ: 'osoba', ucel: 'Kúpa auta', suma: 10000, mesiace: 48, splatka: 250, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-07-04',
    popis: 'Hľadám na Hyundai i30 kombi, 2018, z autobazáru so zárukou. Auto pre rodinu, doterajšie má 20 rokov a už neprejde STK. Som zdravotná sestra, manžel policajt. Faktúru z bazáru a potvrdenia príjmov posielam.' },
  { id: 'A-4785', typ: 'osoba', ucel: 'Dovolenka', suma: 4500, mesiace: 24, splatka: 210, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-03',
    popis: 'Rodinná dovolenka v Grécku na budúce leto, 5 osôb, 14 dní. Cestovná kancelária chce zálohu do konca októbra. Manžel pracuje v Rakúsku, ja tu ako predavačka.' },
  { id: 'A-4784', typ: 'osoba', ucel: 'Úhrada dlhov', suma: 20000, mesiace: 84, splatka: 300, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-07-02',
    popis: 'Vyrovnanie záväzkov po rozvode, časť z majetkového vyrovnania, ktorú mám vyplatiť bývalej manželke podľa dohody schválenej súdom. Termín vyplatenia je do marca. Dom ostáva mne, som strojník s dlhoročným zamestnaním. Rozsudok aj dohodu viem doložiť.' },
  { id: 'A-4782', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 1500, mesiace: 12, splatka: 140, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-07-01',
    popis: 'Nová sedačka a jedálenský stôl so stoličkami. Sťahujeme sa do väčšieho podnájmu.' },
  { id: 'A-4781', typ: 'osoba', ucel: 'Kúpa bytu', suma: 40000, mesiace: 144, splatka: 380, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-06-30',
    popis: 'Byt 2+1 v Martine pre syna, ktorý začína pracovať v nemocnici. Kupujeme ako rodičia, byt bude na nás. Väčšinu kúpnej ceny platíme z úspor a z predaja chaty, chýba nám posledná časť. Máme vlastný dom splatený, obaja pracujeme. Byt je vybraný a cena dohodnutá s predávajúcim.' },
  { id: 'A-4780', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 3500, mesiace: 24, splatka: 160, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-29',
    popis: 'oprava strechy na chalupe po vetre, pokryvac ma ponuku 3200 eur, treba to spravit do zimy' },
  { id: 'A-4779', typ: 'osoba', ucel: 'Kúpa auta', suma: 15000, mesiace: 60, splatka: 290, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-28',
    popis: 'Dobrý deň, hľadám financovanie na ojazdený Volkswagen Tiguan z roku 2022 od autorizovaného predajcu v Trnave. Auto má 45 tisíc kilometrov, jedného majiteľa a záruku do budúceho roka. Potrebujeme priestrannejšie auto, čakáme druhé dieťa. Som projektový manažér v strojárskej firme, manželka učí na základnej škole. Polovicu ceny platíme hneď z predaja nášho súčasného auta a z úspor, hľadám len zvyšok. Ponuku od predajcu, technický preukaz a potvrdenia o príjmoch pošlem obratom po prvom kontakte. Ďakujem za váš čas.' },
  { id: 'A-4778', typ: 'osoba', ucel: 'Autoškola pre syna', suma: 1000, mesiace: 6, splatka: 180, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-27',
    popis: 'Syn má 18, vodičák potrebuje do práce. Autoškola v Trebišove, kurz začína v septembri.' },
  { id: 'A-4777', typ: 'osoba', ucel: 'Štúdium', suma: 3000, mesiace: 24, splatka: 140, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-26',
    popis: 'Kurz programovania, 5 mesiacov prezenčne v Bratislave, s garanciou pracovného pohovoru. Prechádzam z gastra do IT, 27 rokov, popri kurze pracujem na polovičný úväzok.' },
  { id: 'A-4776', typ: 'osoba', ucel: 'Kúpa domu', suma: 65000, mesiace: 192, splatka: 480, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-06-25',
    popis: 'Rodinný dom v Rimavskej Sobote, po čiastočnej rekonštrukcii. Kúpna zmluva pripravená. Vraciame sa zo zahraničia, kde sme 8 rokov pracovali a sporili, vlastné zdroje máme na polovicu ceny. Obaja máme dohodnutú prácu na Slovensku od januára.' },
  { id: 'A-4775', typ: 'osoba', ucel: 'Rozšírenie včelnice', suma: 3000, mesiace: 24, splatka: 140, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-24',
    popis: 'Včelárim 6 rokov, mám 12 rodín. Chcem rozšíriť na 30, potrebujem úle, rámiky, medomet a vozík. Med predávam na trhoch a susedom. Robím to popri zamestnaní.' },
  { id: 'A-4774', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 2500, mesiace: 24, splatka: 150, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-23',
    popis: 'Chladnicka, umyvacka riadu a rura do novej kuchyne. Kuchyna uz je namontovana, spotrebice chybaju. Modely vybrane v Nay.' },
  { id: 'A-4773', typ: 'osoba', ucel: 'Refinancovanie', suma: 18000, mesiace: 72, splatka: 300, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-06-22',
    popis: 'Nahradenie existujúcej dohody na rekonštrukciu novou s dlhšou dobou. Rekonštrukcia je hotová, dom má vyššiu hodnotu, splátky idú bez problémov. Chcem len znížiť mesačnú záťaž, keďže sa nám narodilo dieťa.' },
  { id: 'A-4772', typ: 'osoba', ucel: 'Kúpa auta', suma: 1500, mesiace: 12, splatka: 140, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-21',
    popis: 'Stara felicia od suseda, na jazdenie po dedine a do roboty 6 km. Suma je mala, chcem to mat rychlo vybavene.' },
  { id: 'A-4771', typ: 'osoba', ucel: 'Dovolenka', suma: 6000, mesiace: 36, splatka: 190, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-20',
    popis: 'Cesta okolo sveta na 3 mesiace po skončení vysokej školy, sen od strednej. Mám dohodnutú prácu od septembra budúceho roka, z ktorej budem splácať. Rodičia sú ochotní ručiť.' },
  { id: 'A-4770', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 42500, mesiace: 120, splatka: 450, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-06-19',
    popis: 'Rekonštrukcia staršieho rodinného domu po rodičoch: strecha, okná a kúrenie. Zateplenie, elektrinu a kúpeľňu urobíme neskôr z vlastných zdrojov. Máme projekt, rozpočet po položkách od dvoch firiem a stavebné ohlásenie vybavené. Dom bude náš jediný domov, momentálne bývame v podnájme za 700 € mesačne, ktoré po presťahovaní pôjdu na splácanie. Ja pracujem ako vedúci skladu, manželka ako zdravotná laborantka.' },
  { id: 'A-4769', typ: 'osoba', ucel: 'Úhrada dlhov', suma: 9000, mesiace: 48, splatka: 230, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-18',
    popis: 'Zlúčenie viacerých menších záväzkov (nábytok, elektronika, jedna dohoda so známym) do jednej sumy. Chcem mať jednu splátku a jedného partnera. Všetko riadne splácam, prehľad pošlem.' },
  { id: 'A-4768', typ: 'osoba', ucel: 'Kúpa bytu', suma: 50000, mesiace: 168, splatka: 400, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-06-17',
    popis: 'Byt v Banskej Bystrici, 3 izby, pre našu rodinu. Predávajúci je známy, cena je rozumná. Väčšinu ceny platíme z predaja nášho dvojizbového bytu, chýba nám doplatok, z ktorého časť uhradíme do roka z predaja garáže a auta. Pracujem v štátnej správe 14 rokov.' },
  { id: 'A-4767', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 500, mesiace: 6, splatka: 125, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-16',
    popis: 'Kočík a autosedačka, bábätko sa narodí v októbri.' },
  { id: 'A-4766', typ: 'osoba', ucel: 'Kúpa auta', suma: 7000, mesiace: 36, splatka: 220, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-15',
    popis: 'Kia Ceed 2019, z bazáru s ročnou zárukou. Auto pre mňa do práce, som opatrovateľka a striedam sa u klientov po celom okrese. Doterajšie auto mi zoberú na protiúčet.' },
  { id: 'A-4765', typ: 'osoba', ucel: 'Kúpa chaty', suma: 30000, mesiace: 120, splatka: 320, kraj: 'Slovensko', balik: 'polrocny', zverejnene: '2026-06-14',
    popis: 'Drevená chata pri Oravskej priehrade, 45 m2, s pozemkom, od majiteľa, ktorý ju už nevyužíva. Väčšinu ceny máme našetrenú, chýba nám posledná časť. Chata je v dobrom stave, list vlastníctva bez ťarchy. Sme manželia v strednom veku, deti dospelé, obaja zamestnaní. Chatu chceme na víkendy a v budúcnosti na dôchodok.' },
  { id: 'A-4764', typ: 'osoba', ucel: 'Štúdium', suma: 7000, mesiace: 48, splatka: 180, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-13',
    popis: 'Pilotný výcvik PPL, súkromná licencia. Dlhoročný sen, 40 rokov, som zamestnaný ako technik. Cena výcviku od leteckej školy v Nitre. Časť mám našetrenú, hľadám zvyšok.' },
  { id: 'A-4763', typ: 'osoba', ucel: 'Rekonštrukcia', suma: 9000, mesiace: 48, splatka: 220, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-12',
    popis: 'Nova kupelna a WC v byte, vsetko od podlahy. Byt mam vo vlastnictve 10 rokov. Ponuka od remeselnika na 8 600 eur vratane materialu, termin oktober.' },
  { id: 'A-4762', typ: 'osoba', ucel: 'Dovolenka', suma: 500, mesiace: 6, splatka: 90, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-11',
    popis: 'Predĺžený víkend v Prahe s manželkou k výročiu.' },
  { id: 'A-4761', typ: 'osoba', ucel: 'Kúpa domu', suma: 75000, mesiace: 216, splatka: 500, kraj: 'Slovensko', balik: 'rocny', zverejnene: '2026-06-10',
    popis: 'Dvojgeneračný dom v Seredi, budeme v ňom bývať my a moji rodičia. Rodičia predávajú byt a prispejú tretinou, my máme úspory na väčšinu zvyšku, chýba nám posledná časť. Som vodič kamiónu na TPP, manželka pracuje v škôlke. Kúpna cena dohodnutá, zmluva u advokáta.' },
  { id: 'A-4760', typ: 'osoba', ucel: 'Kúpa auta', suma: 12000, mesiace: 60, splatka: 240, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-09',
    popis: 'Dacia Duster nová z výroby, objednaná, dodanie v januári. Polovicu ceny platíme z úspor, druhú polovicu hľadáme tu. Bývame na lazoch, potrebujeme 4x4. Obaja pracujeme, žiadne iné záväzky nemáme.' },
  { id: 'A-4759', typ: 'osoba', ucel: 'Úhrada dlhov', suma: 1000, mesiace: 6, splatka: 140, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-08',
    popis: 'Doplatenie nedoplatku dane po daňovom priznaní, chcem to mať uzavreté naraz.' },
  { id: 'A-4758', typ: 'osoba', ucel: 'Spotrebný tovar', suma: 3500, mesiace: 24, splatka: 160, kraj: 'Slovensko', balik: 'mesacny', zverejnene: '2026-06-07',
    popis: 'Záhradný traktor a motorová píla na starostlivosť o pozemok 30 árov pri dome. Ponuky z predajne mám, kúpu plánujem na jar.' }
];

/* České inzeráty. Sumy sú v korunách, inak je štruktúra rovnaká. */
var INZERATY_CZ = [
  { id: 'A-4821', typ: 'osoba', ucel: 'Rekonstrukce', suma: 340000, mesiace: 48, splatka: 8200, kraj: 'Česko', balik: 'polrocny', zverejnene: '2026-07-28',
    popis: 'Předělávám koupelnu a kuchyň v bytě, kde bydlím. Materiál mám vybraný a řemeslníky domluvené na podzim. Rozpočet od nich mohu poslat.' },
  { id: 'A-4794', typ: 'osoba', ucel: 'Koupě auta', suma: 265000, mesiace: 48, splatka: 6500, kraj: 'Česko', balik: 'mesacny', zverejnene: '2026-07-02',
    popis: 'Potřebuji auto na dojíždění do práce, dosavadní mi dosloužilo. Hledám ojeté od prodejce se zárukou, konkrétní model mám vybraný.' },
  { id: 'A-4838', typ: 'osoba', ucel: 'Koupě bytu', suma: 1500000, mesiace: 120, splatka: 15000, kraj: 'Česko', balik: 'rocny', zverejnene: '2026-08-21',
    popis: 'Hledám dvoupokojový byt ve městě, kde pracuji. Chodím na osobní prohlídky, jeden byt mám už vytipovaný a znalecký posudek mohu dodat.' },
  { id: 'A-4830', typ: 'osoba', ucel: 'Koupě domu', suma: 2100000, mesiace: 180, splatka: 15500, kraj: 'Česko', balik: 'rocny', zverejnene: '2026-08-19',
    popis: 'Starší rodinný dům na okraji města, který chci postupně opravovat vlastními silami. Kupní cena je dohodnutá s prodávajícím, smlouvu připravuje advokát.' },
  { id: 'A-4817', typ: 'osoba', ucel: 'Refinancování', suma: 220000, mesiace: 36, splatka: 7000, kraj: 'Česko', balik: 'polrocny', zverejnene: '2026-07-14',
    popis: 'Mám dva starší splátkové závazky a chtěl bych je spojit do jednoho, abych měl jednu splátku a jasný termín doplacení.' },
  { id: 'A-4806', typ: 'osoba', ucel: 'Studium', suma: 160000, mesiace: 36, splatka: 5000, kraj: 'Česko', balik: 'mesacny', zverejnene: '2026-06-23',
    popis: 'Dvouletý večerní program při zaměstnání. Školné se platí po semestrech, potvrzení o přijetí a rozpis plateb mohu poslat.' },
  { id: 'A-4788', typ: 'osoba', ucel: 'Spotřební zboží', suma: 85000, mesiace: 24, splatka: 3900, kraj: 'Česko', balik: 'mesacny', zverejnene: '2026-06-11',
    popis: 'Vybavení do nové kuchyně a pračka po stěhování. Mám konkrétní seznam spotřebičů i cenovou nabídku z prodejny.' }
];

/* ══════════════════════════════════════════════════════════
   JAZYK STRÁNKY
   Berie sa z atribútu lang v značke html. České stránky majú
   lang="cs", všetko ostatné sa správa ako doteraz, po slovensky.
   ══════════════════════════════════════════════════════════ */
var JAZYK = ((document.documentElement.getAttribute('lang') || 'sk').slice(0, 2) === 'cs') ? 'cs' : 'sk';
var INZERATY = (JAZYK === 'cs') ? INZERATY_CZ : INZERATY_SK;

/* Skončené inzeráty. Inzerát s poľom `konci` (RRRR-MM-DD, posledný deň
   zaplatenej doby) sa po tomto dni už nikde nezobrazí, sám od seba.
   Na webe dátum nevidno, je len tu v kóde. Inzeráty bez poľa `konci`
   sa zobrazujú stále. */
INZERATY = INZERATY.filter(function (a) {
  if (!a.konci) return true;
  var d = new Date(a.konci + 'T23:59:59');
  return isNaN(d.getTime()) || Date.now() <= d.getTime();
});

/* ══════════════════════════════════════════════════════════
   ZEPHORIS — spoločné skripty
   ══════════════════════════════════════════════════════════ */

var Z = (function () {

  /* ─── Texty podľa jazyka ──────────────────────────────────
     Všetko, čo sa vykresľuje z JavaScriptu. HTML stránky majú
     svoje texty priamo v sebe, sem patria len tie generované. */
  var SLOVNIK = {
    sk: {
      mena: '\u00A0€',
      mesiac1: '1 mesiac', mesiac24: ' mesiace', mesiac5: ' mesiacov',
      rok1: '1 rok', rok24: ' roky', rok5: ' rokov',
      rokPol: 'rok a pol', rokPolN: ' a pol roka', rokZlomok: ' roka',
      balik: { rocny: 'Ročný inzerát', polrocny: 'Polročný inzerát', mesacny: 'Štvrťročný inzerát' },
      firma: 'Firma', novy: 'Nový', prednostne: 'Platené umiestnenie',
      navrhuje: ' Mesačne vie vyčleniť ', zaMesiac: '',
      lblDoba: 'Doba', lblSplatka: 'Mesačne vie vyčleniť', lblKrajina: 'Krajina',
      hladanaSuma: 'Hľadaná suma', odpovedat: 'Odpovedať na inzerát',
      viacBtn: 'Zobraziť ďalšie inzeráty',
      zobrazitPopis: 'Zobraziť popis', popisOd: 'Popis od zadávateľa',
      odpovedNa: 'Odpoveď na inzerát ',
      preposleme: 'Správu prepošleme zadávateľovi e‑mailom. Jeho adresu nezverejňujeme.',
      phMeno: 'Vaše meno alebo firma', phMail: 'Váš e-mail',
      phSprava: 'Napíšte zadávateľovi, čo vás na inzeráte zaujíma a ako sa s vami dá spojiť.',
      suhlas: 'Súhlasím, aby Kvelto odovzdal moju správu a e-mailovú adresu zadávateľovi tohto inzerátu.',
      zrusit: 'Zrušiť', odoslat: 'Odoslať správu',
      poznamka: 'Zadávateľ vám odpíše priamo na vašu adresu. Kvelto nie je veriteľ ani finančný sprostredkovateľ a do dohody nevstupuje.',
      prazdne: 'Pre zvolený filter zatiaľ nie sú žiadne inzeráty.',
      chybaFormulara: 'Vyplňte meno, platný e-mail, správu aspoň na desať znakov a potvrďte súhlas.',
      odosielam: 'Odosielam…',
      chybaOdoslania: 'Správu sa nepodarilo odoslať. Skúste to prosím o chvíľu znova.',
      odoslane: ' Správa odoslaná',
      odpovedPride: 'Zadávateľovi ju doručíme e-mailom. Odpoveď vám príde priamo na ', nevstupuje: '. Kvelto do komunikácie ďalej nevstupuje.',
      kat: { byvanie: 'Bývanie', doprava: 'Doprava', podnikanie: 'Podnikanie', financie: 'Financie',
             vzdelanie: 'Vzdelanie', volno: 'Voľný čas', nakup: 'Nákup', ostatne: 'Ostatné' }
    },
    cs: {
      mena: '\u00A0Kč',
      mesiac1: '1 měsíc', mesiac24: ' měsíce', mesiac5: ' měsíců',
      rok1: '1 rok', rok24: ' roky', rok5: ' let',
      rokPol: 'rok a půl', rokPolN: ' a půl roku', rokZlomok: ' roku',
      balik: { rocny: 'Roční inzerát', polrocny: 'Pololetní inzerát', mesacny: 'Čtvrtletní inzerát' },
      firma: 'Firma', novy: 'Nový', prednostne: 'Placené umístění',
      navrhuje: ' Měsíčně může vyčlenit ', zaMesiac: '',
      lblDoba: 'Doba', lblSplatka: 'Měsíčně může vyčlenit', lblKrajina: 'Země',
      hladanaSuma: 'Hledaná částka', odpovedat: 'Odpovědět na inzerát',
      viacBtn: 'Zobrazit další inzeráty',
      zobrazitPopis: 'Zobrazit popis', popisOd: 'Popis od zadavatele',
      odpovedNa: 'Odpověď na inzerát ',
      preposleme: 'Zprávu přepošleme zadavateli e‑mailem. Jeho adresu nezveřejňujeme.',
      phMeno: 'Vaše jméno nebo firma', phMail: 'Váš e-mail',
      phSprava: 'Napište zadavateli, co vás na inzerátu zajímá a jak se s vámi dá spojit.',
      suhlas: 'Souhlasím, aby Kvelto předal mou zprávu a e-mailovou adresu zadavateli tohoto inzerátu.',
      zrusit: 'Zrušit', odoslat: 'Odeslat zprávu',
      poznamka: 'Zadavatel vám odepíše přímo na vaši adresu. Kvelto není věřitel ani finanční zprostředkovatel a do dohody nevstupuje.',
      prazdne: 'Pro zvolený filtr zatím nejsou žádné inzeráty.',
      chybaFormulara: 'Vyplňte jméno, platný e-mail, zprávu alespoň na deset znaků a potvrďte souhlas.',
      odosielam: 'Odesílám…',
      chybaOdoslania: 'Zprávu se nepodařilo odeslat. Zkuste to prosím za chvíli znovu.',
      odoslane: ' Zpráva odeslána',
      odpovedPride: 'Zadavateli ji doručíme e-mailem. Odpověď vám přijde přímo na ', nevstupuje: '. Kvelto do komunikace dále nevstupuje.',
      kat: { byvanie: 'Bydlení', doprava: 'Doprava', podnikanie: 'Podnikání', financie: 'Finance',
             vzdelanie: 'Vzdělání', volno: 'Volný čas', nakup: 'Nákup', ostatne: 'Ostatní' }
    }
  };
  var T = SLOVNIK[JAZYK] || SLOVNIK.sk;

  /* ─── Čísla zobrazované na webe ────────────────────────
     Na jednom mieste, aby sa dali meniť bez hľadania po stránkach.
     Neskôr sa nahradia skutočnými údajmi z databázy.          */
  var LIVE = {
    zaujemcoviaOnline: 486,
    zaujemcoviaCelkom: 5940,
    inzeraty: 11260,
    reakcie7dni: 3814,
    pouzivatelia: 38470
  };

  /* ─── Pomôcky ─────────────────────────────────────────── */
  function fmt(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /* Názov ostáva eur() kvôli spätnej kompatibilite so stránkami. */
  function eur(n) { return fmt(n) + T.mena; }

  function mesiace(n) {
    if (n === 1) return T.mesiac1;
    if (n < 5) return n + T.mesiac24;
    return n + T.mesiac5;
  }

  /* Roky v zátvorke — len pri CELÝCH rokoch. Pri 18, 30, 42 a podobne
     sa zátvorka vôbec nezobrazí, lebo tvary „rok a pol" alebo „2,5 roka"
     pôsobili rušivo. Kľúče rokPol/rokPolN/rokZlomok ostávajú nevyužité. */
  function roky(n) {
    if (n < 12) return '';
    var r = n / 12;
    if (r !== Math.floor(r)) return '';
    if (r === 1) return T.rok1;
    return r + (r < 5 ? T.rok24 : T.rok5);
  }
  function mesiaceSRokmi(n) {
    var r = roky(n);
    /* Vnútro zátvorky drží pokope, na úzkom displeji sa nezalomí „(4 / roky)". */
    return mesiace(n) + (r ? ' (' + r.replace(/ /g, ' ') + ')' : '');
  }

  function paintRange(el) {
    if (!el) return;
    var pct = (el.value - el.min) / (el.max - el.min) * 100;
    el.style.setProperty('--pct', pct + '%');
  }

  /* ─── Ikony ───────────────────────────────────────────── */
  var ICO = {
    mail:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
    pin:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    eye:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h12v4"/><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14" r="1.2"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M9.2 12.2l1.9 1.9 3.7-3.9"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    arrow: '<svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
  };

  /* ─── Vykreslenie inzerátov z dát ─────────────────────────
     Inzeráty NIKDY nepíšeme natvrdo do HTML. Vykresľujú sa
     odtiaľto, aby sa zdroj dát dal neskôr vymeniť za databázu
     bez zásahu do stránok.                                     */

  /* Kontakt zadávateľa nie je nikde v HTML. Záujemca napíše správu do
     formulára, my ju prepošleme zadávateľovi na e-mail a ten odpíše
     priamo jemu. Od druhej správy sme mimo komunikácie. */
  document.addEventListener('click', function (e) {

    /* otvorenie formulára */
    /* Popis sa zobrazuje celý hneď po otvorení formulára na odpoveď.
       Vo výpise samotnom nie je, takže sa texty zadávateľov nedajú
       hromadne čítať bez otvorenia konkrétneho inzerátu. */

    var b = e.target.closest('.odp-btn');
    if (b) {
      var karta = b.closest('.ad');
      var box = karta && karta.querySelector('.ad-form');
      if (!box) return;
      /* Otvorený je vždy len jeden inzerát. Rozpísaný text sa nemaže,
         formulár sa iba skryje, takže po návrate je všetko na mieste. */
      Array.prototype.forEach.call(document.querySelectorAll('.ad-form:not(.hide)'), function (iny) {
        if (iny === box) return;
        iny.classList.add('hide');
        var inaKarta = iny.closest('.ad');
        var ineTl = inaKarta && inaKarta.querySelector('.odp-btn');
        if (ineTl) ineTl.classList.remove('hide');
      });
      box.classList.remove('hide');
      b.classList.add('hide');
      /* Kurzor do prvého poľa dávame len na počítači. Na dotykovom zariadení
         by hneď po otvorení inzerátu vyskočila klávesnica a zakryla obsah. */
      var prve = box.querySelector('.f-meno');
      var mysou = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (prve && mysou) prve.focus();
      return;
    }

    /* zrušenie */
    var z = e.target.closest('.f-zrus');
    if (z) {
      var k2 = z.closest('.ad');
      k2.querySelector('.ad-form').classList.add('hide');
      var tl = k2.querySelector('.odp-btn');
      if (tl) tl.classList.remove('hide');
      return;
    }

    /* odoslanie */
    var od = e.target.closest('.f-odosli');
    if (!od) return;
    var k = od.closest('.ad');
    var f = k.querySelector('.ad-form');
    var meno = f.querySelector('.f-meno');
    var mail = f.querySelector('.f-mail');
    var sprava = f.querySelector('.f-sprava');
    var suhlas = f.querySelector('.f-suhlas');
    var chyba = f.querySelector('.f-chyba');
    var ok = true;

    [meno, mail, sprava].forEach(function (i) { i.classList.remove('err'); });
    if (!meno.value.trim()) { meno.classList.add('err'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) { mail.classList.add('err'); ok = false; }
    if (sprava.value.trim().length < 10) { sprava.classList.add('err'); ok = false; }
    if (!suhlas.checked) { ok = false; }

    if (!ok) {
      chyba.classList.add('on');
      chyba.textContent = T.chybaFormulara;
      return;
    }
    chyba.classList.remove('on');

    /* Správa ide na vlastný endpoint vo Workeri, ktorý ju prepošle
       zadávateľovi inzerátu. Jeho adresa nie je nikde v tejto stránke. */
    od.disabled = true;
    od.textContent = T.odosielam;

    fetch('/api/odpoved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inzerat: k.getAttribute('data-id') || '',
        meno: meno.value.trim(),
        email: mail.value.trim(),
        sprava: sprava.value.trim(),
        suhlas: true
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      /* Potvrdenie s rovnakou animáciou ako v kontakte (kreslený kruh a fajka).
         Štýly sú v styles.css pod .ad-done. */
      f.outerHTML =
        '<div class="ad-done">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle class="kruh" cx="12" cy="12" r="9.25"/><path class="fajka" d="M8.1 12.35l2.75 2.75 5.05-5.6"/></svg>' +
          '<h3>' + T.odoslane.trim() + '</h3>' +
          '<p>' + T.odpovedPride + '<b>' + mail.value.trim() + '</b>' + T.nevstupuje + '</p>' +
        '</div>';
      var tl2 = k.querySelector('.odp-btn');
      if (tl2) tl2.remove();
      /* Formulár zmizol a karta sa skrátila, potvrdenie postavíme do stredu obrazovky. */
      var hotovo = k.querySelector('.ad-done');
      if (hotovo) { try { hotovo.scrollIntoView({ block: 'center' }); } catch (x) {} }
    }).catch(function () {
      od.disabled = false;
      od.textContent = T.odoslat;
      chyba.textContent = T.chybaOdoslania;
      chyba.classList.add('on');
    });
  });

  /* Chybové zvýraznenie zmizne hneď, ako človek začne opravovať. */
  document.addEventListener('input', function (e) {
    var pole = e.target.closest('.ad-form input, .ad-form textarea');
    if (!pole) return;
    pole.classList.remove('err');
    var ch = pole.closest('.ad-form').querySelector('.f-chyba');
    if (ch) ch.classList.remove('on');
  });
  document.addEventListener('change', function (e) {
    var box = e.target.closest('.f-suhlas');
    if (!box) return;
    var ch = box.closest('.ad-form').querySelector('.f-chyba');
    if (ch) ch.classList.remove('on');
  });


  /* ── Ikona, kategória a farba podľa účelu — rovnaká logika ako v náhľade
     inzerátu vo formulári, aby výpis a náhľad vyzerali identicky. ── */
  var ICO_UCEL = {
    dom:    '<path d="M3 21h18"/><path d="M5 21V6.5L12 3l7 3.5V21"/><path d="M9.5 9.5h1M13.5 9.5h1M9.5 13.5h1M13.5 13.5h1"/><path d="M10.5 21v-4h3v4"/>',
    byt:    '<circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2 11.4 11.6"/><path d="M15.5 7.5 18.5 10.5 22 7 19 4"/>',
    nehnut: '<path d="M3 21h18"/><path d="M5 21V10h4v11"/><path d="M9 21V5h5.5v16"/><path d="M14.5 21V13H19v8"/>',
    auto:   '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.6-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    stroj:  '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
    zasob:  '<path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5z"/><path d="M3 8.5 12 13l9-4.5"/><path d="M12 13v7"/>',
    rozvoj: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    kapital:'<path d="M3 7a2 2 0 0 1 2-2h12v4"/><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14" r="1.3"/>',
    dlh:    '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.2"/><path d="M6 10.5v3"/><path d="M18 10.5v3"/>',
    podiel: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12V3.5"/><path d="M12 12l7.4 4"/>',
    refi:   '<path d="M20 11.5A8 8 0 0 0 6.3 6.3L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 12.5a8 8 0 0 0 13.7 5.2L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
    studium:'<path d="M12 4 2 9l10 5 10-5z"/><path d="M6 11.5V17c0 1.5 3 3 6 3s6-1.5 6-3v-5.5"/>',
    dovol:  '<path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l4.4 4.4-2.3 2.3-2.6-.4a.5.5 0 0 0-.4.9l3 2 2 3a.5.5 0 0 0 .9-.4l-.4-2.6 2.3-2.3 4.4 4.4a.5.5 0 0 0 .8-.5z"/>',
    taska:  '<path d="M5.5 8h13l-1.2 12.5H6.7z"/><path d="M9 8V5.8a3 3 0 0 1 6 0V8"/>',
    tag:    '<path d="M20.6 13.4 11 3.8a2 2 0 0 0-1.4-.6H4v5.6a2 2 0 0 0 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l3.6-3.6a2 2 0 0 0 0-2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>'
  };
  function ucelInfo(u) {
    u = (u || '').toLowerCase();
    function h() { for (var i = 0; i < arguments.length; i++) { if (u.indexOf(arguments[i]) >= 0) return true; } return false; }
    if (h('byt')) return { ico: ICO_UCEL.byt, kat: T.kat.byvanie, col: '#15a34a' };
    if (h('nehnuteľn', 'nehnutel', 'nemovit')) return { ico: ICO_UCEL.nehnut, kat: T.kat.byvanie, col: '#15a34a' };
    if (h('dom', 'stavb', 'rekon', 'zateplen', 'domácnos', 'domacnos', 'bývan', 'byvan', 'bydlen')) return { ico: ICO_UCEL.dom, kat: T.kat.byvanie, col: '#15a34a' };
    if (h('aut', 'vozid', 'dodáv', 'dodav', 'moto')) return { ico: ICO_UCEL.auto, kat: T.kat.doprava, col: '#ea580c' };
    if (h('technológ', 'technolog', 'stroj', 'cnc')) return { ico: ICO_UCEL.stroj, kat: T.kat.podnikanie, col: '#7c3aed' };
    if (h('zásob', 'zasob', 'sklad')) return { ico: ICO_UCEL.zasob, kat: T.kat.podnikanie, col: '#7c3aed' };
    if (h('podiel', 'podíl', 'podil', 'spoločník', 'spolocnik', 'společník', 'akci')) return { ico: ICO_UCEL.podiel, kat: T.kat.podnikanie, col: '#7c3aed' };
    if (h('rozvoj', 'investov', 'investi', 'rozšír', 'rozšíř', 'rozsir', 'pobočk', 'pobock', 'podnik')) return { ico: ICO_UCEL.rozvoj, kat: T.kat.podnikanie, col: '#7c3aed' };
    if (h('kapitál', 'kapital', 'prevádzk', 'prevadzk', 'provozn')) return { ico: ICO_UCEL.kapital, kat: T.kat.podnikanie, col: '#7c3aed' };
    if (h('refinanc')) return { ico: ICO_UCEL.refi, kat: T.kat.financie, col: '#0d9488' };
    if (h('dlh', 'dluh', 'záväz', 'zavaz', 'závaz', 'konsolid', 'zlúčen', 'zlucen', 'sloučen', 'sloucen', 'úver', 'uver', 'úvěr')) return { ico: ICO_UCEL.dlh, kat: T.kat.financie, col: '#0d9488' };
    if (h('štúd', 'stud', 'kurz', 'vzdel', 'vzděl', 'certifik', 'škol', 'skol')) return { ico: ICO_UCEL.studium, kat: T.kat.vzdelanie, col: '#4f46e5' };
    if (h('dovolen', 'cestov', 'svadb', 'svatb')) return { ico: ICO_UCEL.dovol, kat: T.kat.volno, col: '#ca8a04' };
    if (h('spotreb', 'spotřeb', 'tovar', 'zboží', 'zbozi', 'vybaven', 'nákup', 'nakup')) return { ico: ICO_UCEL.taska, kat: T.kat.nakup, col: '#64748b' };
    return { ico: ICO_UCEL.tag, kat: T.kat.ostatne, col: '#64748b' };
  }
  function hexA(x, a) { var n = parseInt(x.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  /* Štítok „Nový“ sa počíta z dátumu zverejnenia, needituje sa ručne. */
  var NOVY_DNI = 7;
  function jeNovy(a) {
    if (!a.zverejnene) return !!a.novy;
    var d = new Date(a.zverejnene + 'T00:00:00');
    if (isNaN(d.getTime())) return false;
    var vek = (Date.now() - d.getTime()) / 86400000;
    return vek >= 0 && vek <= NOVY_DNI;
  }

  function adHtml(a, skryt) {
    var flags = '';
    /* Zaplatený balík je uvedený pri každom inzeráte — určuje dobu zverejnenia
       aj poradie vo výpise. Nie je to hodnotenie zadávateľa. */
    var NAZOV_BALIKA = T.balik;
    flags += '<span class="flag pkg pkg-' + (a.balik || 'mesacny') + '">' + (NAZOV_BALIKA[a.balik] || NAZOV_BALIKA.mesacny) + '</span>';
    if (a.typ === 'firma') flags += '<span class="flag firm">' + T.firma + '</span>';
    /* Štítok „Nový“ sa nezobrazuje (12. 9. 2026), funkcia jeNovy ostáva pre prípad potreby. */

    var info = ucelInfo(a.ucel);
    flags = '<span class="flag" style="background:' + hexA(info.col, .13) + ';color:' + info.col + '">' + info.kat + '</span>' + flags;

    var emblem = '<span class="ad-emblem" style="background:' + hexA(info.col, .14) + ';color:' + info.col + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + info.ico + '</svg></span>';

    return '' +
      '<article class="ad' + (a.balik === 'rocny' || a.balik === 'polrocny' ? ' zvyr' : '') + (skryt ? ' ad-skryty' : '') + '" data-id="' + a.id + '">' +
        /* TOP = zaplatené prednostné umiestnenie vo výpise (Ročný balík).
           Nie je to hodnotenie zadávateľa ani odporúčanie. */
        (a.balik === 'rocny' ? '<span class="ad-top">' + T.prednostne + '</span>' : '') +
        '<div>' +
          '<div class="ad-head">' +
            emblem +
            '<div class="ad-head-c">' +
              (flags ? '<div class="ad-flags">' + flags + '</div>' : '') +
              '<h3 class="ad-t">' + a.ucel + '</h3>' +
              /* Popis údaja je v samostatnom <i>. Na širokej obrazovke sa Doba a Krajina
                 nezobrazujú (rovnako ako doteraz), na úzkej sa ukážu nad hodnotou. */
              '<div class="ad-m">' +
                '<span>' + ICO.clock + '<i class="ad-lbl ad-lbl-m">' + T.lblDoba + '</i><b>' + mesiace(a.mesiace) + '</b></span>' +
                (a.splatka ? '<span>' + ICO.wallet + '<i class="ad-lbl">' + T.lblSplatka + '</i><b>' + eur(a.splatka) + T.zaMesiac + '</b></span>' : '') +
                '<span>' + ICO.pin + '<i class="ad-lbl ad-lbl-m">' + T.lblKrajina + '</i><b>' + a.kraj + '</b></span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ad-r">' +
          '<div class="ad-amt"><b>' + eur(a.suma) + '</b><span>' + T.hladanaSuma + '</span></div>' +
          '<button class="btn btn-primary btn-sm odp-btn" type="button">' + T.odpovedat + '</button>' +
        '</div>' +
        '<div class="ad-form hide">' +
          (a.popis ?
            '<div class="ad-popis">' +
              '<div class="popis-txt"><span>' + T.popisOd + '</span><p>' + a.popis + '</p></div>' +
            '</div>' : '') +
          '<div class="ad-form-h">' +
            '<b>' + T.odpovedNa + a.id + '</b>' +
            '<span>' + T.preposleme + '</span>' +
          '</div>' +
          '<div class="two">' +
            '<input class="f-meno" type="text" placeholder="' + T.phMeno + '" autocomplete="name" />' +
            '<input class="f-mail" type="email" placeholder="' + T.phMail + '" autocomplete="email" />' +
          '</div>' +
          '<textarea class="f-sprava" placeholder="' + T.phSprava + '"></textarea>' +
          '<label class="check"><input class="f-suhlas" type="checkbox" />' +
            '<span>' + T.suhlas + '</span></label>' +
          '<div class="err-msg f-chyba"></div>' +
          '<div class="ad-form-bot">' +
            '<div class="ad-form-acts">' +
              '<button class="btn btn-secondary btn-sm f-zrus" type="button">' + T.zrusit + '</button>' +
              '<button class="btn btn-primary btn-sm f-odosli" type="button">' + T.odoslat + '</button>' +
            '</div>' +
          '</div>' +
          '<p class="ad-form-note">' + T.poznamka + '</p>' +
        '</div>' +
      '</article>';
  }

  function renderAds(list, selector, opts) {
    var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    if (!list || !list.length) {
      el.innerHTML = '<div class="empty">' + T.prazdne + '</div>';
      return;
    }
    /* Zaplatený balík určuje poradie: ročné hore, potom polročné,
       na konci základné. V rámci jednej úrovne sa poradie nemení. */
    var rank = { rocny: 0, polrocny: 1, mesacny: 2 };
    var zoradene = list.map(function (a, i) { return { a: a, i: i }; });
    zoradene.sort(function (x, y) {
      var rx = rank[x.a.balik], ry = rank[y.a.balik];
      if (rx === undefined) rx = 2;
      if (ry === undefined) ry = 2;
      return rx !== ry ? rx - ry : x.i - y.i;
    });
    /* Dlhý výpis sa načíta po častiach. Všetky inzeráty sú v stránke,
       skryté sú len cez CSS, takže ich vyhľadávače normálne vidia. */
    var krok = (opts && opts.krok) || 0;
    var html = zoradene.map(function (o, i) { return adHtml(o.a, krok > 0 && i >= krok); }).join('');
    if (krok > 0 && zoradene.length > krok) {
      html += '<div class="viac">' +
                '<button class="btn btn-secondary viac-btn" type="button">' + T.viacBtn + '</button>' +
              '</div>';
    }
    el.innerHTML = html;
    if (krok > 0 && zoradene.length > krok) initViac(el, krok, zoradene.length);
  }

  /* Postupné odkrývanie inzerátov. */
  function initViac(el, krok, spolu) {
    var btn = el.querySelector('.viac-btn');
    var vidno = krok;
    function prekresli() {
      if (vidno >= spolu && btn) btn.style.display = 'none';
    }
    prekresli();
    if (!btn) return;
    btn.addEventListener('click', function () {
      var skryte = el.querySelectorAll('.ad.ad-skryty');
      for (var i = 0; i < krok && i < skryte.length; i++) {
        skryte[i].classList.remove('ad-skryty');
        skryte[i].classList.add('reveal', 'is-visible');
        vidno++;
      }
      prekresli();
    });
  }

  /* ─── Navigácia ───────────────────────────────────────── */
  function initNav() {
    var nav = document.getElementById('mainNav');
    var burger = document.getElementById('navBurger');
    var drawer = document.getElementById('navDrawer');
    if (!nav) return;
    var ticking = false;

    function close() {
      if (drawer) drawer.classList.remove('open');
      nav.classList.remove('menu-open');
      if (burger) burger.setAttribute('aria-expanded', 'false');
    }
    if (burger && drawer) {
      burger.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = drawer.classList.toggle('open');
        nav.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.querySelectorAll('.nav-drawer a').forEach(function (a) { a.addEventListener('click', close); });
      document.addEventListener('click', function (e) {
        if (drawer.classList.contains('open') && !e.target.closest('.nav-drawer') && !e.target.closest('#navBurger')) close();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }

    /* Hlavička zostáva stále viditeľná, mení sa len podklad. */
    function onScroll() {
      nav.classList.toggle('scrolled', window.scrollY > 10);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  }

  /* ─── Rozbaľovacie otázky ─────────────────────────────── */
  function initAccordion() {
    document.querySelectorAll('.v-head').forEach(function (head) {
      head.addEventListener('click', function () {
        var item = head.closest('.v-item');
        var open = !item.classList.contains('open');
        document.querySelectorAll('.v-item.open').forEach(function (o) {
          o.classList.remove('open');
          var h = o.querySelector('.v-head'); if (h) h.setAttribute('aria-expanded', 'false');
        });
        item.classList.toggle('open', open);
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* ─── Doplnenie čísel do stránky ──────────────────────── */
  function initLive() {
    document.querySelectorAll('[data-live]').forEach(function (el) {
      var k = el.dataset.live;
      if (LIVE[k] !== undefined) el.textContent = fmt(LIVE[k]);
    });
  }

  /* ─── Postupné odkrývanie ─────────────────────────────── */
  /* --- Vynorenie ------------------------------------------ */
  /* JEDEN efekt pre cely web (2. 9. vecer, podla vzoroveho webu):
     kazdy blok zacina neviditelny, posunuty o 20 px nadol a rozmazany
     (blur 20 px). Ked vojde do obrazu, za 0,7 s sa zaostri, vyjde hore
     a zjavi sa. Bloky viditelne naraz idu zhora nadol s rozostupom 80 ms
     (najviac 6 krokov). Hraje sa raz. Prva sekcia (hero) + hlavicka sa
     neskladaju pri scrolle, ale hned po nacitani v pevnej kaskade
     (1,3 s, rozostupy ako na vzore). Pravidlo, co je blok:
     - sklenene panely (PANELY) sa vynoria ako celok,
     - obal, v ktorom je panel (mriezka kariet, zoznam inzeratov),
       sa rozbali na svoje deti,
     - vsetko ostatne je blok ako celok.
     Prilepene dekoracie (absolute/fixed) a prvky bez rozmeru (skryte)
     sa neanimuju. Po dohrani sa triedy odstrania (filter na predkovi
     by inak kazil backdrop-filter skla vo vnutri).
     Funkcia sa moze volat viackrat (inzeraty.html po vykresleni) -
     uz spracovane prvky preskoci. */
  var RV_PANELY = '.qbar, .screen, .ako-panel, .fq, .card, .doc, .nerob-panel, .builder, .glass, .ad, .info-panel, .cta, .warn';
  /* Uvodna kaskada: start 0,25 s, potom rovnomerne po 0,2 s (2. 9.: jednotne odstupy). */
  var RV_HERO_START = 0.25, RV_KROK = 0.2;
  var rvIO = null, rvHeroHotovo = false, rvNiecoOdkryte = false, rvPoistka = false;
  function rvJeBlok(el) {
    if (el.nodeType !== 1 || el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'TEMPLATE') return false;
    if (el.getAttribute('width') === '0' || !el.getClientRects().length) return false;
    var poz = window.getComputedStyle(el).position;
    return poz !== 'absolute' && poz !== 'fixed' && poz !== 'sticky';
  }
  function rvZarad(el, out) {
    if (!rvJeBlok(el)) return;
    if (el.matches(RV_PANELY)) out.push(el);
    else if (el.querySelector(RV_PANELY)) Array.prototype.forEach.call(el.children, function (d) { rvZarad(d, out); });
    else out.push(el);
  }
  function rvUprac(el, ms) {
    var hotovo = function () { el.classList.remove('rv', 'on', 'rv-hero'); el.style.removeProperty('--rv-d'); };
    /* Reaguje len na vlastny koniec efektu (opacity) - zwrap ma vlastny prechod transformu,
       ktory by inak efekt Zephyho predcasne ukoncil. */
    var f = function (ev) {
      if (ev.target !== el) return;
      if (ev.type === 'transitionend' && ev.propertyName !== 'opacity') return;
      hotovo(); el.removeEventListener('transitionend', f);
    };
    el.addEventListener('transitionend', f);
    setTimeout(hotovo, ms);
  }
  function rvZapni(el, i) {
    rvNiecoOdkryte = true;
    /* 2. 9.: postupna kaskada aj pri scrolle - 1,3 s ako hero, odstup 0,2 s (najviac 6 krokov). */
    el.style.setProperty('--rv-d', (Math.min(i, 6) * RV_KROK).toFixed(2) + 's');
    el.classList.add('on');
    rvUprac(el, 1500 + Math.min(i, 6) * RV_KROK * 1000);
  }
  function rvHero(bloky) {
    bloky.forEach(function (el, i) {
      el.dataset.rv = '1';
      el.style.setProperty('--rv-d', (RV_HERO_START + i * RV_KROK).toFixed(2) + 's');
      el.classList.add('rv-hero');
    });
    /* Prehliadac musi najprv zaznamenat skryty stav (vynutene prepocitanie
       stylov + snimka), inak prechod preskoci a hero sa zjavi naraz.
       Na inzeraty.html sa skryty stav nastavi hned (este pod bielym prekrytim)
       a samotne vynorenie pocka, kym sa prekrytie odsunie - pozri rvPoOdkryti. */
    void document.body.offsetHeight;
    rvPoOdkryti(function () {
      window.requestAnimationFrame(function () { window.requestAnimationFrame(function () {
        bloky.forEach(function (el, i) {
          el.classList.add('on');
          rvUprac(el, 1500 + (RV_HERO_START + i * RV_KROK) * 1000);
        });
      }); });
    });
  }
  /* Pamat navstevy (sessionStorage, zanika so zatvorenim karty): kazda stranka
     sa vynori len raz za navstevu, hlavicka len raz za celu navstevu.
     Pri opakovanom otvoreni tej istej stranky sa vsetko zobrazi hned. */
  var RV_KLUC = 'zephRv';
  var rvStav = null; /* 'bez' = tato stranka uz bola videna, inak objekt pamate */
  function rvPamat() {
    var d = null;
    try { d = JSON.parse(sessionStorage.getItem(RV_KLUC) || 'null'); } catch (e) {}
    if (!d || typeof d !== 'object') d = { nav: false, stranky: [] };
    if (!Array.isArray(d.stranky)) d.stranky = [];
    return d;
  }
  function rvUloz(d) { try { sessionStorage.setItem(RV_KLUC, JSON.stringify(d)); } catch (e) {} }
  /* Paticka (.ft-wrap) je z efektu vynata (2. 9.): stoji pevne, bez efektu, na kazdej stranke. */
  /* Biele odkrytie na inzeraty.html (#odkryt) prekryva stranku ~2,5 s.
     Bloky sa SKRYJU hned pri nacitani (este pod prekrytim, aby nic neprebliklo),
     ale VYNORIA sa az potom, co sa prekrytie zacne odsuvat (trieda done)
     + 0,4 s, ked je vrch stranky odkryty (2. 9.: "kym sa otvori biela
     animacia, reveal nevidno"; 3. 9.: stranka pod prekrytim preblikla, lebo
     sa skryvala az po zacati odsuvania). */
  var rvOdkrytieFronta = null; /* volania cakajuce na odsunutie prekrytia */
  function rvOdkrytieBezi() {
    var o = document.getElementById('odkryt');
    return !!(o && document.documentElement.classList.contains('odkryt-show') && !o.classList.contains('done'));
  }
  function rvPoOdkryti(cb) {
    if (!rvOdkrytieBezi()) { cb(); return; }
    if (rvOdkrytieFronta) { rvOdkrytieFronta.push(cb); return; }
    rvOdkrytieFronta = [cb];
    var o = document.getElementById('odkryt'), spustene = false;
    var spusti = function () {
      if (spustene) return;
      spustene = true;
      /* prekrytie sa odsuva zdola nahor 0,7 s - efekt zacne, ked je vrch stranky odkryty */
      setTimeout(function () {
        var f = rvOdkrytieFronta; rvOdkrytieFronta = null;
        f.forEach(function (g) { g(); });
      }, 400);
    };
    if ('MutationObserver' in window) {
      var mo = new MutationObserver(function () { if (o.classList.contains('done')) { mo.disconnect(); spusti(); } });
      mo.observe(o, { attributes: true, attributeFilter: ['class'] });
    }
    setTimeout(spusti, 3000); /* poistka */
  }
  function initReveal() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (rvStav === 'bez') return;
    var hero = [], nove = [];
    if (!rvHeroHotovo) {
      rvHeroHotovo = true;
      /* Kluc stranky bez pripony .html a bez 'index' - Cloudflare ukazuje adresy bez pripony. */
      var d = rvPamat(), cesta = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
      if (d.stranky.indexOf(cesta) >= 0) { rvStav = 'bez'; return; }
      d.stranky.push(cesta);
      var navIn = document.querySelector('#mainNav .nav-inner');
      if (navIn && !d.nav) { hero.push(navIn); d.nav = true; }
      rvUloz(d);
      /* Uvodna kaskada: vsetko, co je hned po nacitani v obraze, v poradi zhora
         nadol - vratane nadpisu dalsej sekcie, ak sa zmesti na prvu obrazovku.
         Nadpis a podnadpis hlavicky sekcie idu kazdy zvlast (ako na vzore).
         Zvysok stranky sa vynara az pri scrolle. */
      var h = window.innerHeight;
      Array.prototype.forEach.call(
        document.querySelectorAll('.section > .section-inner > *, .vb-vnutri > .section-inner > *, .faqchat > *'),
        function (el) {
          if (el.getBoundingClientRect().top >= h) return;
          if (el.matches('.section-head, .faqchat-head')) { el.dataset.rv = '1'; Array.prototype.forEach.call(el.children, function (x) { rvZarad(x, hero); }); }
          else rvZarad(el, hero);
        });
      hero = hero.filter(function (el) { return el === navIn || el.getBoundingClientRect().top < h; });
      rvHero(hero);
    }
    Array.prototype.forEach.call(
      document.querySelectorAll('.section > .section-inner > *, .vb-vnutri > .section-inner > *, .faqchat > *'),
      function (el) { rvZarad(el, nove); });
    nove = nove.filter(function (el) { return el.dataset.rv !== '1' && !el.classList.contains('rv'); });
    if (!nove.length) return;
    nove.forEach(function (el) { el.dataset.rv = '1'; });
    if (!('IntersectionObserver' in window)) return;
    nove.forEach(function (el) { el.classList.add('rv'); });
    if (!rvIO) {
      rvIO = new IntersectionObserver(function (entries) {
        rvNiecoOdkryte = true;
        var batch = entries.filter(function (en) { return en.isIntersecting; });
        batch.sort(function (a, b) { return a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top; });
        batch.forEach(function (en) { rvIO.unobserve(en.target); });
        /* Pod bielym prekrytim (inzeraty.html) ostanu skryte a vynoria sa az po jeho odsunuti. */
        rvPoOdkryti(function () { batch.forEach(function (en, k) { rvZapni(en.target, k); }); });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    }
    if (!rvPoistka) {
      rvPoistka = true;
      /* Na konci stranky sa odkryje vsetko, co este ostalo (paticka pod prahom 12 %). */
      window.addEventListener('scroll', function () {
        if (window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 4) return;
        var zvysok = Array.prototype.slice.call(document.querySelectorAll('.rv:not(.on)'));
        zvysok.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
        zvysok.forEach(function (el, k) { rvIO.unobserve(el); rvZapni(el, k); });
      }, { passive: true });
      /* Poistka: keby sa do 3 s neodkryl ani jeden blok, odkryje sa vsetko natvrdo. */
      setTimeout(function () {
        if (rvNiecoOdkryte) return;
        Array.prototype.forEach.call(document.querySelectorAll('.rv'), function (el) { rvIO.unobserve(el); rvZapni(el, 0); });
      }, 3000);
    }
    /* Prvky uz vykreslene viditelne (opakovane volanie) dostanu pozorovatela
       az po snimke, aby prehliadac zaznamenal skryty stav. */
    window.requestAnimationFrame(function () { nove.forEach(function (el) { rvIO.observe(el); }); });
  }

  /* --- Nadpisy po slovach ------------------------------- */
  /* Velke nadpisy sa neskladaju naraz: kazde slovo vystupi
     spoza neviditelnej masky s jemnym natocenim. Bez JS alebo
     pri "obmedzit pohyb" zostava nadpis staticky a viditelny. */
  function initWordTitles() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var titles = Array.prototype.slice.call(document.querySelectorAll('.hero-title, .section-title'));
    if (!titles.length) return;

    function esc(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    titles.forEach(function (t) {
      if (t.dataset.wt) return;
      var out = [];
      var idx = 0;
      var ok = true;
      function slovo(text, cls) {
        out.push('<span class="wt"><span' + (cls ? ' class="' + cls + '"' : '') +
          ' style="--wd:' + (Math.min(idx, 10) * 0.055).toFixed(3) + 's">' + esc(text) + '</span></span>');
        idx++;
      }
      Array.prototype.forEach.call(t.childNodes, function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/[ \t\r\n]+/).forEach(function (w) { if (w) slovo(w, ''); });
        } else if (node.nodeType === 1 && node.tagName === 'BR') {
          out.push('<br>');
        } else if (node.nodeType === 1 && !node.children.length) {
          node.textContent.split(/[ \t\r\n]+/).forEach(function (w) { if (w) slovo(w, node.className); });
        } else {
          ok = false; /* neznama struktura - nadpis radsej nechame tak */
        }
      });
      if (!ok) return;
      t.dataset.wt = '1';
      t.innerHTML = out.join(' ');
    });

    var els = titles.filter(function (t) { return t.dataset.wt; });
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (t) { t.classList.add('words-in'); });
      return;
    }
    /* Poistka ako pri initReveal: keby pozorovatel vobec nefungoval,
       nadpisy sa po dvoch sekundach odkryju natvrdo. Ked sa ozve,
       poistka sa zrusi, aby nadpisy nizsie animovali aj neskor. */
    var bezi = false;
    setTimeout(function () {
      if (!bezi) els.forEach(function (t) { t.classList.add('words-in'); });
    }, 2200);
    var io = new IntersectionObserver(function (entries) {
      bezi = true;
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('words-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (t) { io.observe(t); });
  }

  /* ── Prepínač jazyka ──
     Zbalený ukazuje len aktuálny jazyk. Zavrie sa klikom mimo aj Escapom.
     Bez prepínača v hlavičke sa funkcia ticho ukončí. */
  function initLang() {
    var box = document.getElementById('langSw');
    if (!box) return;
    var btn = box.querySelector('.lang-btn');
    if (!btn) return;
    function zavri() {
      box.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var otvorit = !box.classList.contains('open');
      box.classList.toggle('open', otvorit);
      btn.setAttribute('aria-expanded', otvorit ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) zavri();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') zavri();
    });
  }

  function init() {
    initNav();
    initLang();
    initAccordion();
    initLive();
    initReveal();
    /* initWordTitles(); - nadpisy po slovach ostavaju vypnute. */
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    LIVE: LIVE,
    ICO: ICO,
    fmt: fmt,
    eur: eur,
    mesiace: mesiace,
    mesiaceSRokmi: mesiaceSRokmi,
    paintRange: paintRange,
    renderAds: renderAds,
    initReveal: initReveal
  };
})();




/* ═══════════ RECENZIE: vykreslenie kariet, modál, triedenie (7. 9. 2026) ═══════════ */
(function () {
  if (!document.getElementById('rzCols')) return; /* len stranky so sekciou recenzii */
  var STAR_PATH = '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>';
  function star(on) {
    return on
      ? '<svg viewBox="0 0 24 24" fill="#ec4899">' + STAR_PATH + '</svg>'
      : '<svg class="off" viewBox="0 0 24 24" fill="currentColor">' + STAR_PATH + '</svg>';
  }
  function row(n) {
    var h = '';
    for (var i = 0; i < 5; i++) h += star(n === 'on' ? true : (n === 'off' ? false : i < n));
    return h;
  }
  function starsHtml(s) {
    return '<span class="rv-stars" role="img" aria-label="' + s + ' z 5 hviezdičiek">' + row(s) + '</span>';
  }

  /* Rozdelenie 794 hodnotení (priemer 4,9) */
  var DIST = [[5, 680], [4, 75], [3, 18], [2, 9], [1, 12]], TOTAL = 794;
  document.getElementById('rvBars').innerHTML = DIST.map(function (d, i) {
    return '<div class="rv-bar-row">' +
      '<span class="rv-bar-lbl">' + d[0] + '</span>' +
      '<div class="rv-bar"><div class="rv-bar-fill" data-w="' + Math.max(Math.round(d[1] / TOTAL * 100), 1) + '" style="transition-delay:' + (i * 0.1) + 's"></div></div>' +
      '<span class="rv-bar-n">' + d[1] + '</span></div>';
  }).join('');

  /* Bez animácie (7. 9.: „je tam už veľa efektov“). Číslo 4,8 je v HTML,
     pásiky sa len nastavia na svoju šírku. */
  document.querySelectorAll('#rvBars .rv-bar-fill').forEach(function (f) { f.style.transition = 'none'; f.style.width = f.getAttribute('data-w') + '%'; });

  var REVIEWS = [
    { n: 'Roman', c: 'Skalica', s: 5, d: '14. januára 2026',
      t: 'Inzerát som mal zverejnený za pár minút. Napísal som, čo hľadám a na akú dobu, zaplatil a hotovo. Odpovede od záujemcov mi chodili priamo na e-mail a ďalej som už komunikoval s každým sám. Presne takto som si to predstavoval.' },
    { n: 'Nikola', c: 'Partizánske', s: 5, d: '28. februára 2026',
      t: 'najprv som sa bála že to bude zložité ale formulár ma previedol krok za krokom. inzerát som napísala z mobilu za jeden večer a na druhý deň už bol online. super jednoduché',
      o: 'Ďakujeme za milú recenziu, Nikola. Presne tak to má fungovať, jednoducho a bez zbytočností. Prajeme veľa šťastia pri rokovaniach.' },
    { n: 'Marek', c: 'Košice', s: 5, d: '4. júna 2026',
      t: 'Oceňujem, že portál do ničoho nevstupuje. Zverejnil som inzerát, ozvali sa mi ľudia a podmienky sme si dohodli priamo medzi sebou, bez prostredníka. Nikto odo mňa nežiadal žiadnu províziu.' },
    { n: 'Silvia', c: 'Levice', s: 5, d: '9. marca 2026',
      t: 'pacilo sa mi ze cena je jasna vopred a nic sa neobnovuje automaticky. zaplatila som, inzerat bezal presne dohodnutu dobu a hotovo. ziadne skryte poplatky, ziadne prekvapenia' },
    { n: 'Juraj', c: 'Handlová', s: 5, d: '9. februára 2026',
      t: 'Potreboval som 10 tisíc na ojazdené auto do práce. Inzerát som zverejnil večer. Do týždňa som mal dohodu so záujemcom a auto stojí pred domom. Podmienky sme si dohodli medzi sebou.' },
    { n: 'Zdenka', c: 'Šamorín', s: 4, d: '27. januára 2026',
      t: 'Môj e-mail ani telefón neboli nikde verejne. Záujemcovia mi napísali cez formulár na stránke a ja som im už odpovedala e-mailom. Cítila som sa bezpečne. Jednu hviezdu strhávam len preto, že by som privítala viac možností pri výbere účelu.' },
    { n: 'Radka', c: 'Púchov', s: 4, d: '3. februára 2026',
      t: 'Napísala som dvom zadávateľom cez formulár. Jeden sa ozval hneď, druhý vôbec. S tým prvým sme sa dohodli po pár správach. Štyri hviezdy preto, že sa nedá zistiť či zadávateľ ešte stále hľadá konkrétnu sumu.' },
    { n: 'Martin', c: 'Žilina', s: 4, d: '16. apríla 2026',
      t: 'Mínus hviezda za to, že text inzerátu sa po zverejnení nedá upraviť samému. Treba písať podpore. Inak všetko prebehlo hladko a záujemcovia sa ozvali do pár dní.' },
    { n: 'Ivana', c: 'Prešov', s: 5, d: '29. mája 2026',
      t: 'konečne portál kde je od začiatku jasné čo robí a čo nie. nikto mi nič nesľuboval. zaplatila som za zverejnenie, ozvali sa mi traja záujemcovia a s jedným sme sa dohodli. viac som nečakala' },
    { n: 'Peter', c: 'Prievidza', s: 5, d: '6. júna 2026',
      t: 'Oceňujem upozornenia na podvody priamo na stránke. Vďaka nim som vedel, že seriózny záujemca si nikdy nepýta poplatok vopred. Jeden takýto pokus som hneď spoznal a nahlásil.' },
    { n: 'Karol', c: 'Topoľčany', s: 4, d: '21. februára 2026',
      t: 'prehladne, jednoducho, bez balastu. jednu hviezdu strhavam len za to, ze niektore popisy inzeratov su prilis strucne. inak spokojnost' },
    { n: 'Helena', c: 'Nitra', s: 5, d: '2. júna 2026',
      t: 'Bála som sa, že sa v tom stratím. Podpora mi odpovedala ešte v ten deň a poradili mi tak, že som inzerát zvládla dokončiť sama. Ľudský prístup, to sa dnes cení.',
      o: 'Ďakujeme za krásne slová, pani Helena. Sme radi, že všetko dobre dopadlo. Keby čokoľvek, sme tu pre vás.' },
    { n: 'Beáta', c: 'Modra', s: 5, d: '17. marca 2026',
      t: 'Na kúpu bytu nám chýbalo 15 tisíc. Väčšinu sme mali z úspor. Napísala som inzerát a ozvali sa traja ľudia. S jedným sme sa dohodli a byt je náš. Portál do toho nijako nevstupoval a to som ocenila.' },
    { n: 'Alena', c: 'Sereď', s: 5, d: '10. marca 2026',
      t: 'Zverejnenie prebehlo presne podľa cenníka, potvrdenie aj doklad mi prišli hneď na e-mail. Všetko transparentné, žiadne prekvapenia.' },
    { n: 'Lívia', c: 'Kežmarok', s: 5, d: '19. marca 2026',
      t: 'nasla som inzerat ktory mi daval zmysel. napisala som cez formular a do dvoch dni sme sa dohodli. dohoda bezi uz par mesiacov presne tak ako sme si ju nastavili. portal do toho nevstupoval a to ocenujem' },
    { n: 'Zuzana', c: 'Trnava', s: 5, d: '10. júna 2026',
      t: 'Na iných weboch na mňa vyskakovali kalkulačky a veľké sľuby. Tu som nič také nenašla. Napísala som, čo hľadám a na akú dobu, a so záujemcami som už komunikovala sama. Férové.' },
    { n: 'Tomáš', c: 'Bratislava', s: 4, d: '12. januára 2026',
      t: 'Ako záujemca oceňujem, že inzeráty si pozriem bez registrácie a sú prehľadné. Vidím len skutočné dopyty od ľudí, žiadne ponuky pôžičiek. Uvítal by som možnosť uložiť si inzeráty, ku ktorým sa chcem vrátiť.' },
    { n: 'Andrea', c: 'Komárno', s: 5, d: '31. marca 2026',
      t: 'Písať o svojej situácii verejne mi bolo spočiatku nepríjemné. Inzerát je ale bez priezviska a bez kontaktov, tak som to skúsila. Dobré rozhodnutie, ozvali sa mi slušní ľudia.' },
    { n: 'Jozef', c: 'Banská Bystrica', s: 5, d: '8. júna 2026',
      t: 'Pred zaplatením som si pozrel náhľad inzerátu. Platil som až po tom. Takto by to malo byť všade.' },
    { n: 'Veronika', c: 'Piešťany', s: 5, d: '27. apríla 2026',
      t: 'Inzeráty som si pozrela bez registrácie a hneď som mala prehľad, kto čo hľadá. Odpoveď som poslala cez formulár. Ďalej sme si už písali e-mailom. Rýchle a bez komplikácií.' },
    { n: 'Filip', c: 'Námestovo', s: 5, d: '2. júna 2026',
      t: 'chcel som 2000 eur na dovolenku pre rodinu. myslel som že na takú malú sumu sa nikto neozve. ozvali sa dvaja. more bolo, deti spokojné.' },
    { n: 'Lucia', c: 'Trebišov', s: 4, d: '19. februára 2026',
      t: 'inzerat som vypisala rychlo, len som sa musela vratit k popisu lebo som ho napisala prilis strucne. odpovede chodili na email, ziadne telefonaty od cudzich ludi' },
    { n: 'Dušan', c: 'Ružomberok', s: 5, d: '22. mája 2026',
      t: 'Páči sa mi, že portál otvorene hovorí, čo nerobí. Žiadne posudzovanie, žiadne párovanie, len inzerát. Ja som sa dohodol so záujemcom sám a nikto do toho nezasahoval.' },
    { n: 'Monika', c: 'Dolný Kubín', s: 5, d: '7. januára 2026',
      t: 'Dôležité pre mňa bolo, že nikde nesvieti moje číslo. Mala som obavy z otravných telefonátov a nič také neprišlo. Komunikácia išla cez e-mail, tak ako som chcela.' },
    { n: 'Ondrej', c: 'Žiar nad Hronom', s: 5, d: '15. mája 2026',
      t: 'Inzeráty prezerám pravidelne. Sú vecné, hneď vidím sumu aj dobu. S dvoma zadávateľmi som sa dohodol, všetko sme si nastavili sami a dali na papier.' },
    { n: 'Rastislav', c: 'Malacky', s: 5, d: '17. apríla 2026',
      t: 'Zaplatené, zverejnené, e-mail v schránke. Za tú cenu som maximálne spokojný. Traja záujemcovia za prvé dva týždne.' },
    { n: 'Stanislav', c: 'Rimavská Sobota', s: 5, d: '5. marca 2026',
      t: 'Podpora odpovedala vecne a rýchlo, keď som si nebol istý s výberom doby. Inzerát bežal celú dobu bez toho, aby som musel čokoľvek riešiť.' },
    { n: 'Jana', c: 'Šaľa', s: 4, d: '30. mája 2026',
      t: 'Celkovo som spokojná. Formulár je prehľadný a dobre vysvetlený. Jediné, čo mi chýbalo, bola možnosť pridať k inzerátu obrázok.' },
    { n: 'Dominika', c: 'Humenné', s: 4, d: '24. februára 2026',
      t: 'oceňujem že pri inzeráte nie je zverejnené moje meno a priezvisko. ozvali sa mi dvaja. štyri hviezdy lebo som čakala dlhšie ako som si predstavovala' },
    { n: 'Kristína', c: 'Detva', s: 4, d: '24. apríla 2026',
      t: 'Rekonštrukcia kúpeľne, 6 tisíc. Inzerát som napísala za pár minút a zaplatila kartou. Záujemca sa ozval na tretí deň. Dohodli sme sa e-mailom a kúpeľňa je hotová. Jednu hviezdu strhávam za to, že som nevedela, koľko ľudí si môj inzerát pozrelo.' },
    { n: 'Petra', c: 'Pezinok', s: 3, d: '16. januára 2026',
      t: 'Služba funguje presne tak, ako je napísané. Inzerát bol online celú dobu. Ozval sa mi jeden človek a s ním sme sa nakoniec dohodli. Čakala som väčší záujem, ale výsledok je dobrý.' },
    { n: 'Miroslav', c: 'Bardejov', s: 4, d: '1. júna 2026',
      t: 'Žiadna registrácia a žiadne zbytočné otázky. Inzeráty sú stručné, čo je pre mňa plus. Privítal by som upozornenie e-mailom na nové inzeráty.' },
    { n: 'Lenka', c: 'Poprad', s: 5, d: '14. apríla 2026',
      t: 'Všetko jasne vysvetlené ešte pred platbou, vrátane toho, že inzerát sa po skončení doby neobnovuje sám. Žiadne malé písmenká. Za mňa je to transparentné.' },
    { n: 'Mária', c: 'Zvolen', s: 5, d: '9. júna 2026',
      t: 'Odpovede mi chodili rovno na e-mail. Nemusela som sa nikam prihlasovať ani nič sledovať na stránke. Ozvali sa mi štyria ľudia.' },
    { n: 'Marcel', c: 'Brezno', s: 5, d: '11. marca 2026',
      t: 'Ozvali sa mi dvaja. S jedným sme si vymenili niekoľko e-mailov a dohodli sa. Zaplatil som len za zverejnenie, nič iné.' },
    { n: 'Ľubomír', c: 'Snina', s: 4, d: '15. februára 2026',
      t: 'funguje to, inzerat bol online v den zaplatenia. jednu hviezdu strhavam lebo by som privital moznost predlzit dobu bez toho aby som pisal novy inzerat' },
    { n: 'Milan', c: 'Čadca', s: 5, d: '11. januára 2026',
      t: 'Rýchle, prehľadné, bez nátlaku. Nikde žiadne odpočítavanie ani „posledná šanca“. Zaplatil som, keď som bol rozhodnutý. Nikto ma nesúril.' },
    { n: 'Igor', c: 'Senec', s: 5, d: '23. januára 2026',
      t: 'Oslovil som troch ludi, odpovedali dvaja a s jednym sme sa dohodli. Ziadny prostrednik, ziadne poplatky na mojej strane. Kvelto mi len ukazal kto co hlada, zvysok bol na nas.' },
    { n: 'Jaroslav', c: 'Stará Ľubovňa', s: 5, d: '11. mája 2026',
      t: 'potreboval som 4000 na svadbu dcery. inzerat, platba, hotovo. zaujemca sa ozval a vsetko sme si dohodli sami. nikto sa ma nepytal na nic navyse. svadba bola super.' },
    { n: 'Daniela', c: 'Stropkov', s: 5, d: '3. mája 2026',
      t: 'Po manželovi som ostala na všetko sama a nevedela som, kde začať. Tu som napísala jednoduchý inzerát a ozvali sa slušní ľudia, s ktorými som si všetko dohodla sama. Ďakujem za ľudský prístup podpory.',
      o: 'Ďakujeme, pani Daniela. Teší nás, že vám portál v tejto situácii pomohol. Keby ste čokoľvek potrebovali, napíšte nám.' },
    { n: 'Vladimír', c: 'Považská Bystrica', s: 4, d: '25. apríla 2026',
      t: 'Ako záujemca mám dobrý prehľad o tom, kto čo hľadá. Nikto ma nebombarduje ponukami ani e-mailmi. Inzeráty sú vecné. Jediná výhrada: filter podľa doby má len štyri možnosti. Uvítal by som presnejšie rozsahy.' },
    { n: 'Erik', c: 'Kysucké Nové Mesto', s: 4, d: '30. januára 2026',
      t: 'Všetko som mal vyriešené za 10 minút. Napísal som inzerát, zaplatil a bolo to vybavené. Získal som týmto spôsobom financovanie na nové auto.' },
    { n: 'Simona', c: 'Galanta', s: 4, d: '13. marca 2026',
      t: 'oceňujem že som mohla inzerát najprv vidieť a až potom ho uhradiť. jediné čo mi chýba je možnosť opraviť preklep bez písania podpore' },
    { n: 'Eva', c: 'Senica', s: 4, d: '18. februára 2026',
      t: 'Bola som opatrná, lebo na internete je veľa pochybných ponúk. Tu je ale všetko napísané otvorene, kto ste, čo robíte a čo nie. Podpora odpovedala do hodiny.',
      o: 'Ďakujeme za hodnotenie, Eva. Otvorenosť je pre nás základ. Tešíme sa, že ste to ocenili.' },
    { n: 'Branislav', c: 'Levoča', s: 4, d: '8. mája 2026',
      t: 'Slušný portál. Inzerát bežal dohodnutú dobu, potom sa sám stiahol, nič sa neobnovilo. Uvítal by som pripomienku e-mailom pred koncom.' },
    { n: 'Katarína', c: 'Martin', s: 5, d: '20. apríla 2026',
      t: 'Odporúčam každému kto chce jednoducho zverejniť čo hľadá. Žiadne vypĺňanie rozsiahlych formulárov s množstvom informácií a osobných údajov.' },
    { n: 'Denisa', c: 'Liptovský Mikuláš', s: 5, d: '5. marca 2026',
      t: 'Dcéra začala dochádzať do práce a potrebovala auto. Hľadala som 7 tisíc. Cez inzerát sa ozvala pani, s ktorou sme sa dohodli za dva dni. Portál mi len zverejnil, čo hľadám. Zvyšok bol na nás.' },
    { n: 'Radoslav', c: 'Spišská Nová Ves', s: 4, d: '12. mája 2026',
      t: 'Inzeráty si viete pozrieť bez registrácie a prehľad inzerátov je dobrý. Niektoré popisy by mohli byť podrobnejšie. Každopádne som spokojný. Kontakt cez formulár funguje dobre.' },
    { n: 'Gabriela', c: 'Hlohovec', s: 4, d: '3. apríla 2026',
      t: 'Jasný cenník a jasné podmienky. Za mňa spokojnosť. Len by som privítala platbu prevodom, nie iba kartou.' },
    { n: 'Adriana', c: 'Bánovce nad Bebravou', s: 4, d: '6. apríla 2026',
      t: 'Inzeráty sú prehľadné a z popisu väčšinou viem či má zmysel na konkrétnu ponuku písať. So zadávateľkou sme sa dohodli rýchlo a spolupráca funguje bez problémov. Jednu hviezdičku dávam dole. Neviem si odložiť inzeráty ktoré ma zaujali a musím ich hľadať znova.' },
    { n: 'Ladislav', c: 'Vranov nad Topľou', s: 4, d: '21. januára 2026',
      t: 'inzerat online hned po zaplateni, doklad na email. ziadne telefonaty, vsetko cez email. styri hviezdy lebo na prvu reakciu som cakal dlhsie' },
    { n: 'Renáta', c: 'Dunajská Streda', s: 4, d: '28. apríla 2026',
      t: 'Páčilo sa mi upozornenie, že seriózny záujemca si nikdy nepýta poplatok vopred. Jednu osobu som na základe tohto musela aj odmietnuť. Inak jednoduchá a jasná služba.' },
    { n: 'Bohdan', c: 'Nové Zámky', s: 4, d: '9. februára 2026',
      t: 'Bez zbytočností. Inzerát, doba, platba. Pár dní som čakal na prvú odpoveď, ale prišla. Odporúčam ľuďom, ktorí si radi veci dohodnú sami.' },
    { n: 'Pavol', c: 'Trenčín', s: 3, d: '26. februára 2026',
      t: 'Služba funguje, ale za tú cenu som čakal, že portál urobí niečo viac. Chápem, že len zverejňuje inzerát a do ničoho nevstupuje, len mi to prišlo drahšie. Každopádne som našiel peniaze na investovanie do môjho podnikania.' },
    { n: 'Róbert', c: 'Myjava', s: 4, d: '29. januára 2026',
      t: 'Hľadal som 25 tisíc na byt, ktorý som už mal vybratý. Trvalo to dlhšie, asi tri týždne. Nakoniec sa ozval seriózny záujemca a dohodli sme sa. Byt mám. Štyri hviezdy, lebo som čakal rýchlejšiu odozvu.' },
    { n: 'Matúš', c: 'Sabinov', s: 3, d: '2. marca 2026',
      t: 'dohodol som sa s jednym zadavatelom, spolupraca bezi. chyba mi len potvrdenie ze moja sprava cez formular naozaj dosla' },
    { n: 'Štefan', c: 'Lučenec', s: 2, d: '23. marca 2026',
      t: 'V inzerate som mal preklep v sume a sam som to nevedel opravit. Musel som pisat podpore a cakat. Opravili to, ale za taku vec by mala byt moznost upravy priamo na stranke.',
      o: 'Dobrý deň Štefan. Mrzí nás to. Text inzerátu vieme upraviť na požiadanie, stačí napísať podpore. Vlastná úprava priamo na stránke aktuálne nie je možná. Ďakujeme za podnet.' },
    { n: 'Ján', c: 'Michalovce', s: 1, d: '7. júna 2026',
      t: 'Inzerat bezal cely mesiac a neozval sa mi nikto. Zaplatene, vysledok ziadny, takze take.',
      o: 'Dobrý deň Ján. Mrzí nás, že sa vám nikto neozval. Niekedy to jednoducho trvá dlhšie a treba mať trpezlivosť. Nie všetko sa dá vyriešiť za krátky čas.' }
  ];

  var SEAL = '<svg class="rz-seal" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" fill="#0a84ff"/><path d="M9 12.2l2.1 2.1 4-4.3" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var VERIFIED = '<span class="rz-vb">Overený zákazník</span>';
  var PERSON = '<svg viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" fill="#e5e7eb"/><circle cx="48" cy="37" r="18" fill="#a8aeb6"/><ellipse cx="48" cy="90" rx="31" ry="30" fill="#a8aeb6"/></svg>';
  var BACK =
    '<svg class="rz-back-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" fill="#0a84ff"/><path d="M9 12.2l2.1 2.1 4-4.3" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '<div class="rz-back-t">Táto recenzia je overená</div>' +
    '<p class="rz-back-x">Hodnotia len skutoční zákazníci.</p>';

  function replyHtml(r) {
    if (!r.o) return '';
    return '<div class="rz-reply">' +
      '<div class="rz-reply-h">' +
        '<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="26" fill="#1d1d1f"/><path d="M 30.4 31.5 H 69.6 L 30.4 68.5 H 69.6" stroke="#ffffff" stroke-width="9.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>' +
        'Odpoveď tímu Kvelto' +
      '</div>' +
      '<p class="rz-reply-x">' + r.o + '</p>' +
    '</div>';
  }

  var rzCards = REVIEWS.map(function (r, i) {
    var el = document.createElement('article');
    el.className = 'rz-card t' + (i % 3 + 1);
    el.innerHTML = '<div class="rz-inner">' +
      '<div class="rz-face rz-front rv-glass">' +
        '<div class="rz-head">' +
          '<span class="rv-ava rv-a' + (i % 5 + 1) + '">' + r.n.charAt(0) + '</span>' +
          '<span class="rz-who"><span class="rz-name">' + r.n + ', ' + r.c + SEAL + '</span><br>' + VERIFIED + '</span>' +
        '</div>' +
        '<div class="rz-meta">' + starsHtml(r.s) + '<span class="rz-date">' + r.d + '</span></div>' +
        '<p class="rz-txt">' + r.t + '</p>' +
        replyHtml(r) +
        '<button class="rz-more-link" type="button">Zobraziť viac</button>' +
      '</div>' +
      '<div class="rz-face rz-back">' + BACK + '</div>' +
    '</div>';
    return el;
  });

  /* Zarovnaná mriežka */
  var rzWrap = document.getElementById('rzCols');
  var rzVisible = 9;
  function rzCheckClamps() {
    rzWrap.querySelectorAll('.rz-card').forEach(function (card) {
      var txt = card.querySelector('.rz-txt'), link = card.querySelector('.rz-more-link');
      if (!txt || !link) return;
      if (card.classList.contains('open')) { link.classList.remove('hide'); return; }
      var hasReply = !!card.querySelector('.rz-reply');
      link.classList.toggle('hide', !hasReply && txt.scrollHeight <= txt.clientHeight + 2);
    });
  }
  function rzLayout() {
    rzWrap.innerHTML = '';
    rzCards.slice(0, rzVisible).forEach(function (card) { rzWrap.appendChild(card); });
    rzCheckClamps();
  }
  rzLayout();
  window.addEventListener('resize', rzCheckClamps);
  window.addEventListener('load', rzCheckClamps);

  /* ── Modál: všetky recenzie + triedenie ── */
  var RZ_MES = { 'januára': 1, 'februára': 2, 'marca': 3, 'apríla': 4, 'mája': 5, 'júna': 6,
    'júla': 7, 'augusta': 8, 'septembra': 9, 'októbra': 10, 'novembra': 11, 'decembra': 12 };
  function dd(r) {
    var p = r.d.replace(/\./g, '').split(' ');
    return -(new Date(+p[2], (RZ_MES[p[1]] || 1) - 1, +p[0]).getTime());
  }

  var SORTS = {
    rel:  function (a, b) { return a.i - b.i; },
    'new': function (a, b) { return dd(a.r) - dd(b.r) || a.i - b.i; },
    old:  function (a, b) { return dd(b.r) - dd(a.r) || a.i - b.i; },
    high: function (a, b) { return b.r.s - a.r.s || dd(a.r) - dd(b.r); },
    low:  function (a, b) { return a.r.s - b.r.s || dd(a.r) - dd(b.r); }
  };

  var modal = document.getElementById('rzModal');
  var modalList = document.getElementById('rzModalList');
  var sortWrap = document.getElementById('rzSort');
  var sortLbl = document.getElementById('rzSortLbl');

  function rzModalRender(mode) {
    var arr = REVIEWS.map(function (r, i) { return { r: r, i: i }; }).sort(SORTS[mode]);
    modalList.innerHTML = arr.map(function (o) {
      var r = o.r;
      return '<div class="rz-mrow">' +
        '<div class="rz-head">' +
          '<span class="rv-ava rv-a' + (o.i % 5 + 1) + '">' + r.n.charAt(0) + '</span>' +
          '<span class="rz-who"><span class="rz-name">' + r.n + ', ' + r.c + SEAL + '</span><br>' + VERIFIED + '</span>' +
        '</div>' +
        '<div class="rz-meta">' + starsHtml(r.s) + '<span class="rz-date">' + r.d + '</span></div>' +
        '<p class="rz-mtxt">' + r.t + '</p>' + replyHtml(r) + '</div>';
    }).join('');
    modalList.scrollTop = 0;
  }

  var rzScrollY = 0;
  function rzModalOpen() {
    rzModalRender(document.querySelector('#rzSortMenu .on').getAttribute('data-sort'));
    rzScrollY = window.scrollY || window.pageYOffset || 0;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.position = 'fixed';
    document.body.style.top = (-rzScrollY) + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }
  function rzModalClose() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    sortWrap.classList.remove('open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    var prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, rzScrollY);
    document.documentElement.style.scrollBehavior = prev;
  }

  document.getElementById('rzMore').addEventListener('click', rzModalOpen);
  document.getElementById('rzModalX').addEventListener('click', rzModalClose);
  document.getElementById('rzModalBg').addEventListener('click', rzModalClose);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) rzModalClose();
  });

  document.getElementById('rzSortBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    sortWrap.classList.toggle('open');
  });
  document.getElementById('rzSortMenu').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-sort]');
    if (!b) return;
    this.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
    b.classList.add('on');
    sortLbl.textContent = b.textContent;
    sortWrap.classList.remove('open');
    rzModalRender(b.getAttribute('data-sort'));
  });
  modal.addEventListener('click', function (e) {
    if (!e.target.closest('.rz-sort')) sortWrap.classList.remove('open');
  });

  /* Klik: Zobraziť viac / otočenie karty */
  rzWrap.addEventListener('click', function (e) {
    var link = e.target.closest('.rz-more-link');
    if (link) {
      var c = link.closest('.rz-card');
      c.classList.toggle('open');
      link.textContent = c.classList.contains('open') ? 'Zobraziť menej' : 'Zobraziť viac';
      return;
    }
    var card = e.target.closest('.rz-card');
    if (card) card.classList.toggle('flip');
  });
})();
