# German sentence patterns written for Shoresh (not from a corpus; not native-reviewed).
PATTERNS = [
    ('haben', 'haben', 'to have', 'A1', r'\b(?:habe|hast|hat|haben|habt)\b', [
        ('Ich habe einen Bruder.', 'I have a brother.'),
        ('Hast du Zeit?', 'Do you have time?'),
        ('Wir haben Hunger.', "We're hungry.")]),
    ('nicht-kein', 'nicht / kein', 'not / no', 'A1', r'\bnicht\b|\bkein(?:e|en|em|er|es)?\b', [
        ('Ich verstehe das nicht.', "I don't understand that."),
        ('Er hat kein Auto.', "He doesn't have a car."),
        ('Das ist nicht teuer.', "That isn't expensive.")]),
    ('es-gibt', 'es gibt', 'there is / there are', 'A1', r'\bes gibt\b|\bgibt es\b', [
        ('Es gibt viele Restaurants hier.', 'There are many restaurants here.'),
        ('Gibt es hier ein Café?', 'Is there a café here?'),
        ('Heute gibt es Fisch.', "There's fish today.")]),
    ('w-fragen', 'W-Fragen', 'question words (who, what, where…)', 'A1', r'^(?:wer|was|wo|wann|warum|wie|wohin|woher|welche[rsmn]?)\b', [
        ('Wo wohnst du?', 'Where do you live?'),
        ('Wie heißt du?', "What's your name?"),
        ('Warum lernst du Deutsch?', 'Why are you learning German?')]),
    ('modalverb', 'Modalverb + Infinitiv am Ende', 'modal verb with the infinitive at the end', 'A2', r'\b(?:kann|kannst|können|muss|musst|müssen|will|willst|wollen|soll|sollst|sollen|darf|darfst|dürfen|möchte|möchtest|möchten) [^.?!]*[a-zäöüß]+en[.?!]?$', [
        ('Ich kann gut schwimmen.', 'I can swim well.'),
        ('Wir müssen heute arbeiten.', 'We have to work today.'),
        ('Möchtest du einen Kaffee trinken?', 'Would you like to drink a coffee?')]),
    ('perfekt', 'haben / sein + Partizip II', 'present perfect (conversational past)', 'A2', r'\b(?:habe|hast|hat|haben|habt|bin|bist|ist|sind|seid) [^.?!]*\bge[a-zäöüß]+(?:t|en)\b', [
        ('Ich habe gestern Fußball gespielt.', 'I played football yesterday.'),
        ('Wir sind nach Berlin gefahren.', 'We drove to Berlin.'),
        ('Hast du schon gegessen?', 'Have you already eaten?')]),
    ('praeteritum', 'war / hatte', 'simple past of sein and haben', 'A2', r'\b(?:war|waren|warst|hatte|hatten|hattest)\b', [
        ('Ich war gestern krank.', 'I was ill yesterday.'),
        ('Wir hatten viel Spaß.', 'We had a lot of fun.'),
        ('Wo warst du?', 'Where were you?')]),
    ('trennbar', 'trennbare Verben', 'separable verbs (prefix goes to the end)', 'A2', r'\b(?:stehe|stehst|steht|rufe|rufst|ruft|kaufe|kaufst|kauft|kaufen|fange|fängst|fängt|komme|kommst|kommt|sehe|siehst|sieht|nehme|nimmst|nimmt|mache|machst|macht|steige|steigt) [^.?!]*\b(?:auf|an|ein|aus|mit|zu|ab|vor|fern|zurück)[.?!]$', [
        ('Ich stehe um sieben Uhr auf.', 'I get up at seven.'),
        ('Er ruft mich morgen an.', 'He will call me tomorrow.'),
        ('Wir kaufen heute im Supermarkt ein.', 'We are shopping at the supermarket today.')]),
    ('weil', 'weil + Verb am Ende', 'because (verb goes to the end)', 'A2', r'\bweil\b', [
        ('Ich bleibe zu Hause, weil ich krank bin.', "I'm staying home because I'm ill."),
        ('Er lernt Deutsch, weil er in Berlin arbeitet.', 'He learns German because he works in Berlin.'),
        ('Warum lachst du? – Weil das lustig ist.', 'Why are you laughing? – Because it is funny.')]),
    ('dass', 'dass-Satz', 'that-clause', 'A2', r'\bdass\b', [
        ('Ich glaube, dass er kommt.', 'I think that he is coming.'),
        ('Es ist schön, dass du hier bist.', "It's nice that you're here."),
        ('Sie sagt, dass sie müde ist.', 'She says that she is tired.')]),
    ('wenn', 'wenn', 'if / whenever', 'A2', r'\bwenn\b', [
        ('Wenn es regnet, bleibe ich zu Hause.', "If it rains, I stay at home."),
        ('Ruf mich an, wenn du Zeit hast.', 'Call me when you have time.'),
        ('Wenn ich Zeit habe, lese ich.', 'Whenever I have time, I read.')]),
    ('dativ-praep', 'Präposition + Dativ', 'prepositions that take the dative (mit, nach, bei, von, zu, aus, seit)', 'A2', r'\b(?:mit|nach|bei|von|zu|aus|seit) (?:(?:d|ein|mein|dein|sein|ihr|unser|euer|dies)(?:em|er)|ihm|ihr|uns)\b', [
        ('Ich fahre mit dem Bus.', 'I go by bus.'),
        ('Sie wohnt bei ihrer Oma.', 'She lives with her grandma.'),
        ('Ich komme aus der Schweiz.', 'I come from Switzerland.')]),
    ('futur', 'werden + Infinitiv', 'future', 'B1', r'\b(?:werde|wirst|wird|werden|werdet) [^.?!]*[a-zäöüß]+en[.?!]?$', [
        ('Ich werde morgen kommen.', 'I will come tomorrow.'),
        ('Es wird bald regnen.', 'It will rain soon.'),
        ('Wir werden sehen.', "We'll see.")]),
    ('passiv', 'werden + Partizip II', 'passive voice', 'B1', r'\b(?:wird|werden|wurde|wurden) [^.?!]*\bge[a-zäöüß]+(?:t|en)\b', [
        ('Das Haus wird gebaut.', 'The house is being built.'),
        ('Der Brief wurde gestern geschrieben.', 'The letter was written yesterday.'),
        ('Hier werden Autos gewaschen.', 'Cars are washed here.')]),
    ('reflexiv', 'reflexive Verben', 'reflexive verbs (sich freuen, sich beeilen)', 'B1', r'\b(?:mich|dich|sich|uns|euch)\b', [
        ('Ich freue mich auf das Wochenende.', "I'm looking forward to the weekend."),
        ('Beeil dich!', 'Hurry up!'),
        ('Er interessiert sich für Musik.', 'He is interested in music.')]),
    ('um-zu', 'um … zu + Infinitiv', 'in order to', 'B1', r'\bum\b[^.?!]*\bzu\b', [
        ('Ich lerne, um besser zu sprechen.', 'I study in order to speak better.'),
        ('Er geht zum Bäcker, um Brot zu kaufen.', 'He goes to the baker to buy bread.'),
        ('Sie spart Geld, um eine Reise zu machen.', 'She saves money to go on a trip.')]),
    ('konjunktiv2', 'Konjunktiv II', 'would / could / were (polite or hypothetical)', 'B1', r'\b(?:würde|würdest|würden|hätte|hättest|hätten|wäre|wärst|wären|könnte|könntest|könnten)\b', [
        ('Ich hätte gern einen Tee.', "I'd like a tea."),
        ('Könntest du mir helfen?', 'Could you help me?'),
        ('Wenn ich reich wäre, würde ich reisen.', 'If I were rich, I would travel.')]),
    ('relativsatz', 'Relativsatz', 'relative clause (der, die, das…)', 'B1', r', (?:(?:mit|von|in|auf|an|für|zu|bei|aus) )?(?:der|die|das|den|dem|dessen|denen) ', [
        ('Der Mann, der dort steht, ist mein Vater.', 'The man who is standing there is my father.'),
        ('Das Buch, das ich lese, ist spannend.', 'The book I am reading is exciting.'),
        ('Die Frau, mit der ich spreche, ist Ärztin.', 'The woman I am talking to is a doctor.')]),
    ('obwohl', 'obwohl', 'although', 'B1', r'\bobwohl\b', [
        ('Ich gehe raus, obwohl es regnet.', "I'm going out although it's raining."),
        ('Obwohl er müde war, hat er gearbeitet.', 'Although he was tired, he worked.'),
        ('Sie lacht, obwohl sie traurig ist.', 'She laughs although she is sad.')]),
    ('deshalb', 'deshalb / trotzdem', 'therefore / nevertheless (verb comes next)', 'B1', r'\b(?:deshalb|deswegen|trotzdem|darum)\b', [
        ('Ich bin krank, deshalb bleibe ich zu Hause.', "I'm ill, so I'm staying home."),
        ('Es regnet, trotzdem gehen wir spazieren.', "It's raining; we're going for a walk anyway."),
        ('Er hat Hunger, deswegen kocht er.', "He's hungry, that's why he is cooking.")]),
    ('nicht-nur', 'nicht nur … sondern auch', 'not only … but also', 'B1', r'\bnicht nur\b.+\bsondern auch\b', [
        ('Er spricht nicht nur Deutsch, sondern auch Spanisch.', 'He speaks not only German but also Spanish.'),
        ('Das ist nicht nur billig, sondern auch gut.', 'This is not only cheap but also good.'),
        ('Sie ist nicht nur klug, sondern auch nett.', 'She is not only smart but also nice.')]),
    ('weder-noch', 'weder … noch', 'neither … nor', 'B2', r'\bweder\b.+\bnoch\b', [
        ('Ich trinke weder Kaffee noch Tee.', 'I drink neither coffee nor tea.'),
        ('Er hat weder Zeit noch Geld.', 'He has neither time nor money.'),
        ('Sie ist weder müde noch hungrig.', 'She is neither tired nor hungry.')]),
]
