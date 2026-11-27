(() => {
  // ─── 61 Verified Archival Diplomacy Photographs (Exact Origin + Source + License) ───
  const ARCHIVE_PRINTS = [
    {
      "id": "01",
      "src": "./assets/archive/01-un-general-assembly.webp",
      "shortLoc": "UNGA · New York",
      "year": "2014",
      "theme": "Multilateral Assembly",
      "title": "United Nations General Assembly Hall",
      "origin": "United Nations Headquarters · New York, USA",
      "story": "The plenary hall where all 193 UN member states hold equal voice on international treaties, humanitarian crises, and global policy.",
      "credit": "Basil D Soufi",
      "license": "CC BY-SA 3.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:United_Nations_General_Assembly_Hall_(3).jpg"
    },
    {
      "id": "02",
      "src": "./assets/archive/02-un-security-council.webp",
      "shortLoc": "UNSC · New York",
      "year": "2016",
      "theme": "Peace & Security",
      "title": "UN Security Council Chamber — Nuclear Non-Proliferation Debate",
      "origin": "United Nations Headquarters · New York, USA",
      "story": "Foreign ministers and ambassadors negotiate around the Security Council horseshoe table on the Comprehensive Nuclear-Test-Ban Treaty.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:United_Nations_Security_Council_Meeting_on_the_Comprehensive_Nuclear-Test-Ban_Treaty_(29795162411).jpg"
    },
    {
      "id": "03",
      "src": "./assets/archive/03-paris-signing.webp",
      "shortLoc": "COP21 · New York",
      "year": "2016",
      "theme": "Climate Diplomacy",
      "title": "Signing of the Paris Climate Agreement (COP21)",
      "origin": "UN General Assembly Hall · New York, USA",
      "story": "A defining Earth Day moment of intergenerational climate diplomacy as nations formally sign the Paris Agreement under the golden UN emblem.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Secretary_Kerry_Holds_Granddaughter_Dobbs-Higginson_on_Lap_While_Signing_COP21_Climate_Change_Agreement_at_UN_General_Assembly_Hall_in_New_York_(26556850026).jpg"
    },
    {
      "id": "04",
      "src": "./assets/archive/04-eu-parliament.webp",
      "shortLoc": "EU Parliament · Strasbourg",
      "year": "2014",
      "theme": "Transnational Governance",
      "title": "European Parliament Plenary Hemicycle",
      "origin": "Louise Weiss Building · Strasbourg, France",
      "story": "Directly elected legislators from across Europe debate cross-border climate targets, AI governance, and trade rules in plenary session.",
      "credit": "Diliff",
      "license": "CC BY-SA 3.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:European_Parliament_Strasbourg_Hemicycle_-_Diliff.jpg"
    },
    {
      "id": "05",
      "src": "./assets/archive/05-icj-hague.webp",
      "shortLoc": "ICJ · The Hague",
      "year": "2009",
      "theme": "International Law",
      "title": "International Court of Justice — Great Hall of Justice",
      "origin": "Peace Palace · The Hague, Netherlands",
      "story": "Fifteen elected judges hear sovereign states present legal arguments on international law, treaty interpretation, and sovereignty.",
      "credit": "Lybil BER",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Grand_Hall_de_Justice_de_Palais_de_La_Paix_%C3%A0_La_Haye_Pays-Bas.jpg"
    },
    {
      "id": "06",
      "src": "./assets/archive/06-geneva-flags.webp",
      "shortLoc": "Palais des Nations · Geneva",
      "year": "2014",
      "theme": "Global Cooperation",
      "title": "Allée des Nations at the UN Office in Geneva",
      "origin": "Palais des Nations · Geneva, Switzerland",
      "story": "Member-state flags line the approach to the Palais des Nations—hub of humanitarian diplomacy, disarmament talks, and global health.",
      "credit": "Tom Page",
      "license": "CC BY-SA 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:United_Nations_Flags_-_cropped.jpg"
    },
    {
      "id": "07",
      "src": "./assets/archive/07-peace-palace.webp",
      "shortLoc": "Peace Palace · The Hague",
      "year": "1913–",
      "theme": "International Institutions",
      "title": "The Peace Palace (Vredespaleis)",
      "origin": "Carnegieplein · The Hague, Netherlands",
      "story": "Inaugurated in 1913 as a permanent architectural home for international arbitration and the peaceful settlement of global disputes.",
      "credit": "Thomas Wolf (foto-tw.de)",
      "license": "CC BY-SA 3.0 DE",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Friedenspalast_Den_Haag_(100MP).jpg"
    },
    {
      "id": "08",
      "src": "./assets/archive/08-g7-apulia.webp",
      "shortLoc": "G7 Summit · Apulia",
      "year": "2024",
      "theme": "Development & Climate",
      "title": "G7 Summit Working Session on Africa, Climate & Development",
      "origin": "Borgo Egnazia · Apulia, Italy",
      "story": "Heads of state gather around an olive-wood table to coordinate infrastructure financing, clean-energy transitions, and global development.",
      "credit": "The White House",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:President_Joe_Biden_at_Working_Session_I,_Africa,_Climate_Change_and_Development_at_the_2024_G7_Summit,_June_13,_2024,_at_Borgo_Egnazia_in_Apulia,_Italy.jpg"
    },
    {
      "id": "09",
      "src": "./assets/archive/09-g20-brisbane.webp",
      "shortLoc": "G20 · Brisbane",
      "year": "2014",
      "theme": "Economic Policy",
      "title": "9th G20 Summit Leaders’ Roundtable",
      "origin": "Brisbane Convention Centre · Brisbane, Australia",
      "story": "Leaders of the world’s major economies meet face-to-face on fiscal resilience, cross-border trade, and macroeconomic stability.",
      "credit": "Aman Sharma / European Union",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Round_table_during_the_G20_Summit_in_Australia_-_2014_(03).jpg"
    },
    {
      "id": "10",
      "src": "./assets/archive/10-nato-council.webp",
      "shortLoc": "NATO 75 · Washington",
      "year": "2024",
      "theme": "Collective Security",
      "title": "North Atlantic Council — 75th Anniversary Summit",
      "origin": "Walter E. Washington Convention Center · Washington, D.C., USA",
      "story": "Allied heads of state convene at the North Atlantic Council to align deterrence strategy, cyber resilience, and collective defense.",
      "credit": "The White House",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Joe_Biden_attends_a_meeting_of_the_North_Atlantic_Council,_2024-07-10_(53849051323).jpg"
    },
    {
      "id": "11",
      "src": "./assets/archive/11-nato-wales.webp",
      "shortLoc": "NAC · Wales, UK",
      "year": "2014",
      "theme": "Alliance Diplomacy",
      "title": "North Atlantic Council Plenary Table",
      "origin": "Celtic Manor · Newport, Wales, United Kingdom",
      "story": "Ministers and defense advisors consult directly across the alliance plenary table during the 2014 Wales Summit.",
      "credit": "Glenn Fawcett / U.S. Department of Defense",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Meeting_of_the_North_Atlantic_Council_140905-D-NI589-189.jpg"
    },
    {
      "id": "12",
      "src": "./assets/archive/12-asean-singapore.webp",
      "shortLoc": "EAS / ASEAN · Singapore",
      "year": "2018",
      "theme": "Indo-Pacific Diplomacy",
      "title": "East Asia Summit Foreign Ministers’ Meeting",
      "origin": "Singapore Expo · Singapore",
      "story": "Eighteen Indo-Pacific delegations gather under the ASEAN framework to negotiate regional trade, maritime norms, and strategic stability.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Secretary_of_State_Michael_R._Pompeo_attends_the_East_Asia_Summit_(43834928811).jpg"
    },
    {
      "id": "13",
      "src": "./assets/archive/13-au-addis-ababa.webp",
      "shortLoc": "AU Summit · Addis Ababa",
      "year": "2009",
      "theme": "Regional Integration",
      "title": "12th African Union Summit Plenary Hall",
      "origin": "UN Conference Centre · Addis Ababa, Ethiopia",
      "story": "African heads of state and diplomatic delegations fill the plenary hall in Addis Ababa to debate continental trade, infrastructure, and peace.",
      "credit": "Jesse B. Awalt / U.S. Navy",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Plenary_Hall,_12th_AU_Summit,_090202-N-0506A-291.jpg"
    },
    {
      "id": "14",
      "src": "./assets/archive/14-iaea-vienna.webp",
      "shortLoc": "IAEA · Vienna",
      "year": "2024",
      "theme": "Science & Safeguards",
      "title": "IAEA 1717th Board of Governors Press Briefing",
      "origin": "Vienna International Centre · Vienna, Austria",
      "story": "Technical diplomacy in action: international nuclear safeguards, energy security, and verification briefings before the global press corps.",
      "credit": "IAEA Imagebank",
      "license": "CC BY 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:IAEA_1717th_Board_of_Governors_Meeting_Press_Conference,_Vienna,_June_2024,_64.jpg"
    },
    {
      "id": "15",
      "src": "./assets/archive/15-arms-trade-treaty.webp",
      "shortLoc": "Treaty Event · UN HQ",
      "year": "2013",
      "theme": "Treaty Making",
      "title": "Arms Trade Treaty Signing Ceremony",
      "origin": "United Nations Treaty Event · New York, USA",
      "story": "Formal treaty accession at UN Headquarters establishing international standards regulating the cross-border trade in conventional arms.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Secretary_Kerry_Participates_in_the_Arms_Trade_Treaty_Signing_Ceremony_(9936186524).jpg"
    },
    {
      "id": "16",
      "src": "./assets/archive/16-palau-compact.webp",
      "shortLoc": "Pacific Compact · 2023",
      "year": "2023",
      "theme": "Bilateral Agreements",
      "title": "Compact Review Agreement Signing with Palau",
      "origin": "Port Moresby · Pacific Regional Diplomacy",
      "story": "Small-island diplomacy on the global stage: bilateral talks addressing climate resilience, ocean stewardship, and economic partnership.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Secretary_Blinken_Participates_in_a_Compact_Review_Agreement_Signing_Ceremony_with_Palau.jpg"
    },
    {
      "id": "17",
      "src": "./assets/archive/17-us-mexico-dialogue.webp",
      "shortLoc": "Bilateral · Washington",
      "year": "2022",
      "theme": "Cross-Border Policy",
      "title": "U.S.–Mexico High-Level Security Dialogue",
      "origin": "U.S. Department of State · Washington, D.C., USA",
      "story": "Senior delegations face each other across the negotiating table on shared border security, public health, and regional economic cooperation.",
      "credit": "U.S. Department of Homeland Security",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:DHS_Secretary_Mayorkas_in_U.S.-Mexico_High-Level_Security_Dialogue_in_Washington,_D.C.,_October_13,_2022_-_10.jpg"
    },
    {
      "id": "18",
      "src": "./assets/archive/18-imf-annual-meeting.webp",
      "shortLoc": "IMF · Annual Meetings",
      "year": "2003",
      "theme": "Global Finance",
      "title": "African Finance Ministers IMF Press Briefing",
      "origin": "IMF / World Bank Annual Meetings · 2003",
      "story": "Finance ministers address international correspondents on sovereign debt reform, growth targets, and equitable fiscal policy.",
      "credit": "International Monetary Fund",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:African_Finance_Ministers_IMF_2003_Annual_Meeting_-_IMF_62ph030920GH.jpg"
    },
    {
      "id": "19",
      "src": "./assets/archive/19-world-bank-archive.webp",
      "shortLoc": "World Bank · Washington",
      "year": "1966",
      "theme": "Archival Diplomacy",
      "title": "World Bank Group Annual Meetings (1966 Archive)",
      "origin": "World Bank Headquarters · Washington, D.C., USA",
      "story": "Post-independence economic diplomacy captured on monochrome press film during the 1966 Bretton Woods institutional meetings.",
      "credit": "World Bank Group Archive",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Mr._Alexandre_Banza,_Governor_for_Central_African_Republic_(left),_Annual_Meetings,_Washington,_D.C.,_USA.jpg"
    },
    {
      "id": "20",
      "src": "./assets/lowell-house-hires.jpg",
      "shortLoc": "IPC Finals · Cambridge",
      "year": "2027",
      "theme": "IPC 2027 Finals",
      "title": "Cambridge, Massachusetts — IPC Spring 2027 Finals",
      "origin": "Cambridge, Massachusetts, USA",
      "story": "Where top high school and collegiate finalists from around the world convene to present policy briefs and face executive Q&A.",
      "credit": "International Policy Conference Archive",
      "license": "IPC Archive",
      "sourceUrl": "#stages"
    },
    {
      "id": "21",
      "src": "./assets/archive/21-g7-biarritz.webp",
      "shortLoc": "G7 Biarritz · France",
      "year": "2019",
      "theme": "G7 Diplomacy",
      "title": "45th G7 Summit Leaders’ Roundtable",
      "origin": "Hôtel du Palais · Biarritz, France",
      "story": "Heads of state meet around the sunlit Biarritz roundtable on global trade, climate financing, and international security.",
      "credit": "The White House",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:-G7Biarritz_(48616362963).jpg"
    },
    {
      "id": "22",
      "src": "./assets/archive/22-wha-geneva.webp",
      "shortLoc": "WHA · Geneva",
      "year": "2011",
      "theme": "Global Health Policy",
      "title": "World Health Assembly Opening Plenary",
      "origin": "Palais des Nations · Geneva, Switzerland",
      "story": "Health ministers and delegations from 194 WHO member states convene on pandemic preparedness and universal health systems.",
      "credit": "U.S. Mission Geneva",
      "license": "CC BY 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Secretary_Sebelius_Listening_to_Opening_Plenary_of_World_Health_Assembly.jpg"
    },
    {
      "id": "23",
      "src": "./assets/archive/23-who-plenary-1970.webp",
      "shortLoc": "WHO Archive · 1970",
      "year": "1970",
      "theme": "Global Health History",
      "title": "World Health Organization Plenary Handshake (1970)",
      "origin": "World Health Organization · Geneva, Switzerland",
      "story": "Delegates greet across continents during the 1970 World Health Assembly—the era of the global smallpox eradication campaign.",
      "credit": "WHO Official Photographer",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:WHO_Plenary.jpg"
    },
    {
      "id": "24",
      "src": "./assets/archive/24-osce-ministerial.webp",
      "shortLoc": "OSCE · Europe",
      "year": "2018",
      "theme": "European Security",
      "title": "OSCE Ministerial Council Bilateral Meeting",
      "origin": "Organization for Security and Co-operation in Europe",
      "story": "European foreign ministers meet under the OSCE framework to advance conflict prevention and regional diplomatic dialogue.",
      "credit": "Austrian Federal Ministry for European & International Affairs",
      "license": "CC BY 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Au%C3%9Fenministerin_Karin_Kneissl_nimmt_am_Ministerial_Council_Meeting_der_OECD_in_Paris_teil._(41767474884).jpg"
    },
    {
      "id": "25",
      "src": "./assets/archive/25-osce-vienna-briefing.webp",
      "shortLoc": "OSCE · Vienna",
      "year": "2017",
      "theme": "Security Diplomacy",
      "title": "OSCE Ministerial Council Press Briefing",
      "origin": "Hofburg Congress Center · Vienna, Austria",
      "story": "Joint diplomatic briefing at the 24th OSCE Ministerial Council addressing European security architecture and multilateral norms.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Secretary_Tillerson_and_Austrian_Foreign_Minister_Kurz_Address_the_Media_at_OSCE_in_Austria_(25021183488).jpg"
    },
    {
      "id": "26",
      "src": "./assets/archive/26-apec-roundtable.webp",
      "shortLoc": "APEC · Asia-Pacific",
      "year": "2012",
      "theme": "Asia-Pacific Trade",
      "title": "APEC Economic Leaders’ First Working Session",
      "origin": "Russky Island · Vladivostok, Pacific Rim",
      "story": "Leaders of the 21 Asia-Pacific Economic Cooperation economies gather in plenary on supply-chain integration and regional trade.",
      "credit": "APEC Official Pool",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:APEC_summit_2012_first_working_session.jpeg"
    },
    {
      "id": "27",
      "src": "./assets/archive/27-lisbon-council.webp",
      "shortLoc": "EU Policy · Brussels",
      "year": "2011",
      "theme": "Economic Governance",
      "title": "European Policy & Economic Governance Summit",
      "origin": "Lisbon Council · Brussels, Belgium",
      "story": "European policymakers and economists debate fiscal integration, competitiveness, and institutional reform across the European Union.",
      "credit": "European Commission Audiovisual Service",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Participation_of_Jos%C3%A9_Manuel_Barroso,_President_of_the_EC,_at_the_%22Europe_2020_Summit%22_(P-018543-00-10).jpg"
    },
    {
      "id": "28",
      "src": "./assets/archive/28-munich-security.webp",
      "shortLoc": "MSC · Munich",
      "year": "2020",
      "theme": "Conflict Resolution",
      "title": "Munich Security Conference Diplomatic Panel",
      "origin": "Hotel Bayerischer Hof · Munich, Germany",
      "story": "Heads of state engage in direct onstage dialogue at the Munich Security Conference on regional conflict resolution and diplomacy.",
      "credit": "Munich Security Conference / Official Pool",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Panel_discussions_on_Armenia-Azerbaijan_Nagorno-Karabakh_conflict_held_as_part_of_Munich_Security_Conference_01.jpg"
    },
    {
      "id": "29",
      "src": "./assets/archive/29-au-50th-summit.webp",
      "shortLoc": "AU 50th · Addis Ababa",
      "year": "2013",
      "theme": "African Diplomacy",
      "title": "50th Anniversary African Union Summit Plenary",
      "origin": "African Union Headquarters · Addis Ababa, Ethiopia",
      "story": "Continental leaders fill the Nelson Mandela Plenary Hall marking five decades of African multilateral diplomacy and integration.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:50th_Anniversary_African_Union_Summit_in_Addis_Ababa,_Ethiopia.jpg"
    },
    {
      "id": "30",
      "src": "./assets/archive/30-asean-brunei.webp",
      "shortLoc": "ASEAN · Brunei",
      "year": "2013",
      "theme": "Southeast Asia",
      "title": "23rd ASEAN Summit Leaders’ Gathering",
      "origin": "Bandar Seri Begawan · Brunei Darussalam",
      "story": "Leaders of Southeast Asian nations and dialogue partners convene to coordinate regional economic integration and maritime stability.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Secretary_Kerry_Poses_With_ASEAN_Leaders_(10174841165).jpg"
    },
    {
      "id": "31",
      "src": "./assets/archive/31-oas-lima.webp",
      "shortLoc": "OAS · Lima, Peru",
      "year": "2022",
      "theme": "Hemispheric Policy",
      "title": "52nd Organization of American States General Assembly",
      "origin": "Lima Convention Centre · Lima, Peru",
      "story": "Foreign ministers from across the Americas negotiate democratic governance, migration policy, and human rights frameworks.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Secretary_Blinken_Attends_the_Organization_of_American_States_General_Assembly_Opening_Session_(52410072224).jpg"
    },
    {
      "id": "32",
      "src": "./assets/archive/32-unhrc-geneva.webp",
      "shortLoc": "UNHRC · Geneva",
      "year": "2015",
      "theme": "Human Rights",
      "title": "UN Human Rights Council Chamber (Room XX)",
      "origin": "Palais des Nations · Geneva, Switzerland",
      "story": "Diplomats and civil-society representatives meet beneath Miquel Barceló’s polychrome dome to debate global human rights standards.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Secretary_Kerry_Concludes_Address_to_Delegates_at_the_UN_Human_Rights_Council_Chamber_in_Switzerland_(16071591574).jpg"
    },
    {
      "id": "33",
      "src": "./assets/archive/33-unesco-paris.webp",
      "shortLoc": "UNESCO · Paris",
      "year": "2021",
      "theme": "Education & Culture",
      "title": "UNESCO 41st General Conference Plenary",
      "origin": "UNESCO Headquarters · Paris, France",
      "story": "Member-state flags frame the UNESCO plenary as global leaders address education equity, science ethics, and cultural heritage.",
      "credit": "Press Information Department (Bangladesh)",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sheikh_Hasina_Addresses_UNESCO_General_Conference,_Paris,_2021-11-11_(PID-0026542).jpg"
    },
    {
      "id": "34",
      "src": "./assets/archive/34-iaea-general-conf.webp",
      "shortLoc": "IAEA 68th · Vienna",
      "year": "2024",
      "theme": "Nuclear Policy",
      "title": "68th IAEA General Conference Plenary Session",
      "origin": "Vienna International Centre · Vienna, Austria",
      "story": "Diplomats and nuclear scientists assemble in Vienna to negotiate peaceful atomic energy standards and global non-proliferation.",
      "credit": "IAEA Imagebank",
      "license": "CC BY 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:68th_IAEA_General_Conference,_Day_5,_03.jpg"
    },
    {
      "id": "35",
      "src": "./assets/archive/35-summit-americas.webp",
      "shortLoc": "Americas Summit · LA",
      "year": "2022",
      "theme": "Regional Cooperation",
      "title": "9th Summit of the Americas Opening Plenary",
      "origin": "Los Angeles Convention Center · USA",
      "story": "Hemispheric heads of state convene beneath the flags of the Americas to coordinate clean energy, health resilience, and trade.",
      "credit": "Fernando Ramirez",
      "license": "CC BY 3.0 CL",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Gabriel_Boric_at_the_1st_plenary_session_of_the_9th_Summit_of_the_Americas_(3).jpg"
    },
    {
      "id": "36",
      "src": "./assets/archive/36-americas-delegates.webp",
      "shortLoc": "Americas · Plenary",
      "year": "2022",
      "theme": "Multilateral Debate",
      "title": "Summit of the Americas Leaders’ Delegation Bench",
      "origin": "9th Summit of the Americas · Los Angeles, USA",
      "story": "Latin American and North American delegations listen closely during plenary interventions on regional economic development.",
      "credit": "Alex Ibañez",
      "license": "CC BY 3.0 CL",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Gabriel_Boric_on_the_second_plenary_session_of_the_9th_Summit_of_the_Americas_(4).jpg"
    },
    {
      "id": "37",
      "src": "./assets/archive/37-us-slovenia-treaty.webp",
      "shortLoc": "Bilateral · Signing",
      "year": "2009",
      "theme": "Treaty Diplomacy",
      "title": "U.S.–Slovenia Bilateral Agreement Signing",
      "origin": "Treaty Signing Table · Diplomatic Archive",
      "story": "Senior diplomats formally sign a bilateral accord strengthening scientific, legal, and transatlantic cooperation.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:U.S.-Slovenia_Signing_Ceremony_(3791008140).jpg"
    },
    {
      "id": "38",
      "src": "./assets/archive/38-us-brazil-briefing.webp",
      "shortLoc": "U.S.–Brazil · Brasilia",
      "year": "2016",
      "theme": "Bilateral Relations",
      "title": "U.S.–Brazil Ministerial Joint Press Statement",
      "origin": "Diplomatic Reception Hall · Bilateral Summit",
      "story": "Foreign ministers of the Americas’ two largest economies brief the press following talks on trade, climate, and education.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:John_Kerry_Stands_With_Brazil_Foreign_Minister_Serra_Following_a_Bilateral_Meeting_(28176598073).jpg"
    },
    {
      "id": "39",
      "src": "./assets/archive/39-us-france-paris.webp",
      "shortLoc": "Quai d’Orsay · Paris",
      "year": "2016",
      "theme": "Transatlantic Talks",
      "title": "U.S.–France High-Level Diplomatic Negotiations",
      "origin": "Ministry of Foreign Affairs · Paris, France",
      "story": "Transatlantic diplomatic teams sit across the negotiating table in Paris to coordinate multilateral peacekeeping and climate action.",
      "credit": "U.S. Department of State",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Secretary_Kerry_and_French_Foreign_Minister_Jean-_Marc_Ayrault_Attend_a_Bilateral_Meeting_as_They_Both_Attend_NATO_(31446128386).jpg"
    },
    {
      "id": "40",
      "src": "./assets/archive/40-wef-panel.webp",
      "shortLoc": "WEF · Global Economy",
      "year": "2008",
      "theme": "Trade & Governance",
      "title": "World Economic Forum — Global Trade Leaders Panel",
      "origin": "World Economic Forum Annual Meeting",
      "story": "International trade commissioners and industry leaders debate globalization, industrial policy, and cross-border market rules.",
      "credit": "World Economic Forum",
      "license": "CC BY-SA 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Flickr_-_World_Economic_Forum_-_Thomas_Enders,_Peter_Mandelson,_Jiang_Jianqing,_Stephen_Roach_-_Annual_Meeting_of_the_New_Champions_Tianjin_2008.jpg"
    },
    {
      "id": "41",
      "src": "./assets/archive/41-nordic-council.webp",
      "shortLoc": "Nordic Council · Helsinki",
      "year": "2012",
      "theme": "Parliamentary Diplomacy",
      "title": "Nordic Council Plenary Session in Helsinki",
      "origin": "Parliament House (Eduskunta) · Helsinki, Finland",
      "story": "Legislators from Denmark, Finland, Iceland, Norway, and Sweden coordinate cross-border climate, welfare, and energy policy.",
      "credit": "Benjamin Suomela / Norden",
      "license": "CC BY 2.5 DK",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Plenum_toppmotet._Nordiska_Radet_session_i_Helsingfors_29.10.2012.jpg"
    },
    {
      "id": "42",
      "src": "./assets/archive/42-eu-presidency.webp",
      "shortLoc": "EU Council · Strasbourg",
      "year": "2017",
      "theme": "European Integration",
      "title": "Council of the EU Presidency Address at Parliament",
      "origin": "European Parliament · Strasbourg, France",
      "story": "Rotating EU presidency leaders present digital-single-market and environmental policy priorities to elected parliamentarians.",
      "credit": "EU2017EE Estonian Presidency",
      "license": "CC BY 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:PM_J%C3%BCri_Ratas_presenting_the_EU2017EE_porgamme_at_the_European_Parliament_IMG_9199_(35692732976).jpg"
    },
    {
      "id": "43",
      "src": "./assets/archive/43-palais-assembly.webp",
      "shortLoc": "UN Assembly · Geneva",
      "year": "2009",
      "theme": "Multilateral Architecture",
      "title": "Palais des Nations Assembly Hall",
      "origin": "United Nations Office · Geneva, Switzerland",
      "story": "The monumental modernist Assembly Hall in Geneva, constructed in the 1930s for the League of Nations and still hosting global treaties.",
      "credit": "Stéphane Magnenat",
      "license": "CC BY-SA 3.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Assembly_Hall_UN_Geneva_centered.JPG"
    },
    {
      "id": "44",
      "src": "./assets/archive/44-icty-hague.webp",
      "shortLoc": "Tribunal · The Hague",
      "year": "2013",
      "theme": "International Justice",
      "title": "UN International Criminal Tribunal Courtroom",
      "origin": "ICTY · The Hague, Netherlands",
      "story": "Multilingual courtroom technology enabling transparent international humanitarian law proceedings and global accountability.",
      "credit": "UN International Criminal Tribunal (ICTY)",
      "license": "CC BY 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:ICTY_Court_Room_Technology.jpg"
    },
    {
      "id": "45",
      "src": "./assets/archive/45-helsinki-1975.webp",
      "shortLoc": "Helsinki · 1975",
      "year": "1975",
      "theme": "Historic Détente",
      "title": "Conference on Security and Co-operation in Europe (1975)",
      "origin": "Finlandia Hall · Helsinki, Finland",
      "story": "Thirty-five nations sign the historic 1975 Helsinki Final Act establishing Cold War détente, territorial dialogue, and human-rights norms.",
      "credit": "Gerald R. Ford Presidential Library",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:President_Gerald_R._Ford_and_Soviet_General_Secretary_Leonid_Brezhnev_Raise_Their_Glasses_in_a_Toast_Following_the_Signing_of_the_Final_Act_of_the_Conference_on_Security_and_Cooperation_in_Europe_(CSCE),_in_Helsi(...)_-_NARA_-_23898499.jpg"
    },
    {
      "id": "46",
      "src": "./assets/archive/46-camp-david-1978.webp",
      "shortLoc": "Camp David · 1978",
      "year": "1978",
      "theme": "Peace Accords",
      "title": "Signing of the Camp David Accords (1978)",
      "origin": "The White House · Washington, D.C., USA",
      "story": "Anwar Sadat, Jimmy Carter, and Menachem Begin clasp hands after thirteen days of intensive summit mediation that forged a landmark peace treaty.",
      "credit": "White House Photographic Office",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Anwar_Sadat_Jimmy_Carter_Menachem_Begin_sign_Camp_David_Accords-1978.jpg"
    },
    {
      "id": "47",
      "src": "./assets/archive/47-bretton-woods.webp",
      "shortLoc": "Bretton Woods · NH",
      "year": "1944–",
      "theme": "Monetary History",
      "title": "The Gold Room — 1944 Bretton Woods Conference Table",
      "origin": "Mount Washington Hotel · Bretton Woods, New Hampshire",
      "story": "The historic table where delegates from 44 Allied nations designed the postwar international monetary system, IMF, and World Bank.",
      "credit": "Barry Livingstone",
      "license": "CC BY-SA 3.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:The_Gold_Room_-_Bretton_Woods_Mount_Washington_Hotel.jpg"
    },
    {
      "id": "48",
      "src": "./assets/archive/48-g20-new-delhi.webp",
      "shortLoc": "G20 · New Delhi",
      "year": "2023",
      "theme": "Global South Diplomacy",
      "title": "G20 New Delhi Summit — Raj Ghat Tribute",
      "origin": "Raj Ghat · New Delhi, India",
      "story": "World leaders walk together at Mahatma Gandhi’s memorial during India’s 2023 G20 Presidency, which welcomed the African Union as a permanent member.",
      "credit": "Dati Bendo / European Commission",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Joe_Biden,_Rishi_Sunak_and_Ursula_von_der_Leyen_at_G20_New_Delhi_-_2023_(P061767-496339).jpg"
    },
    {
      "id": "49",
      "src": "./assets/archive/49-wto-eu-delhi.webp",
      "shortLoc": "WTO & EU · New Delhi",
      "year": "2023",
      "theme": "Global Trade",
      "title": "WTO Director-General & European Commission Bilateral",
      "origin": "Bharat Mandapam · New Delhi, India",
      "story": "WTO chief Ngozi Okonjo-Iweala and European Commission President Ursula von der Leyen discuss equitable multilateral trade rules.",
      "credit": "Dati Bendo / European Commission",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ngozi_Okonjo-Iweala_and_Ursula_von_der_Leyen_at_G20_New_Delhi_-_2023_(P061767-458288).jpg"
    },
    {
      "id": "50",
      "src": "./assets/archive/50-g7-hiroshima.webp",
      "shortLoc": "G7 · Hiroshima",
      "year": "2023",
      "theme": "Peace & Disarmament",
      "title": "49th G7 Summit Leaders’ Session in Hiroshima",
      "origin": "Grand Prince Hotel · Hiroshima, Japan",
      "story": "G7 leaders meet in Hiroshima to reaffirm nuclear disarmament commitments, supply-chain security, and clean-energy transition.",
      "credit": "Dati Bendo / European Commission",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:49th_G7_summit_in_Hiroshima_-_2023_-_P061116-863483.jpg"
    },
    {
      "id": "51",
      "src": "./assets/archive/51-cop26-glasgow.webp",
      "shortLoc": "COP26 · Glasgow",
      "year": "2021",
      "theme": "Climate Governance",
      "title": "UN Climate Change Conference (COP26) Corridors",
      "origin": "Scottish Event Campus · Glasgow, United Kingdom",
      "story": "Climate negotiators and scientific agencies navigate hallway diplomacy between formal plenary sessions on the Glasgow Climate Pact.",
      "credit": "IAEA Imagebank",
      "license": "CC BY 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:COP26_Behind_the_Scenes_(cop26_0116)_(51646555301).jpg"
    },
    {
      "id": "52",
      "src": "./assets/archive/52-cop28-dubai.webp",
      "shortLoc": "COP28 · Dubai",
      "year": "2023",
      "theme": "Climate Diplomacy",
      "title": "UN Climate Conference (COP28) Bilateral Talks",
      "origin": "Expo City · Dubai, United Arab Emirates",
      "story": "Environmental ministers hold bilateral negotiations at COP28 on methane reduction, climate finance, and loss-and-damage funds.",
      "credit": "U.S. Environmental Protection Agency",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:United_States_EPA_visit_to_COP28_in_Dubai,_December_2023_-_19.jpg"
    },
    {
      "id": "53",
      "src": "./assets/archive/53-un-east-river.webp",
      "shortLoc": "UN HQ · East River",
      "year": "2012",
      "theme": "Global Institutions",
      "title": "United Nations Headquarters Along the East River",
      "origin": "First Avenue · New York, USA",
      "story": "The iconic modernist Secretariat tower designed by an international team of architects stands as an enduring skyline symbol of multilateralism.",
      "credit": "Ian Pudsey",
      "license": "CC BY 3.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:The_United_Nations_From_The_East_River_-_panoramio.jpg"
    },
    {
      "id": "54",
      "src": "./assets/archive/54-wto-geneva.webp",
      "shortLoc": "WTO · Geneva",
      "year": "2011",
      "theme": "Trade Policy",
      "title": "8th World Trade Organization Ministerial Conference",
      "origin": "CICG · Geneva, Switzerland",
      "story": "Trade ministers from across the globe convene in Geneva to negotiate tariff frameworks, dispute settlement, and global commerce.",
      "credit": "U.S. Mission Geneva",
      "license": "CC BY 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:WTO_Ministerial_Conference_December_2011.jpg"
    },
    {
      "id": "55",
      "src": "./assets/archive/55-un-trusteeship.webp",
      "shortLoc": "UN Trusteeship · NY",
      "year": "2006",
      "theme": "Diplomatic Architecture",
      "title": "UN Trusteeship Council Chamber",
      "origin": "United Nations Headquarters · New York, USA",
      "story": "Finn Juhl’s warm Nordic architectural chamber at UN Headquarters, originally built to oversee decolonization and self-determination.",
      "credit": "Patrick Gruban",
      "license": "CC BY-SA 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:UN_-_Trusteeship_Council.jpg"
    },
    {
      "id": "56",
      "src": "./assets/archive/56-sf-opera-1945.webp",
      "shortLoc": "UN Charter · San Francisco",
      "year": "1945–",
      "theme": "Founding Treaties",
      "title": "War Memorial Opera House — Birthplace of the UN Charter",
      "origin": "Civic Center · San Francisco, California, USA",
      "story": "The neoclassical hall where 50 nations negotiated and signed the United Nations Charter in June 1945 after World War II.",
      "credit": "Ken Lund",
      "license": "CC BY-SA 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:San_Francisco_War_Memorial_and_Performing_Arts_Center,_San_Francisco,_California_(10754272665).jpg"
    },
    {
      "id": "57",
      "src": "./assets/archive/57-g20-rome.webp",
      "shortLoc": "G20 · Rome",
      "year": "2021",
      "theme": "Global Cooperation",
      "title": "G20 Rome Summit — “People, Planet, Prosperity”",
      "origin": "La Nuvola Convention Center · Rome, Italy",
      "story": "G20 heads of state stand alongside frontline health and civic responders during post-pandemic global recovery negotiations.",
      "credit": "Casa Rosada (Argentina)",
      "license": "CC BY 2.5 AR",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:G20_foto_de_familia_2021.jpg"
    },
    {
      "id": "58",
      "src": "./assets/archive/58-g20-bali.webp",
      "shortLoc": "G20 · Bali",
      "year": "2022",
      "theme": "Major-Power Diplomacy",
      "title": "U.S.–China Leaders’ Bilateral Meeting at G20 Bali",
      "origin": "Nusa Dua · Bali, Indonesia",
      "story": "High-level great-power diplomacy in Bali establishing guardrails for bilateral competition, climate cooperation, and global stability.",
      "credit": "The White House",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:President_Biden_met_with_President_Xi_of_the_PRC_before_the_2022_G20_Bali_Summit.jpg"
    },
    {
      "id": "59",
      "src": "./assets/archive/59-davos-wef.webp",
      "shortLoc": "WEF · Davos",
      "year": "2010",
      "theme": "Economic Forum",
      "title": "World Economic Forum Congress Centre in Davos",
      "origin": "Davos · Graubünden, Switzerland",
      "story": "The Alpine timber congress hall where policymakers, central bankers, and civil-society leaders gather each winter on global risks.",
      "credit": "World Economic Forum",
      "license": "CC BY-SA 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Davos_Congress_Centre_-_Main_Access.jpg"
    },
    {
      "id": "60",
      "src": "./assets/archive/60-unea-nairobi.webp",
      "shortLoc": "UNEA-6 · Nairobi",
      "year": "2024",
      "theme": "Environmental Law",
      "title": "UN Environment Assembly (UNEA-6) Delegates",
      "origin": "UN Office at Nairobi (UNON) · Kenya",
      "story": "Representing island nations and developing economies, delegates debate plastic-pollution treaties and climate resilience in Nairobi.",
      "credit": "Press Information Department (Bangladesh)",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Saber_Hossain_Chowdhury,_Minister_of_Environment_Forest_and_Climate_Change,_speaks_at_UN_Environment_Assembly_Nairobi_2024-03-01_(PID-0010277).jpg"
    },
    {
      "id": "61",
      "src": "./assets/archive/61-imf-hq.webp",
      "shortLoc": "IMF HQ · Washington",
      "year": "2025",
      "theme": "International Finance",
      "title": "International Monetary Fund Headquarters",
      "origin": "19th Street NW · Washington, D.C., USA",
      "story": "Headquarters of the 191-member Bretton Woods institution coordinating macroeconomic surveillance, sovereign lending, and monetary stability.",
      "credit": "International Monetary Fund",
      "license": "Public Domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:IMF_building_HR.jpg"
    }
  ];

  // ─── 1. Full-Screen Edge-to-Edge 2008 Beijing Olympics Kinetic 3D Movable-Type Matrix ───
  const IPC_CORE = [
    "###.####.####",
    ".#..#..#.#..#",
    ".#..#..#.#...",
    ".#..####.#...",
    ".#..#....#...",
    ".#..#....#..#",
    "###.#....####"
  ];

  const gridEl = document.getElementById("mt-grid");
  const planeEl = document.getElementById("mt-plane");
  const stageEl = document.getElementById("mt-stage");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (gridEl && planeEl) {
    const isPortrait = window.innerWidth <= 720;
    const COLS = isPortrait ? 17 : 19;
    const ROWS = isPortrait ? 17 : 11;
    const offC = isPortrait ? 2 : 3;
    const offR = isPortrait ? 5 : 2;

    gridEl.style.setProperty("--mt-cols", String(COLS));
    gridEl.style.setProperty("--mt-rows", String(ROWS));

    let hoveredBlock = null;
    let pointerGridX = -99;
    let pointerGridY = -99;
    const baseTiltX = isPortrait ? 13 : 17;
    let targetTiltX = baseTiltX;
    let targetTiltY = 0;
    let curTiltX = baseTiltX;
    let curTiltY = 0;
    const blocks = [];

    const isLetterCell = (r, c) => {
      const lr = r - offR;
      const lc = c - offC;
      if (lr < 0 || lr >= IPC_CORE.length || lc < 0 || lc >= IPC_CORE[0].length) return false;
      return IPC_CORE[lr][lc] === "#";
    };

    // Anti-redundancy 2D placer:
    // 1) All 41 elevated I·P·C blocks get 41 completely distinct photos (ZERO duplicates inside I·P·C!)
    // 2) Recessed background blocks pick the photo maximizing minimum 2D distance to any existing copy
    const assigned = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
    const placedCoords = Array.from({ length: ARCHIVE_PRINTS.length }, () => []);
    let letterSlotIdx = 0;

    // Shuffled deterministic order for I·P·C so visual themes mix organically across the 3 letters
    const letterOrder = ARCHIVE_PRINTS.map((_, i) => (i * 17 + 3) % ARCHIVE_PRINTS.length);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isLetterCell(r, c)) {
          const pIdx = letterOrder[letterSlotIdx++];
          assigned[r][c] = pIdx;
          placedCoords[pIdx].push([r, c]);
        }
      }
    }

    // Place remaining recessed background blocks (preferring unused photos 41..60 first, then max-min-distance)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (assigned[r][c] !== -1) continue;
        let bestIdx = 0;
        let bestScore = -1;
        for (let pIdx = 0; pIdx < ARCHIVE_PRINTS.length; pIdx++) {
          const coords = placedCoords[pIdx];
          if (coords.length === 0) {
            bestIdx = pIdx;
            bestScore = 1e9;
            break;
          }
          let minD = 1e9;
          for (let k = 0; k < coords.length; k++) {
            const d = Math.hypot(coords[k][0] - r, coords[k][1] - c);
            if (d < minD) minD = d;
          }
          // Slight tie-breaker favoring fewer total occurrences
          const score = minD * 10 - coords.length * 0.8 + ((pIdx * 13 + r * 5 + c) % 7) * 0.01;
          if (score > bestScore) {
            bestScore = score;
            bestIdx = pIdx;
          }
        }
        assigned[r][c] = bestIdx;
        placedCoords[bestIdx].push([r, c]);
      }
    }

    const scale = isPortrait ? 0.56 : 1;
    const computeTargetZ = (b, sec) => {
      let h;
      if (b.isLetter) {
        const breath = Math.sin(sec * 1.35 - b.c * 0.4 + b.r * 0.25) * 6.5;
        h = 80 + breath;
      } else {
        const sea = (Math.sin(sec * 1.15 - b.diag * 0.46) + 1) * 7.5;
        h = 6 + sea;
      }

      if (pointerGridX >= 0) {
        const d = Math.hypot(b.c - pointerGridX, b.r - pointerGridY);
        if (d === 0) {
          h = Math.max(h, 96);
        } else if (d < 2.6) {
          const boost = (1 - d / 2.6) * 34;
          h = Math.max(h, h + boost * 0.65);
        }
      }

      return Math.max(4, h * scale);
    };

    const frag = document.createDocumentFragment();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const isLetter = isLetterCell(r, c);
        const frontIdx = assigned[r][c];
        const backIdx = (frontIdx + 23) % ARCHIVE_PRINTS.length;
        const frontItem = ARCHIVE_PRINTS[frontIdx];
        const backItem = ARCHIVE_PRINTS[backIdx];

        const cell = document.createElement("div");
        cell.className = "mt-cell";

        const pillar = document.createElement("button");
        pillar.type = "button";
        pillar.className = "mt-pillar";
        pillar.dataset.dof = isLetter ? "2" : "0";
        pillar.setAttribute("aria-label", `${frontItem.title} (${frontItem.origin}, ${frontItem.year}) — Click for origin and source`);

        pillar.innerHTML = `
          <span class="mt-wall mt-wall-s" aria-hidden="true"></span>
          <span class="mt-wall mt-wall-e" aria-hidden="true"></span>
          <span class="mt-wall mt-wall-w" aria-hidden="true"></span>
          <span class="mt-top">
            <span class="mt-top-flip">
              <span class="mt-face front"><img src="${frontItem.src}" alt="${frontItem.title}" loading="${isLetter ? "eager" : "lazy"}" decoding="async"></span>
              <span class="mt-face back"><img src="${backItem.src}" alt="${backItem.title}" loading="lazy" decoding="async"></span>
            </span>
            <span class="mt-hover-tag">${frontItem.id} · ${frontItem.year}</span>
          </span>`;

        const block = {
          r,
          c,
          isLetter,
          el: pillar,
          frontImg: pillar.querySelector(".mt-face.front img"),
          backImg: pillar.querySelector(".mt-face.back img"),
          tagEl: pillar.querySelector(".mt-hover-tag"),
          frontItem,
          backItem,
          flipped: false,
          z: 0,
          dof: isLetter ? 2 : 0,
          diag: c + r * 0.72
        };

        // Start ALREADY at exact sculpted 3D relief so IPC loader cutout matches landing 100% seamlessly!
        block.z = computeTargetZ(block, 0);
        pillar.style.transform = `translate3d(0, 0, ${block.z.toFixed(1)}px)`;
        pillar.style.setProperty("--sh", (block.z / 100).toFixed(3));

        pillar.addEventListener("mouseenter", () => {
          hoveredBlock = block;
          pointerGridX = c;
          pointerGridY = r;
          pillar.classList.add("is-hovered");
        });
        pillar.addEventListener("mouseleave", () => {
          if (hoveredBlock === block) hoveredBlock = null;
          pillar.classList.remove("is-hovered");
        });
        pillar.addEventListener("focus", () => {
          hoveredBlock = block;
          pointerGridX = c;
          pointerGridY = r;
          pillar.classList.add("is-hovered");
        });
        pillar.addEventListener("blur", () => {
          if (hoveredBlock === block) hoveredBlock = null;
          pillar.classList.remove("is-hovered");
        });
        pillar.addEventListener("click", () => {
          const item = block.flipped ? block.backItem : block.frontItem;
          openPrintModal(ARCHIVE_PRINTS.indexOf(item));
        });

        cell.appendChild(pillar);
        frag.appendChild(cell);
        blocks.push(block);
      }
    }
    gridEl.appendChild(frag);

    // Subtle 3D Camera Parallax over Full-Bleed Matrix
    stageEl?.addEventListener("mousemove", e => {
      const rect = stageEl.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetTiltX = baseTiltX - ny * 3.2;
      targetTiltY = nx * 4.2;
    }, { passive: true });
    stageEl?.addEventListener("mouseleave", () => {
      targetTiltX = baseTiltX;
      targetTiltY = 0;
      pointerGridX = -99;
      pointerGridY = -99;
    });

    // Periodic Staggered 3D Block Flips across I·P·C strictly picking from unused off-letter photos (ZERO duplicates!)
    const letterBlocks = blocks.filter(b => b.isLetter);
    let poolCursor = 0;
    const flipBlock = b => {
      if (hoveredBlock === b) return;
      const activeLetterIds = new Set(letterBlocks.map(lb => (lb.flipped ? lb.backItem.id : lb.frontItem.id)));
      let nextItem = null;
      for (let tries = 0; tries < ARCHIVE_PRINTS.length; tries++) {
        const candidate = ARCHIVE_PRINTS[(poolCursor + tries) % ARCHIVE_PRINTS.length];
        if (!activeLetterIds.has(candidate.id)) {
          nextItem = candidate;
          poolCursor = (poolCursor + tries + 1) % ARCHIVE_PRINTS.length;
          break;
        }
      }
      if (!nextItem) return;
      if (!b.flipped) {
        b.backItem = nextItem;
        if (b.backImg) { b.backImg.src = nextItem.src; b.backImg.alt = nextItem.title; }
        b.flipped = true;
        b.el.classList.add("is-flipped");
      } else {
        b.frontItem = nextItem;
        if (b.frontImg) { b.frontImg.src = nextItem.src; b.frontImg.alt = nextItem.title; }
        b.flipped = false;
        b.el.classList.remove("is-flipped");
      }
      const shown = b.flipped ? b.backItem : b.frontItem;
      if (b.tagEl) b.tagEl.textContent = `${shown.id} · ${shown.year}`;
      b.el.setAttribute("aria-label", `${shown.title} (${shown.origin}, ${shown.year}) — Click for origin and source`);
    };

    if (!reducedMotion) {
      let flipStep = 0;
      setInterval(() => {
        if (document.hidden || document.documentElement.classList.contains("ipc-loading")) return;
        const b = letterBlocks[(flipStep * 7) % letterBlocks.length];
        flipStep += 1;
        if (b) flipBlock(b);
      }, 1050);
    }

    const tick = now => {
      const sec = now * 0.001;
      curTiltX += (targetTiltX - curTiltX) * 0.07;
      curTiltY += (targetTiltY - curTiltY) * 0.07;
      planeEl.style.transform = `translateY(-1%) rotateX(${curTiltX.toFixed(2)}deg) rotateY(${curTiltY.toFixed(2)}deg)`;

      const sharpCut = isPortrait ? 28 : 50;
      const midCut = isPortrait ? 16 : 28;

      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const targetZ = computeTargetZ(b, sec);
        const lerp = hoveredBlock === b ? 0.24 : 0.14;
        b.z += (targetZ - b.z) * lerp;
        b.el.style.transform = `translate3d(0, 0, ${b.z.toFixed(1)}px)`;
        b.el.style.setProperty("--sh", (b.z / 100).toFixed(3));

        const nextDof = b.z >= sharpCut ? 2 : b.z >= midCut ? 1 : 0;
        if (nextDof !== b.dof) {
          b.dof = nextDof;
          b.el.dataset.dof = String(nextDof);
        }
      }

      requestAnimationFrame(tick);
    };

    if (!reducedMotion) {
      requestAnimationFrame(tick);
    }
  }

  // ─── 2. Archival Light-Table Modal + Full 61-Source Registry ───
  const printModal = document.getElementById("print-modal");
  const pmImg = document.getElementById("pm-img");
  const pmIndex = document.getElementById("pm-index");
  const pmTitle = document.getElementById("pm-title");
  const pmStory = document.getElementById("pm-story");
  const pmOrigin = document.getElementById("pm-origin");
  const pmYear = document.getElementById("pm-year");
  const pmCredit = document.getElementById("pm-credit");
  const pmSource = document.getElementById("pm-source");
  const pmPrev = document.getElementById("pm-prev");
  const pmNext = document.getElementById("pm-next");
  const pmClose = document.getElementById("pm-close");
  let modalIdx = 0;

  const openPrintModal = idx => {
    if (!printModal) return;
    modalIdx = (idx + ARCHIVE_PRINTS.length) % ARCHIVE_PRINTS.length;
    const item = ARCHIVE_PRINTS[modalIdx];
    pmImg.src = item.src;
    pmImg.alt = item.title;
    pmIndex.textContent = `ARCHIVE PRINT ${item.id} / ${ARCHIVE_PRINTS.length} · ${item.theme}`;
    pmTitle.textContent = item.title;
    pmStory.textContent = item.story;
    pmOrigin.textContent = item.origin;
    pmYear.textContent = item.year;
    pmCredit.textContent = `${item.credit} (${item.license})`;
    const isExt = item.sourceUrl.startsWith("http");
    pmSource.innerHTML = isExt
      ? `<a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">Wikimedia Commons Archive Record ↗</a>`
      : `<a href="${item.sourceUrl}">International Policy Conference Archive</a>`;
    printModal.classList.add("open");
  };

  const closePrintModal = () => printModal?.classList.remove("open");
  pmPrev?.addEventListener("click", () => openPrintModal(modalIdx - 1));
  pmNext?.addEventListener("click", () => openPrintModal(modalIdx + 1));
  pmClose?.addEventListener("click", closePrintModal);
  printModal?.addEventListener("click", e => { if (e.target === printModal) closePrintModal(); });

  const sourcesModal = document.getElementById("sources-modal");
  const sourcesGrid = document.getElementById("sources-grid");
  const sourcesClose = document.getElementById("sources-close");
  const footerSourcesList = document.getElementById("footer-sources-list");

  if (sourcesGrid) {
    ARCHIVE_PRINTS.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "source-entry";
      const isExt = item.sourceUrl.startsWith("http");
      card.innerHTML = `
        <img src="${item.src}" alt="${item.title}" loading="lazy" decoding="async">
        <div>
          <div class="source-entry-title">${item.id}. ${item.title}</div>
          <div class="source-entry-origin">Origin: ${item.origin} (${item.year})</div>
          <div class="source-entry-credit">Source: ${item.credit} · ${item.license}${isExt ? ` · <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">Wikimedia Commons ↗</a>` : ""}</div>
        </div>`;
      card.querySelector("img")?.addEventListener("click", () => {
        sourcesModal?.classList.remove("open");
        openPrintModal(idx);
      });
      sourcesGrid.appendChild(card);
    });
  }
  if (footerSourcesList) {
    ARCHIVE_PRINTS.forEach(item => {
      const li = document.createElement("li");
      const isExt = item.sourceUrl.startsWith("http");
      li.innerHTML = `<strong>${item.id}. ${item.title}</strong> (${item.origin}, ${item.year}) — ${item.credit}, ${item.license}${isExt ? ` · <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">Source ↗</a>` : ""}`;
      footerSourcesList.appendChild(li);
    });
  }

  sourcesClose?.addEventListener("click", () => sourcesModal?.classList.remove("open"));
  sourcesModal?.addEventListener("click", e => { if (e.target === sourcesModal) sourcesModal.classList.remove("open"); });

  window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closePrintModal();
      sourcesModal?.classList.remove("open");
    } else if (printModal?.classList.contains("open")) {
      if (e.key === "ArrowRight") openPrintModal(modalIdx + 1);
      if (e.key === "ArrowLeft") openPrintModal(modalIdx - 1);
    }
  });

  // ─── 3. Liquid Single-Canvas IPC Cutout Loading Screen (100% Same Live Background, ZERO Early Fade!) ───
  const root = document.documentElement;
  const loader = document.getElementById("ipc-loader");
  const svg = document.getElementById("ipc-loader-svg");
  const glyphI = document.getElementById("ipc-glyph-i");
  const glyphP = document.getElementById("ipc-glyph-p");
  const glyphC = document.getElementById("ipc-glyph-c");
  const curtain = document.getElementById("ipc-curtain");

  if (loader && svg && glyphI && glyphP && glyphC && curtain) {
    let dismissed = false;
    const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
    const easeLiquid = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
    const cubicPt = (t, p0, p1, p2, p3) => {
      const m = 1 - t;
      return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3;
    };

    const getViewportBounds = () => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return { xLeft: 0, xRight: 1200, yTop: -100, yBot: 700 };
      const inv = ctm.inverse();
      const pt = svg.createSVGPoint();
      pt.x = 0; pt.y = 0;
      const tl = pt.matrixTransform(inv);
      pt.x = window.innerWidth; pt.y = window.innerHeight;
      const br = pt.matrixTransform(inv);
      return { xLeft: tl.x, xRight: br.x, yTop: tl.y, yBot: br.y };
    };

    const cleanup = () => {
      root.classList.remove("ipc-loading", "ipc-loader-exiting");
      loader.remove();
    };

    const triggerExit = () => {
      if (dismissed) return;
      dismissed = true;
      root.classList.remove("ipc-loading");
      root.classList.add("ipc-loader-exiting");

      if (reducedMotion) {
        setTimeout(cleanup, 340);
        return;
      }

      const duration = 1260;
      const start = performance.now();

      const step = now => {
        const p = clamp((now - start) / duration, 0, 1);
        const { xLeft, xRight, yTop, yBot } = getViewportBounds();
        const vW = xRight - xLeft;
        const vH = yBot - yTop;
        const xMid = (xLeft + xRight) / 2;

        // 1. P stays 100% solid (NO early fade!) and glides straight up off the actual top edge
        const uP = clamp(p / 0.78, 0, 1);
        const eP = easeLiquid(uP);
        const dyP = -eP * (525 - yTop + 90);
        glyphP.setAttribute("transform", `translate(0 ${dyP.toFixed(2)})`);

        // 2. I rises UP FIRST along a vertical tangent (100% solid), then curves cleanly into the left edge
        const uSide = clamp((p - 0.03) / 0.84, 0, 1);
        const eSide = easeLiquid(uSide);
        const endXI = -(320 - xLeft + 90);
        const dxI = cubicPt(eSide, 0, 0, -vW * 0.22, endXI);
        const dyI = cubicPt(eSide, 0, -vH * 0.28, -vH * 0.34, -vH * 0.35);
        glyphI.setAttribute("transform", `translate(${dxI.toFixed(2)} ${dyI.toFixed(2)})`);

        // 3. C mirrors I: rises UP FIRST (100% solid), then curves cleanly into the right edge
        const endXC = xRight - 720 + 90;
        const dxC = cubicPt(eSide, 0, 0, vW * 0.22, endXC);
        const dyC = dyI;
        glyphC.setAttribute("transform", `translate(${dxC.toFixed(2)} ${dyC.toFixed(2)})`);

        // 4. Strictly monotonic liquid white arch wave sweeps ALL THE WAY past yTop (opacity: 1)
        const uWave = clamp((p - 0.22) / 0.78, 0, 1);
        const wCenter = easeInOutSine(Math.pow(uWave, 0.72));
        const wEdge = easeInOutSine(Math.pow(uWave, 1.22));
        const span = vH + 180;
        const edgeY = (yBot + 30) - wEdge * span;
        const centerY = (yBot + 30) - wCenter * span;
        const xL = xLeft - 140;
        const xR = xRight + 140;
        const yT = yTop - 600;
        const ctrl = (xR - xL) * 0.27;
        const d =
          `M${xL.toFixed(1)} ${yT.toFixed(1)} ` +
          `H${xR.toFixed(1)} ` +
          `V${edgeY.toFixed(1)} ` +
          `C${(xR - ctrl).toFixed(1)} ${edgeY.toFixed(1)} ${(xMid + ctrl).toFixed(1)} ${centerY.toFixed(1)} ${xMid.toFixed(1)} ${centerY.toFixed(1)} ` +
          `C${(xMid - ctrl).toFixed(1)} ${centerY.toFixed(1)} ${(xL + ctrl).toFixed(1)} ${edgeY.toFixed(1)} ${xL.toFixed(1)} ${edgeY.toFixed(1)} Z`;
        curtain.setAttribute("d", d);

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          cleanup();
        }
      };

      requestAnimationFrame(step);
    };

    const minHold = new Promise(resolve => setTimeout(resolve, 680));
    const eagerImgs = [...document.querySelectorAll(".mt-pillar[data-dof='2'] .mt-face.front img")];
    const ready = Promise.all(
      eagerImgs.slice(0, 18).map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise(resolve => { img.addEventListener("load", resolve, { once: true }); img.addEventListener("error", resolve, { once: true }); })
      )
    );
    const maxWait = new Promise(resolve => setTimeout(resolve, 1600));

    Promise.race([Promise.all([minHold, ready]), maxWait]).then(triggerExit);
    window.addEventListener("pageshow", event => {
      if (event.persisted) cleanup();
    });
  } else {
    root.classList.remove("ipc-loading", "ipc-loader-exiting");
  }

  // ─── 4. Interactive 3D Natural Earth Orthographic Globe (#examples) ───
  const globeCanvas = document.getElementById("ipc-globe-canvas");
  const globeCoordsEl = document.getElementById("globe-coords");
  const exampleBtns = [...document.querySelectorAll("#examples-list .example-item")];

  if (globeCanvas && window.IPC_EARTH_DATA) {
    const ctx = globeCanvas.getContext("2d");
    const DEG = Math.PI / 180;
    const { dots: rawDots, coasts: rawCoasts } = window.IPC_EARTH_DATA;

    const LOCS = [
      { id: "01", name: "United States", topic: "Healthcare", lat: 39.8, lon: -98.6, label: "39.8° N · 98.6° W" },
      { id: "02", name: "European Union", topic: "Environmental", lat: 50.85, lon: 4.35, label: "50.8° N · 4.4° E" },
      { id: "03", name: "India", topic: "Education", lat: 22.6, lon: 79.0, label: "22.6° N · 79.0° E" },
      { id: "04", name: "Kenya", topic: "Economic", lat: -1.29, lon: 36.82, label: "1.3° S · 36.8° E" },
      { id: "05", name: "Brazil", topic: "Housing", lat: -23.55, lon: -46.63, label: "23.6° S · 46.6° W" },
      { id: "06", name: "Australia", topic: "Technology", lat: -29.0, lon: 141.0, label: "29.0° S · 141.0° E" }
    ];

    const ARCS = [
      [0, 1], [1, 2], [2, 5], [1, 3], [3, 2], [0, 4], [4, 3]
    ];

    // Precompute unit sphere Cartesian coordinates (y = North, x = lon 90°E, z = lon 0° prime meridian)
    const toXYZ = (lonDeg, latDeg) => {
      const lam = lonDeg * DEG;
      const phi = latDeg * DEG;
      const cp = Math.cos(phi);
      return [cp * Math.sin(lam), Math.sin(phi), cp * Math.cos(lam)];
    };

    const landPts = new Float32Array((rawDots.length / 2) * 3);
    for (let i = 0, j = 0; i < rawDots.length; i += 2, j += 3) {
      const [x, y, z] = toXYZ(rawDots[i] / 10, rawDots[i + 1] / 10);
      landPts[j] = x; landPts[j + 1] = y; landPts[j + 2] = z;
    }

    const coastRings = rawCoasts.map(ring => {
      const arr = new Float32Array((ring.length / 2) * 3);
      for (let i = 0, j = 0; i < ring.length; i += 2, j += 3) {
        const [x, y, z] = toXYZ(ring[i] / 10, ring[i + 1] / 10);
        arr[j] = x; arr[j + 1] = y; arr[j + 2] = z;
      }
      return arr;
    });

    const locXYZ = LOCS.map(l => toXYZ(l.lon, l.lat));

    // Precompute 36-step elevated geodesic great-circle arcs
    const arcPaths = ARCS.map(([a, b]) => {
      const p0 = locXYZ[a], p1 = locXYZ[b];
      const dot = Math.max(-1, Math.min(1, p0[0] * p1[0] + p0[1] * p1[1] + p0[2] * p1[2]));
      const omega = Math.acos(dot);
      const sinO = Math.sin(omega) || 1;
      const steps = 36;
      const pts = [];
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const w0 = Math.sin((1 - t) * omega) / sinO;
        const w1 = Math.sin(t * omega) / sinO;
        const lift = 1 + Math.sin(Math.PI * t) * 0.14;
        pts.push([(p0[0] * w0 + p1[0] * w1) * lift, (p0[1] * w0 + p1[1] * w1) * lift, (p0[2] * w0 + p1[2] * w1) * lift]);
      }
      return { a, b, pts };
    });

    let activeIdx = 0;
    let rotLon = -LOCS[0].lon * DEG;
    let rotLat = LOCS[0].lat * DEG * 0.72;
    let targetLon = rotLon;
    let targetLat = rotLat;
    let autoSpin = true;
    let userHoverLock = false;
    let dragging = false;
    let dragX = 0, dragY = 0;
    let velLon = 0, velLat = 0;
    let globeVisible = true;
    let markerHitPts = [];

    const selectLocation = (idx, pauseSpin = true) => {
      activeIdx = idx;
      const loc = LOCS[idx];
      // Shortest angular path around 2π
      const desired = -loc.lon * DEG;
      let diff = ((desired - rotLon + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      targetLon = rotLon + diff;
      targetLat = Math.max(-0.85, Math.min(0.85, loc.lat * DEG * 0.78));
      if (pauseSpin) autoSpin = false;
      exampleBtns.forEach((btn, i) => btn.classList.toggle("is-active", i === idx));
      if (globeCoordsEl) {
        globeCoordsEl.textContent = `${loc.label} — ${loc.name.toUpperCase()} · ${loc.topic.toUpperCase()}`;
      }
    };

    exampleBtns.forEach((btn, idx) => {
      btn.addEventListener("click", () => selectLocation(idx, true));
      btn.addEventListener("mouseenter", () => {
        userHoverLock = true;
        selectLocation(idx, true);
      });
      btn.addEventListener("mouseleave", () => {
        userHoverLock = false;
      });
    });

    // Pointer drag-to-rotate + click beacon detection
    let downX = 0, downY = 0;
    globeCanvas.addEventListener("pointerdown", e => {
      dragging = true;
      autoSpin = false;
      dragX = downX = e.clientX;
      dragY = downY = e.clientY;
      velLon = 0; velLat = 0;
      globeCanvas.setPointerCapture(e.pointerId);
    });
    globeCanvas.addEventListener("pointermove", e => {
      if (!dragging) return;
      const dx = e.clientX - dragX;
      const dy = e.clientY - dragY;
      dragX = e.clientX; dragY = e.clientY;
      velLon = dx * 0.0075;
      velLat = dy * 0.006;
      rotLon += velLon;
      rotLat = Math.max(-1.05, Math.min(1.05, rotLat + velLat));
      targetLon = rotLon;
      targetLat = rotLat;
    });
    const endDrag = e => {
      if (!dragging) return;
      dragging = false;
      // Check click on a front-facing marker beacon
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 7) {
        const rect = globeCanvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        for (const m of markerHitPts) {
          if (Math.hypot(cx - m.x, cy - m.y) < 22) {
            selectLocation(m.idx, true);
            break;
          }
        }
      }
    };
    globeCanvas.addEventListener("pointerup", endDrag);
    globeCanvas.addEventListener("pointercancel", endDrag);

    // Pause rendering when scrolled off-screen for zero idle CPU
    const globeObs = new IntersectionObserver(entries => {
      globeVisible = entries[0]?.isIntersecting ?? true;
    }, { threshold: 0.05 });
    globeObs.observe(globeCanvas);

    const resizeCanvas = () => {
      const rect = globeCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.max(260, Math.round(rect.width));
      if (globeCanvas.width !== Math.round(size * dpr)) {
        globeCanvas.width = Math.round(size * dpr);
        globeCanvas.height = Math.round(size * dpr);
      }
      return { size, dpr };
    };

    const drawGlobe = now => {
      requestAnimationFrame(drawGlobe);
      if (!globeVisible || document.hidden) return;

      const { size, dpr } = resizeCanvas();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      if (!dragging) {
        if (autoSpin && !userHoverLock && !reducedMotion) {
          rotLon += 0.0024;
          targetLon = rotLon;
        } else {
          if (Math.abs(velLon) > 0.0002 || Math.abs(velLat) > 0.0002) {
            rotLon += velLon;
            rotLat = Math.max(-1.05, Math.min(1.05, rotLat + velLat));
            targetLon = rotLon; targetLat = rotLat;
            velLon *= 0.93; velLat *= 0.93;
          } else {
            rotLon += (targetLon - rotLon) * 0.085;
            rotLat += (targetLat - rotLat) * 0.085;
          }
        }
      }

      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.425;
      const cosLon = Math.cos(rotLon), sinLon = Math.sin(rotLon);
      const cosLat = Math.cos(rotLat), sinLat = Math.sin(rotLat);

      const project = (x, y, z) => {
        // Rotate around Y (longitude), then X (latitude tilt)
        const x1 = x * cosLon + z * sinLon;
        const z1 = -x * sinLon + z * cosLon;
        const y2 = y * cosLat - z1 * sinLat;
        const z2 = y * sinLat + z1 * cosLat;
        return [cx + x1 * R, cy - y2 * R, z2];
      };

      // 1. Subtle outer atmospheric halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.15);
      halo.addColorStop(0, "rgba(22, 46, 33, 0.24)");
      halo.addColorStop(0.55, "rgba(22, 46, 33, 0.06)");
      halo.addColorStop(1, "rgba(22, 46, 33, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // 2. Sculpted Deep Diplomatic Forest-Obsidian Sphere
      const sphereGrad = ctx.createRadialGradient(cx - R * 0.34, cy - R * 0.32, R * 0.06, cx, cy, R * 1.05);
      sphereGrad.addColorStop(0, "#234332");
      sphereGrad.addColorStop(0.48, "#14271d");
      sphereGrad.addColorStop(0.86, "#0d1a13");
      sphereGrad.addColorStop(1, "#08110c");
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();
      ctx.clip();

      // 3. Precision Architectural Graticule (Meridians & Parallels every 30°)
      ctx.lineWidth = 0.75;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.strokeStyle = lat === 0 ? "rgba(246, 242, 233, 0.14)" : "rgba(246, 242, 233, 0.065)";
        ctx.beginPath();
        let pen = false;
        for (let lon = -180; lon <= 180; lon += 6) {
          const [x, y, z] = toXYZ(lon, lat);
          const [sx, sy, sz] = project(x, y, z);
          if (sz >= -0.02) {
            if (!pen) { ctx.moveTo(sx, sy); pen = true; } else ctx.lineTo(sx, sy);
          } else pen = false;
        }
        ctx.stroke();
      }
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.strokeStyle = "rgba(246, 242, 233, 0.065)";
        ctx.beginPath();
        let pen = false;
        for (let lat = -84; lat <= 84; lat += 6) {
          const [x, y, z] = toXYZ(lon, lat);
          const [sx, sy, sz] = project(x, y, z);
          if (sz >= -0.02) {
            if (!pen) { ctx.moveTo(sx, sy); pen = true; } else ctx.lineTo(sx, sy);
          } else pen = false;
        }
        ctx.stroke();
      }

      // 4. Real Natural Earth 110m Vector Coastlines (front hemisphere crisp ivory contour)
      ctx.strokeStyle = "rgba(243, 236, 222, 0.28)";
      ctx.lineWidth = 0.9;
      for (let r = 0; r < coastRings.length; r++) {
        const ring = coastRings[r];
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i < ring.length; i += 3) {
          const [sx, sy, sz] = project(ring[i], ring[i + 1], ring[i + 2]);
          if (sz > 0.01) {
            if (!pen) { ctx.moveTo(sx, sy); pen = true; } else ctx.lineTo(sx, sy);
          } else pen = false;
        }
        ctx.stroke();
      }

      // 5. 3,049 Real Natural Earth Fibonacci Land Dots (volumetric back + luminous front shading)
      const dotBase = size * 0.0029;
      for (let i = 0; i < landPts.length; i += 3) {
        const [sx, sy, sz] = project(landPts[i], landPts[i + 1], landPts[i + 2]);
        if (sz < 0) {
          // Subtle ghost back-hemisphere land dots for crystal-clear 3D sphere depth
          ctx.fillStyle = "rgba(246, 242, 233, 0.055)";
          ctx.fillRect(sx - 0.6, sy - 0.6, 1.2, 1.2);
        } else {
          const lum = 0.28 + Math.pow(sz, 0.72) * 0.72;
          const rad = dotBase * (0.68 + sz * 0.52);
          ctx.fillStyle = `rgba(244, 238, 224, ${lum.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(sx, sy, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 6. Specular Rim & Inner Edge Vignette
      const rim = ctx.createRadialGradient(cx, cy, R * 0.76, cx, cy, R);
      rim.addColorStop(0, "rgba(0,0,0,0)");
      rim.addColorStop(0.82, "rgba(0,0,0,0.22)");
      rim.addColorStop(1, "rgba(246, 242, 233, 0.22)");
      ctx.fillStyle = rim;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();

      // Crisp outer architectural sphere hairline
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(246, 242, 233, 0.24)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 7. Elevated Geodesic Policy Arcs + Traveling Pulse Comet (cleanly clipped above front hemisphere horizon)
      const pulseT = (now * 0.00035) % 1;
      for (const arc of arcPaths) {
        const isRel = arc.a === activeIdx || arc.b === activeIdx;
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i < arc.pts.length; i++) {
          const [sx, sy, sz] = project(arc.pts[i][0], arc.pts[i][1], arc.pts[i][2]);
          if (sz > 0.06 && Math.hypot(sx - cx, sy - cy) <= R * 1.06) {
            if (!pen) { ctx.moveTo(sx, sy); pen = true; } else ctx.lineTo(sx, sy);
          } else pen = false;
        }
        ctx.strokeStyle = isRel ? "rgba(232, 98, 70, 0.75)" : "rgba(232, 98, 70, 0.22)";
        ctx.lineWidth = isRel ? 1.85 : 0.9;
        ctx.stroke();

        if (isRel && !reducedMotion) {
          const idxF = pulseT * (arc.pts.length - 1);
          const i0 = Math.floor(idxF);
          const p = arc.pts[i0];
          const [sx, sy, sz] = project(p[0], p[1], p[2]);
          if (sz > 0.08 && Math.hypot(sx - cx, sy - cy) <= R * 1.06) {
            ctx.beginPath();
            ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
            ctx.fillStyle = "#fff5f2";
            ctx.fill();
          }
        }
      }

      // 8. Six Real-GPS Policy Beacons + Floating Callout Pill on Active Region
      markerHitPts = [];
      const ringPulse = (now * 0.0012) % 1;
      for (let i = 0; i < LOCS.length; i++) {
        const [sx, sy, sz] = project(locXYZ[i][0], locXYZ[i][1], locXYZ[i][2]);
        if (sz < -0.04) continue;
        const isAct = i === activeIdx;
        markerHitPts.push({ idx: i, x: sx, y: sy });

        if (isAct) {
          ctx.beginPath();
          ctx.arc(sx, sy, 8 + ringPulse * 18, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(232, 98, 70, ${(1 - ringPulse) * 0.85})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, isAct ? 10 : 7.5, 0, Math.PI * 2);
        ctx.fillStyle = isAct ? "#e86246" : "#182d21";
        ctx.fill();
        ctx.lineWidth = isAct ? 2 : 1.5;
        ctx.strokeStyle = isAct ? "#fffdf9" : "rgba(232, 98, 70, 0.92)";
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = `700 ${isAct ? 9.5 : 8.5}px "DM Sans", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), sx, sy + 0.5);

        if (isAct && sz > 0.15) {
          const text = `${LOCS[i].id} · ${LOCS[i].name.toUpperCase()}`;
          ctx.font = '700 10px "DM Sans", sans-serif';
          const tw = ctx.measureText(text).width;
          const pw = tw + 18;
          const ph = 22;
          const px = Math.min(size - pw - 6, Math.max(6, sx + 15));
          const py = Math.max(8, sy - ph / 2);
          ctx.fillStyle = "rgba(14, 24, 18, 0.92)";
          ctx.strokeStyle = "rgba(232, 98, 70, 0.85)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(px, py, pw, ph, 11);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#fffdf9";
          ctx.textAlign = "left";
          ctx.fillText(text, px + 9, py + ph / 2 + 0.5);
        }
      }
    };

    requestAnimationFrame(drawGlobe);
  }

  // ─── 5. Flat Architectural Rotating Cylinder Pyramid for Award Tiers (#awards — Original IPC Palette) ───
  const awardsCanvas = document.getElementById("ipc-awards-canvas");
  const awardRows = [...document.querySelectorAll("#awards-ledger .award-row")];

  if (awardsCanvas) {
    const actx = awardsCanvas.getContext("2d");
    // Connected flush to the top border (100% width at top → 34% Gold apex at bottom), 100% flat original IPC palette
    const TIERS = [
      { name: "DISTINCTION",       pct: "TOP 25%", rDesk: 0.50,  rMob: 0.50,  repeats: 5, speed:  0.11, bg: "#213c2b", text: "#fffdf8", pctColor: "#f1c0ad", sepColor: "rgba(241, 192, 173, 0.55)" },
      { name: "HONORABLE MENTION", pct: "TOP 15%", rDesk: 0.425, rMob: 0.44,  repeats: 4, speed: -0.125, bg: "#fffdf8", text: "#18261d", pctColor: "#213c2b", sepColor: "rgba(24, 38, 29, 0.32)" },
      { name: "FINALIST",          pct: "TOP 8",   rDesk: 0.355, rMob: 0.385, repeats: 4, speed:  0.14, bg: "#f5efe3", text: "#18261d", pctColor: "#f2684e", sepColor: "rgba(24, 38, 29, 0.32)" },
      { name: "BRONZE MEDAL",      pct: "TOP 3",   rDesk: 0.29,  rMob: 0.33,  repeats: 3, speed: -0.155, bg: "#213c2b", text: "#fffdf8", pctColor: "#f1c0ad", sepColor: "rgba(241, 192, 173, 0.55)" },
      { name: "SILVER MEDAL",      pct: "TOP 2",   rDesk: 0.23,  rMob: 0.28,  repeats: 3, speed:  0.17, bg: "#fffdf8", text: "#18261d", pctColor: "#213c2b", sepColor: "rgba(24, 38, 29, 0.32)" },
      { name: "GOLD MEDAL",        pct: "TOP 1",   rDesk: 0.175, rMob: 0.235, repeats: 2, speed: -0.185, bg: "#f2684e", text: "#fffdf8", pctColor: "#fffdf8", sepColor: "rgba(255, 253, 248, 0.65)" }
    ];

    // Pre-render crisp flat editorial cylindrical wrap strips matched to true cylinder circumference
    // Dynamically computes repeat count from real measured label width so text NEVER overlaps on mobile or desktop
    const buildFlatCylTexture = (tier, bandR, cylH) => {
      const th = 112;
      const circumference = 2 * Math.PI * bandR;
      const tw = Math.max(1000, Math.round(circumference * (th / cylH)));
      const off = document.createElement("canvas");
      off.width = tw;
      off.height = th;
      const g = off.getContext("2d");

      // Pure flat solid fill (original IPC color, zero gradient)
      g.fillStyle = tier.bg;
      g.fillRect(0, 0, tw, th);

      const titlePx = Math.round(th * 0.4);
      const pctPx = Math.round(th * 0.24);
      const sep = "   ·   ";
      g.font = `600 ${titlePx}px "Playfair Display", Georgia, serif`;
      const wTitle = g.measureText(tier.name).width;
      g.font = `700 ${pctPx}px "DM Sans", Arial, sans-serif`;
      const wSep = g.measureText(sep).width;
      const wPct = g.measureText(tier.pct).width;
      const labelW = wTitle + wSep + wPct;
      const repeats = Math.max(1, Math.floor(tw / (labelW + 220)));

      // Evenly space "[AWARD]  ·  [TOP %]" around the 360° circumference
      const segW = tw / repeats;
      g.textBaseline = "middle";

      for (let i = 0; i < repeats; i++) {
        const mid = i * segW + segW * 0.5;
        let x = mid - labelW / 2;

        g.textAlign = "left";
        g.font = `600 ${titlePx}px "Playfair Display", Georgia, serif`;
        g.fillStyle = tier.text;
        g.fillText(tier.name, x, th * 0.52);
        x += wTitle;

        g.font = `700 ${pctPx}px "DM Sans", Arial, sans-serif`;
        g.fillStyle = tier.pctColor;
        g.fillText(sep + tier.pct, x, th * 0.53);

        // Minimal editorial vertical tick between circumference repeats
        g.fillStyle = tier.sepColor;
        g.fillRect(Math.round(i * segW) - 1, Math.round(th * 0.32), 2, Math.round(th * 0.36));
      }
      return { canvas: off, repeats };
    };

    let texWCache = 0;
    let textures = [];
    const angles = TIERS.map(() => 0);
    let anglesInitialized = false;
    const rebuildTextures = (W, cylH, isMob) => {
      texWCache = W;
      const built = TIERS.map(t => buildFlatCylTexture(t, W * (isMob ? t.rMob : t.rDesk), cylH));
      textures = built.map(b => b.canvas);
      if (!anglesInitialized) {
        built.forEach((b, i) => { angles[i] = Math.PI / b.repeats; });
        anglesInitialized = true;
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { texWCache = 0; });
    }
    let activeTier = 5;
    let hoveredTier = -1;
    let awardsVisible = true;
    let cylHitBands = [];

    const setActiveTier = idx => {
      activeTier = idx;
      awardRows.forEach((row, i) => row.classList.toggle("is-active", i === idx));
    };

    awardRows.forEach((row, idx) => {
      row.addEventListener("mouseenter", () => { hoveredTier = idx; setActiveTier(idx); });
      row.addEventListener("mouseleave", () => { hoveredTier = -1; });
      row.addEventListener("click", () => setActiveTier(idx));
    });

    awardsCanvas.addEventListener("pointermove", e => {
      const rect = awardsCanvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      let hit = -1;
      for (const b of cylHitBands) {
        if (py >= b.yTop && py <= b.yBot && Math.abs(px - b.cx) <= b.R) {
          hit = b.idx;
          break;
        }
      }
      hoveredTier = hit;
      if (hit !== -1) setActiveTier(hit);
    });
    awardsCanvas.addEventListener("pointerleave", () => { hoveredTier = -1; });
    awardsCanvas.addEventListener("click", () => {
      if (hoveredTier !== -1) setActiveTier(hoveredTier);
    });

    const awardsObs = new IntersectionObserver(entries => {
      awardsVisible = entries[0]?.isIntersecting ?? true;
    }, { threshold: 0.02 });
    awardsObs.observe(awardsCanvas);

    let lastAwardTime = performance.now();
    let awardsRenderedOnce = false;
    const drawAwards = now => {
      requestAnimationFrame(drawAwards);
      const dt = Math.min(0.05, (now - lastAwardTime) * 0.001);
      lastAwardTime = now;
      if ((!awardsVisible || document.hidden) && awardsRenderedOnce) return;
      awardsRenderedOnce = true;

      const rect = awardsCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(320, Math.round(rect.width));
      const isMob = W < 640;
      const cylH = isMob ? 46 : 56;
      const H = cylH * TIERS.length + 2;

      if (awardsCanvas.width !== Math.round(W * dpr) || awardsCanvas.height !== Math.round(H * dpr)) {
        awardsCanvas.width = Math.round(W * dpr);
        awardsCanvas.height = Math.round(H * dpr);
        awardsCanvas.style.height = `${H}px`;
      }
      if (Math.abs(texWCache - W) > 24 || textures.length !== TIERS.length) {
        rebuildTextures(W, cylH, isMob);
      }

      actx.setTransform(dpr, 0, 0, dpr, 0, 0);
      actx.clearRect(0, 0, W, H);

      const cx = W * 0.5;

      if (!reducedMotion) {
        for (let k = 0; k < TIERS.length; k++) {
          const factor = hoveredTier === k ? 0.18 : activeTier === k ? 0.6 : 1;
          angles[k] += TIERS[k].speed * factor * dt;
        }
      }

      cylHitBands = [];
      // Draw strictly top (y = 0, connected flush to top edge) → bottom apex, zero gaps, 100% flat orthographic cylinders
      for (let k = 0; k < TIERS.length; k++) {
        const tier = TIERS[k];
        const tex = textures[k];
        const R = W * (isMob ? tier.rMob : tier.rDesk);
        const topY = k * cylH;
        const leftX = cx - R;
        const bandW = R * 2;
        const isFocus = k === hoveredTier || k === activeTier;

        cylHitBands.push({ idx: k, cx, R, yTop: topY, yBot: topY + cylH });

        // Flat solid band base
        actx.fillStyle = tier.bg;
        actx.fillRect(leftX, topY, bandW, cylH);

        // Orthographic cylindrical rotation (flat horizontal projection x = cx + R*sin(θ), zero 3D ellipse bow, zero gloss)
        const slices = Math.max(96, Math.round(R * 0.55));
        const dTheta = Math.PI / slices;
        for (let s = 0; s < slices; s++) {
          const t0 = -Math.PI / 2 + s * dTheta;
          const t1 = t0 + dTheta;
          const tm = (t0 + t1) * 0.5;
          const x0 = cx + R * Math.sin(t0);
          const x1 = cx + R * Math.sin(t1);
          const sw = x1 - x0;
          if (sw <= 0.15) continue;

          let u = ((tm + angles[k]) / (Math.PI * 2)) % 1;
          if (u < 0) u += 1;
          const srcX = u * tex.width;
          const srcW = Math.max(1, (dTheta / (Math.PI * 2)) * tex.width);
          const safeSrcW = Math.min(srcW, tex.width - srcX);

          actx.drawImage(tex, srcX, 0, safeSrcW, tex.height, x0, topY, sw + 0.65, cylH);

          // Subtle flat edge-turn ink shading only at the very outer curve so cylindrical turn reads naturally without 3D gloss
          const edgeTurn = Math.pow(1 - Math.cos(tm), 2.1) * 0.16;
          if (edgeTurn > 0.01) {
            actx.fillStyle = `rgba(24, 38, 29, ${edgeTurn.toFixed(3)})`;
            actx.fillRect(x0, topY, sw + 0.65, cylH);
          }
        }

        // Crisp flat architectural 1.5px ink rules (left, right, bottom; top tier connects flush at y = 0)
        actx.strokeStyle = isFocus ? "#18261d" : "rgba(24, 38, 29, 0.55)";
        actx.lineWidth = isFocus ? 2 : 1.25;
        actx.beginPath();
        if (k > 0) {
          actx.moveTo(leftX + 0.5, topY);
          actx.lineTo(leftX + 0.5, topY + cylH);
          actx.moveTo(leftX + bandW - 0.5, topY);
          actx.lineTo(leftX + bandW - 0.5, topY + cylH);
        }
        actx.moveTo(leftX, topY + cylH - 0.5);
        actx.lineTo(leftX + bandW, topY + cylH - 0.5);
        actx.stroke();
      }
    };

    requestAnimationFrame(drawAwards);
  }

  // ─── 6. Header Scroll State, Mobile Nav & Reliable Scroll Reveal ───
  const header = document.querySelector(".site-header");
  const heroSection = document.querySelector(".mt-hero");
  const onScroll = () => {
    const threshold = heroSection ? Math.max(120, heroSection.offsetHeight - 96) : 36;
    header?.classList.toggle("scrolled", window.scrollY > threshold);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const button = document.querySelector(".menu-button");
  const menu = document.querySelector(".site-header nav");
  button?.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
  });
  menu?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    menu.classList.remove("open");
    button?.setAttribute("aria-expanded", "false");
  }));

  const revealItems = [...document.querySelectorAll(".reveal")];
  const observer = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    }),
    { threshold: 0.01, rootMargin: "0px 0px -24px 0px" }
  );
  revealItems.forEach(item => observer.observe(item));

  // Ensure any element already in or above the viewport on load/hash jump reveals immediately
  const flushVisibleReveals = () => {
    const vh = window.innerHeight || 900;
    revealItems.forEach(el => {
      if (el.classList.contains("in-view")) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh + 40) {
        el.classList.add("in-view");
        observer.unobserve(el);
      }
    });
  };
  window.addEventListener("hashchange", () => setTimeout(flushVisibleReveals, 80));
  window.addEventListener("scroll", flushVisibleReveals, { passive: true });
  setTimeout(flushVisibleReveals, 200);
})();
