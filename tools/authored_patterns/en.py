# English sentence patterns written for Shoresh (not from a corpus; not native-reviewed translations).
# Examples are (sentence, None, {'he': Hebrew, 'hu': Hungarian}): a learner needs the translation in their own language.
PATTERNS = [
    ('be', 'am / is / are / was / were', 'to be', 'A1', r"\b(?:am|is|are|was|were)\b", [
        ('She is a doctor.', None, {'he': 'היא רופאה.', 'hu': 'Ő orvos.'}),
        ('We were at home yesterday.', None, {'he': 'אתמול היינו בבית.', 'hu': 'Tegnap otthon voltunk.'}),
        ('I am very tired.', None, {'he': 'אני עייף מאוד.', 'hu': 'Nagyon fáradt vagyok.'})]),
    ('do-not', "don't / doesn't / didn't", 'negation with do-support', 'A1', r"\b(?:do|does|did) not\b|\b(?:don't|doesn't|didn't)\b", [
        ("I don't like coffee.", None, {'he': 'אני לא אוהב קפה.', 'hu': 'Nem szeretem a kávét.'}),
        ("She doesn't live here.", None, {'he': 'היא לא גרה כאן.', 'hu': 'Ő nem itt lakik.'}),
        ("They didn't come to the party.", None, {'he': 'הם לא באו למסיבה.', 'hu': 'Nem jöttek el a buliba.'})]),
    ('wh-question', 'Wh- word + auxiliary + subject', 'forming questions', 'A1', r"^(?:what|where|when|why|who|how|which)\b (?:do|does|did|is|are|was|were|can|will|would) ", [
        ('Where do you live?', None, {'he': 'איפה אתה גר?', 'hu': 'Hol laksz?'}),
        ('What are you doing?', None, {'he': 'מה אתה עושה?', 'hu': 'Mit csinálsz?'}),
        ('Why did he leave?', None, {'he': 'למה הוא עזב?', 'hu': 'Miért ment el?'})]),
    ('there-is', 'there is / there are', 'existence', 'A1', r"\bthere (?:is|are|was|were)\b|\b(?:is|are|was|were) there\b", [
        ('There is a park near my house.', None, {'he': 'יש פארק ליד הבית שלי.', 'hu': 'Van egy park a házam közelében.'}),
        ('There are three books on the table.', None, {'he': 'יש שלושה ספרים על השולחן.', 'hu': 'Három könyv van az asztalon.'}),
        ('Was there any milk left?', None, {'he': 'נשאר חלב?', 'hu': 'Maradt tej?'})]),
    ('want-to', 'want / need / hope to + verb', 'wanting and planning', 'A1', r"\b(?:want|wants|wanted|need|needs|needed|hope|hopes|plan|plans) to [a-z]+\b", [
        ('I want to learn Spanish.', None, {'he': 'אני רוצה ללמוד ספרדית.', 'hu': 'Spanyolul akarok tanulni.'}),
        ('She needs to buy some bread.', None, {'he': 'היא צריכה לקנות קצת לחם.', 'hu': 'Venni kell egy kis kenyeret.'}),
        ('We hope to see you soon.', None, {'he': 'אנחנו מקווים לראות אתכם בקרוב.', 'hu': 'Reméljük, hamarosan találkozunk.'})]),
    ('present-continuous', 'am / is / are + -ing', 'happening now', 'A1', r"\b(?:am|is|are) [a-z]+ing\b", [
        ('He is reading a book.', None, {'he': 'הוא קורא ספר.', 'hu': 'Egy könyvet olvas.'}),
        ('They are playing football.', None, {'he': 'הם משחקים כדורגל.', 'hu': 'Focizni játszanak.'}),
        ('I am waiting for the bus.', None, {'he': 'אני מחכה לאוטובוס.', 'hu': 'A buszra várok.'})]),
    ('past-irregular', 'went / saw / had / made …', 'irregular past tense', 'A2', r"\b(?:went|saw|had|made|took|came|ate|got|gave|knew|bought|wrote)\b", [
        ('We went to the beach last summer.', None, {'he': 'הלכנו לחוף בקיץ שעבר.', 'hu': 'Tavaly nyáron a tengerparton jártunk.'}),
        ('I saw her yesterday.', None, {'he': 'ראיתי אותה אתמול.', 'hu': 'Tegnap láttam őt.'}),
        ('He bought a new phone.', None, {'he': 'הוא קנה טלפון חדש.', 'hu': 'Vett egy új telefont.'})]),
    ('going-to', 'am / is / are going to + verb', 'plans and predictions', 'A2', r"\bgoing to [a-z]+\b", [
        ('I am going to visit my aunt.', None, {'he': 'אני הולך לבקר את דודתי.', 'hu': 'Meg fogom látogatni a nénikémet.'}),
        ('It is going to rain.', None, {'he': 'הולך לרדת גשם.', 'hu': 'Esni fog.'}),
        ('Are you going to come?', None, {'he': 'אתה מתכוון לבוא?', 'hu': 'El fogsz jönni?'})]),
    ('will', 'will / won\'t + verb', 'future, promises, decisions', 'A2', r"\b(?:will|won't) [a-z]+\b|\b(?:i|you|he|she|we|they|it)'ll\b", [
        ('I will call you tomorrow.', None, {'he': 'אני אתקשר אליך מחר.', 'hu': 'Holnap felhívlak.'}),
        ("She won't be late.", None, {'he': 'היא לא תאחר.', 'hu': 'Nem fog késni.'}),
        ("We'll help you.", None, {'he': 'נעזור לך.', 'hu': 'Segíteni fogunk neked.'})]),
    ('modals', 'can / could / should / must / might', 'modal verbs', 'A2', r"\b(?:can|can't|could|should|must|might|may) [a-z]+\b", [
        ('You should drink more water.', None, {'he': 'כדאי לך לשתות יותר מים.', 'hu': 'Többet kellene vizet innod.'}),
        ('Can you help me?', None, {'he': 'אתה יכול לעזור לי?', 'hu': 'Tudsz segíteni?'}),
        ('It might rain later.', None, {'he': 'אולי ירד גשם מאוחר יותר.', 'hu': 'Lehet, hogy később esni fog.'})]),
    ('have-to', 'have / has / had to + verb', 'obligation', 'A2', r"\b(?:have|has|had) to [a-z]+\b", [
        ('I have to work on Saturday.', None, {'he': 'אני חייב לעבוד בשבת.', 'hu': 'Szombaton dolgoznom kell.'}),
        ('She had to leave early.', None, {'he': 'היא הייתה צריכה ללכת מוקדם.', 'hu': 'Korán el kellett mennie.'}),
        ('Do we have to go now?', None, {'he': 'אנחנו חייבים ללכת עכשיו?', 'hu': 'Most kell mennünk?'})]),
    ('present-perfect', 'have / has + past participle', 'present perfect (experience, result)', 'B1', r"\b(?:have|has|haven't|hasn't) (?:\w+ )?(?:been|gone|seen|done|eaten|taken|made|known|written|[a-z]+ed)\b", [
        ('I have been to Japan twice.', None, {'he': 'הייתי ביפן פעמיים.', 'hu': 'Kétszer jártam Japánban.'}),
        ('She has already finished.', None, {'he': 'היא כבר סיימה.', 'hu': 'Ő már befejezte.'}),
        ("They haven't seen the film yet.", None, {'he': 'הם עוד לא ראו את הסרט.', 'hu': 'Még nem látták a filmet.'})]),
    ('used-to', 'used to + verb', 'past habits', 'B1', r"\bused to [a-z]+\b", [
        ('I used to play the piano.', None, {'he': 'פעם ניגנתי בפסנתר.', 'hu': 'Régen zongoráztam.'}),
        ('We used to live in London.', None, {'he': 'פעם גרנו בלונדון.', 'hu': 'Régen Londonban laktunk.'}),
        ('He used to smoke.', None, {'he': 'הוא נהג לעשן.', 'hu': 'Régen dohányzott.'})]),
    ('comparative', 'more … than / -er than', 'comparing', 'A2', r"\b(?:more|less) [a-z]+ than\b|\b[a-z]+er than\b", [
        ('This book is more interesting than that one.', None, {'he': 'הספר הזה מעניין יותר מההוא.', 'hu': 'Ez a könyv érdekesebb, mint az.'}),
        ('He is taller than his brother.', None, {'he': 'הוא גבוה מאחיו.', 'hu': 'Magasabb, mint a testvére.'}),
        ('Today is colder than yesterday.', None, {'he': 'היום קר יותר מאתמול.', 'hu': 'Ma hidegebb van, mint tegnap.'})]),
    ('superlative', 'the most … / the -est', 'the highest degree', 'A2', r"\bthe (?:most [a-z]+|[a-z]+est)\b", [
        ('This is the best pizza in town.', None, {'he': 'זו הפיצה הטובה ביותר בעיר.', 'hu': 'Ez a város legjobb pizzája.'}),
        ('She is the most talented student.', None, {'he': 'היא התלמידה המוכשרת ביותר.', 'hu': 'Ő a legtehetségesebb diák.'}),
        ('It was the happiest day of my life.', None, {'he': 'זה היה היום המאושר בחיי.', 'hu': 'Ez volt életem legboldogabb napja.'})]),
    ('first-conditional', 'If + present, will + verb', 'real future possibility', 'B1', r"\bif\b[^.?!]*\bwill\b|\bwill\b[^.?!]*\bif\b", [
        ('If it rains, I will stay at home.', None, {'he': 'אם ירד גשם, אשאר בבית.', 'hu': 'Ha esik az eső, otthon maradok.'}),
        ('If you study, you will pass the exam.', None, {'he': 'אם תלמד, תעבור את הבחינה.', 'hu': 'Ha tanulsz, átmész a vizsgán.'}),
        ('She will be happy if you call her.', None, {'he': 'היא תשמח אם תתקשר אליה.', 'hu': 'Örülni fog, ha felhívod.'})]),
    ('second-conditional', 'If + past, would + verb', 'unreal or unlikely situations', 'B1', r"\bif\b[^.?!]*\b(?:were|had|knew|could|won|lived)\b[^.?!]*\bwould\b|\bwould\b[^.?!]*\bif\b", [
        ('If I had more time, I would travel more.', None, {'he': 'אילו היה לי יותר זמן, הייתי מטייל יותר.', 'hu': 'Ha több időm lenne, többet utaznék.'}),
        ('If I were you, I would wait.', None, {'he': 'אילו הייתי במקומך, הייתי מחכה.', 'hu': 'A helyedben várnék.'}),
        ('What would you do if you won the lottery?', None, {'he': 'מה היית עושה אילו זכית בלוטו?', 'hu': 'Mit csinálnál, ha megnyernéd a lottót?'})]),
    ('passive', 'be + past participle', 'passive voice', 'B1', r"\b(?:is|are|was|were|been|be) (?:\w+ )?(?:[a-z]+ed|[a-z]+en|built|made|done)\b", [
        ('The window was broken by the wind.', None, {'he': 'החלון נשבר מהרוח.', 'hu': 'Az ablakot a szél törte be.'}),
        ('English is spoken all over the world.', None, {'he': 'מדברים אנגלית בכל העולם.', 'hu': 'Angolul az egész világon beszélnek.'}),
        ('This house was built in 1950.', None, {'he': 'הבית הזה נבנה ב־1950.', 'hu': 'Ezt a házat 1950-ben építették.'})]),
    ('relative-clause', 'who / which / that', 'relative clauses', 'B1', r"\b[a-z]+ (?:who|which|that) [a-z]+\b", [
        ('The man who lives next door is a doctor.', None, {'he': 'האיש שגר ליד הוא רופא.', 'hu': 'A szomszéd férfi orvos.'}),
        ('This is the book that I told you about.', None, {'he': 'זה הספר שסיפרתי לך עליו.', 'hu': 'Ez az a könyv, amiről meséltem.'}),
        ('I have a friend who speaks five languages.', None, {'he': 'יש לי חבר שמדבר חמש שפות.', 'hu': 'Van egy barátom, aki öt nyelven beszél.'})]),
    ('phrasal-verbs', 'look up / give up / turn off …', 'phrasal verbs', 'B1', r"\b(?:look|get|give|turn|pick|put|take|set|find|carry|go) (?:up|out|off|on|away|back|down)\b", [
        ('Please turn off the light.', None, {'he': 'בבקשה כבה את האור.', 'hu': 'Kérlek, oltsd le a villanyt.'}),
        ("Don't give up!", None, {'he': 'אל תוותר!', 'hu': 'Ne add fel!'}),
        ('I will look up the word in a dictionary.', None, {'he': 'אחפש את המילה במילון.', 'hu': 'Megnézem a szót a szótárban.'})]),
    ('too-enough', 'too … to / … enough to', 'excess and sufficiency', 'B1', r"\btoo [a-z]+ to\b|\b[a-z]+ enough to\b", [
        ('It is too cold to swim.', None, {'he': 'קר מדי לשחות.', 'hu': 'Túl hideg van az úszáshoz.'}),
        ('She is old enough to drive.', None, {'he': 'היא מבוגרת מספיק כדי לנהוג.', 'hu': 'Elég idős ahhoz, hogy vezessen.'}),
        ('He was too tired to talk.', None, {'he': 'הוא היה עייף מכדי לדבר.', 'hu': 'Túl fáradt volt a beszélgetéshez.'})]),
    ('so-that', 'so / such … that', 'result clauses', 'B2', r"\b(?:so|such)\b[^.?!]*\bthat\b", [
        ('It was so hot that we stayed inside.', None, {'he': 'היה כל כך חם שנשארנו בפנים.', 'hu': 'Olyan meleg volt, hogy bent maradtunk.'}),
        ('She is such a good singer that everyone loves her.', None, {'he': 'היא זמרת כל כך טובה שכולם אוהבים אותה.', 'hu': 'Olyan jó énekes, hogy mindenki szereti.'}),
        ('The film was so long that I fell asleep.', None, {'he': 'הסרט היה כל כך ארוך שנרדמתי.', 'hu': 'A film olyan hosszú volt, hogy elaludtam.'})]),
    ('wish', 'I wish + past', 'regrets and unreal wishes', 'B2', r"\bi wish\b", [
        ('I wish I had a bigger house.', None, {'he': 'הלוואי שהיה לי בית גדול יותר.', 'hu': 'Bárcsak nagyobb házam lenne.'}),
        ('I wish you were here.', None, {'he': 'הלוואי שהיית כאן.', 'hu': 'Bárcsak itt lennél.'}),
        ('I wish I could sing.', None, {'he': 'הלוואי שהייתי יכול לשיר.', 'hu': 'Bárcsak tudnék énekelni.'})]),
    ('gerund', 'enjoy / finish / keep + -ing', 'verbs followed by -ing', 'B1', r"\b(?:enjoy|enjoys|like|likes|love|loves|hate|finish|finished|stop|keep|avoid|mind) [a-z]+ing\b", [
        ('I enjoy swimming in the sea.', None, {'he': 'אני נהנה לשחות בים.', 'hu': 'Élvezem az úszást a tengerben.'}),
        ('She finished writing the report.', None, {'he': 'היא סיימה לכתוב את הדוח.', 'hu': 'Befejezte a jelentés megírását.'}),
        ('Do you mind opening the window?', None, {'he': 'אכפת לך לפתוח את החלון?', 'hu': 'Nem bánod, ha kinyitod az ablakot?'})]),
]
