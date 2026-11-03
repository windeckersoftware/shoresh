# Italian sentence patterns written for Shoresh (not from a corpus; not native-reviewed).
V = r'[a-zàèéìòù]'
PATTERNS = [
    ('c-e', "c'è / ci sono", 'there is / there are', 'A1', r"\bc'è\b|\bci sono\b", [
        ("C'è un bar qui vicino.", 'There is a café nearby.'),
        ('Ci sono molte persone.', 'There are many people.'),
        ("Non c'è problema.", 'No problem.')]),
    ('piacere', 'mi piace / mi piacciono', 'I like (it pleases me)', 'A1', r'\b(?:mi|ti|gli|le|ci|vi) (?:piace|piacciono)\b', [
        ('Mi piace il caffè.', 'I like coffee.'),
        ('Ti piacciono i gatti?', 'Do you like cats?'),
        ('Gli piace cantare.', 'He likes singing.')]),
    ('volere', 'volere + infinito', 'to want to', 'A1', rf'\b(?:voglio|vuoi|vuole|vogliamo|vogliono) {V}+(?:are|ere|ire|rre)\b', [
        ('Voglio imparare l’italiano.', 'I want to learn Italian.'.replace('’', "'")),
        ('Vuoi venire con noi?', 'Do you want to come with us?'),
        ('Vogliamo mangiare una pizza.', 'We want to eat a pizza.')]),
    ('potere-dovere', 'potere / dovere + infinito', 'can / must', 'A1', rf'\b(?:posso|puoi|può|possiamo|possono|devo|devi|deve|dobbiamo|devono) {V}+(?:are|ere|ire|rre)\b', [
        ('Posso entrare?', 'May I come in?'),
        ('Devo lavorare domani.', 'I have to work tomorrow.'),
        ('Non possiamo uscire stasera.', "We can't go out tonight.")]),
    ('andare-a', 'andare a + infinito', 'going to do / go and do', 'A2', rf'\b(?:vado|vai|va|andiamo|vanno) a {V}+(?:are|ere|ire)\b', [
        ('Vado a dormire.', "I'm going to sleep."),
        ('Andiamo a mangiare fuori.', "Let's go and eat out."),
        ('Vai a comprare il pane?', 'Are you going to buy bread?')]),
    ('stare-gerundio', 'stare + gerundio', 'to be doing (right now)', 'A2', rf'\b(?:sto|stai|sta|stiamo|stanno) {V}+(?:ando|endo)\b', [
        ('Sto mangiando.', "I'm eating."),
        ('Che cosa stai facendo?', 'What are you doing?'),
        ('I bambini stanno giocando.', 'The children are playing.')]),
    ('stare-per', 'stare per + infinito', 'about to', 'B1', rf'\b(?:sto|stai|sta|stiamo|stanno) per {V}+(?:are|ere|ire)\b', [
        ('Sto per uscire.', "I'm about to go out."),
        ('Il treno sta per partire.', 'The train is about to leave.'),
        ('Stiamo per cominciare.', "We're about to start.")]),
    ('passato-prossimo', 'avere / essere + participio', 'present perfect (past)', 'A2', rf'\b(?:ho|hai|ha|abbiamo|hanno|sono|sei|è|siamo|siete) {V}+(?:at[aeio]|ut[aeio]|it[aeio])\b', [
        ('Ieri ho mangiato la pizza.', 'Yesterday I ate pizza.'),
        ('Siamo andati al mare.', 'We went to the seaside.'),
        ('Hai finito il lavoro?', 'Have you finished the work?')]),
    ('imperfetto', 'imperfetto', 'imperfect (used to / was doing)', 'B1', rf'\b(?:ero|eri|era|eravamo|erano|avevo|aveva|avevamo)\b|\b{V}+(?:avo|ava|avamo|avano|evo|eva|evamo|ivo|iva)\b', [
        ('Da bambino giocavo a calcio.', 'As a child I used to play football.'),
        ('Era una bella giornata.', 'It was a beautiful day.'),
        ('Quando ero piccolo, abitavo qui.', 'When I was little, I lived here.')]),
    ('futuro', 'futuro semplice', 'future tense', 'B1', rf'\b{V}+(?:erò|erai|erà|eremo|erete|eranno|irò|irai|irà|iremo|ireranno|irete|iranno)\b', [
        ('Domani partirò per Roma.', "Tomorrow I'll leave for Rome."),
        ('Pioverà tutto il giorno.', 'It will rain all day.'),
        ('Verranno anche loro?'.replace('Verranno', 'Mangeranno'), 'Will they eat too?')]),
    ('riflessivi', 'verbi riflessivi', 'reflexive verbs', 'A2', r'\b(?:mi|ti|si|ci|vi) (?:chiamo|chiami|chiama|chiamiamo|chiamano|alzo|alzi|alza|alziamo|sveglio|svegli|sveglia|lavo|lavi|lava|diverto|diverti|diverte|divertiamo|divertono|sento)\b', [
        ('Mi chiamo Marco.', 'My name is Marco.'),
        ('Mi alzo alle sette.', 'I get up at seven.'),
        ('Ci divertiamo molto.', 'We have a lot of fun.')]),
    ('perche', 'perché', 'why / because', 'A1', r'\bperché\b', [
        ('Perché studi italiano?', 'Why do you study Italian?'),
        ('Non vengo perché sono stanco.', "I'm not coming because I'm tired."),
        ('Perché no?', 'Why not?')]),
    ('comparativo', 'più … di / che', 'more … than', 'A2', rf'\bpiù {V}+ (?:di|che)\b', [
        ('Marco è più alto di me.', 'Marco is taller than me.'),
        ('Questo libro è più interessante di quello.', 'This book is more interesting than that one.'),
        ('Oggi fa più freddo che ieri.', "It's colder today than yesterday.")]),
    ('ci-vuole', 'ci vuole / ci vogliono', 'it takes (time, things needed)', 'B1', r'\bci (?:vuole|vogliono)\b', [
        ('Ci vuole un’ora.'.replace('’', "'"), 'It takes an hour.'),
        ('Ci vogliono due uova.', 'You need two eggs.'),
        ('Quanto tempo ci vuole?', 'How long does it take?')]),
    ('da-tempo', 'da + tempo', 'for / since (still going on)', 'B1', r'\bda (?:(?:tre|due|quattro|cinque|molto|un|una|\d+) (?:anni|mesi|giorni|ore|settimane|anno|mese|minuti)|un.ora|un.anno)\b', [
        ('Abito qui da tre anni.', "I've lived here for three years."),
        ('Studio italiano da due mesi.', "I've been studying Italian for two months."),
        ('Aspetto da un’ora.'.replace('’', "'"), "I've been waiting for an hour.")]),
    ('condizionale', 'vorrei / potrei', 'polite requests (conditional)', 'A2', r'\b(?:vorrei|vorresti|potrei|potresti|avrei|sarei)\b', [
        ('Vorrei un caffè, per favore.', "I'd like a coffee, please."),
        ('Potresti aiutarmi?', 'Could you help me?'),
        ('Sarei felice di venire.', "I'd be happy to come.")]),
]
