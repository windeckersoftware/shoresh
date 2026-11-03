# Spanish sentence patterns written for Shoresh (not from a corpus; not native-reviewed).
# (id, pattern, English gloss, CEFR, regex, [(sentence, English), ...])
V = r'[a-záéíóúñü]'
PATTERNS = [
    ('ser', 'ser', 'to be (identity, origin, characteristics)', 'A1', r'\b(?:soy|eres|es|somos|son|era|fue)\b', [
        ('Soy estudiante.', 'I am a student.'),
        ('Ella es de México.', 'She is from Mexico.'),
        ('Mis padres son muy simpáticos.', 'My parents are very nice.')]),
    ('estar', 'estar', 'to be (location, state)', 'A1', r'\b(?:estoy|estás|está|estamos|están|estaba)\b', [
        ('Estoy en casa.', "I'm at home."),
        ('¿Cómo estás?', 'How are you?'),
        ('El libro está sobre la mesa.', 'The book is on the table.')]),
    ('hay', 'hay', 'there is / there are', 'A1', r'\bhay\b', [
        ('Hay un parque cerca de aquí.', 'There is a park near here.'),
        ('¿Hay leche en la nevera?', 'Is there milk in the fridge?'),
        ('No hay problema.', 'No problem.')]),
    ('tener', 'tener', 'to have (also age)', 'A1', r'\b(?:tengo|tienes|tiene|tenemos|tienen)\b', [
        ('Tengo dos hermanos.', 'I have two siblings.'),
        ('Mi hija tiene cinco años.', 'My daughter is five years old.'),
        ('¿Tienes hambre?', 'Are you hungry?')]),
    ('gustar', 'me gusta(n)', 'I like (it pleases me)', 'A1', r'\b(?:me|te|le|nos|les) (?:gusta|gustan)\b', [
        ('Me gusta el café.', 'I like coffee.'),
        ('A ella le gustan los gatos.', 'She likes cats.'),
        ('¿Te gusta bailar?', 'Do you like dancing?')]),
    ('ir-a', 'ir a + infinitivo', 'going to (near future)', 'A1', rf'\b(?:voy|vas|va|vamos|van) a {V}+(?:ar|er|ir)\b', [
        ('Voy a comer ahora.', "I'm going to eat now."),
        ('Mañana vamos a viajar.', "Tomorrow we're going to travel."),
        ('¿Qué vas a hacer?', 'What are you going to do?')]),
    ('querer', 'querer + infinitivo', 'to want to', 'A1', rf'\b(?:quiero|quieres|quiere|queremos|quieren) {V}+(?:ar|er|ir)\b', [
        ('Quiero aprender español.', 'I want to learn Spanish.'),
        ('¿Quieres venir con nosotros?', 'Do you want to come with us?'),
        ('Ellos quieren comprar una casa.', 'They want to buy a house.')]),
    ('poder', 'poder + infinitivo', 'can / to be able to', 'A1', rf'\b(?:puedo|puedes|puede|podemos|pueden) {V}+(?:ar|er|ir)\b', [
        ('¿Puedo entrar?', 'May I come in?'),
        ('No podemos salir hoy.', "We can't go out today."),
        ('Ella puede hablar tres idiomas.', 'She can speak three languages.')]),
    ('tener-que', 'tener que + infinitivo', 'to have to / must', 'A2', r'\b(?:tengo|tienes|tiene|tenemos|tienen) que\b', [
        ('Tengo que trabajar mañana.', 'I have to work tomorrow.'),
        ('Tienes que estudiar más.', 'You have to study more.'),
        ('Tenemos que irnos.', 'We have to leave.')]),
    ('estar-gerundio', 'estar + gerundio', 'to be doing (right now)', 'A2', rf'\b(?:estoy|estás|está|estamos|están) {V}+(?:ando|iendo|yendo)\b', [
        ('Estoy leyendo un libro.', "I'm reading a book."),
        ('Los niños están jugando.', 'The children are playing.'),
        ('¿Qué estás haciendo?', 'What are you doing?')]),
    ('perfecto', 'haber + participio', 'present perfect (have done)', 'A2', rf'\b(?:he|has|ha|hemos|han) {V}+(?:ado|ido|to|cho)\b', [
        ('Hoy he comido muy bien.', 'Today I have eaten very well.'),
        ('¿Has visitado Madrid?', 'Have you visited Madrid?'),
        ('Todavía no hemos terminado.', "We haven't finished yet.")]),
    ('acabar-de', 'acabar de + infinitivo', 'to have just done', 'A2', r'\b(?:acabo|acabas|acaba|acabamos|acaban) de\b', [
        ('Acabo de llegar.', 'I have just arrived.'),
        ('Ella acaba de salir.', 'She has just left.'),
        ('Acabamos de comer.', 'We have just eaten.')]),
    ('por-que', '¿por qué? / porque', 'why? / because', 'A1', r'\bpor qué\b|\bporque\b', [
        ('¿Por qué estudias español?', 'Why do you study Spanish?'),
        ('No voy porque estoy cansado.', "I'm not going because I'm tired."),
        ('Porque me gusta.', 'Because I like it.')]),
    ('para-inf', 'para + infinitivo', 'in order to', 'A2', rf'\bpara {V}+(?:ar|er|ir)\b', [
        ('Estudio para aprender.', 'I study in order to learn.'),
        ('Voy al mercado para comprar fruta.', 'I go to the market to buy fruit.'),
        ('Necesito dinero para viajar.', 'I need money to travel.')]),
    ('comparativo', 'más … que', 'more … than', 'A2', rf'\bmás {V}+ que\b', [
        ('Mi hermano es más alto que yo.', 'My brother is taller than me.'),
        ('Este libro es más interesante que ese.', 'This book is more interesting than that one.'),
        ('Hoy hace más frío que ayer.', "It's colder today than yesterday.")]),
    ('hace-tiempo', 'hace + tiempo', 'ago / for (a length of time)', 'B1', r'\bhace (?:un|una|dos|tres|cuatro|cinco|seis|diez|mucho|poco|\d+)\b[^.?!]*\b(?:años?|días?|meses|mes|horas?|semanas?|minutos|rato|tiempo)\b', [
        ('Llegué hace dos horas.', 'I arrived two hours ago.'),
        ('Vivo aquí desde hace tres años.', "I've lived here for three years."),
        ('Hace mucho tiempo que no te veo.', "I haven't seen you for a long time.")]),
    ('se-impersonal', 'se + verbo', 'impersonal / passive "se" (one …, … is …)', 'B1', r'\bse (?:habla|hablan|puede|pueden|dice|necesita|vende|venden|prohíbe)\b', [
        ('Aquí se habla español.', 'Spanish is spoken here.'),
        ('¿Se puede fumar aquí?', 'Can one smoke here?'),
        ('Se venden casas.', 'Houses for sale.')]),
    ('subjuntivo-que', 'querer / esperar que + subjuntivo', 'want / hope that someone does (subjunctive)', 'B1', r'\b(?:quiero|quieres|quiere|queremos|quieren|espero|esperas|necesito|prefiero) que\b', [
        ('Quiero que vengas.', 'I want you to come.'),
        ('Espero que tengas un buen día.', 'I hope you have a nice day.'),
        ('Necesito que me ayudes.', 'I need you to help me.')]),
    ('si-imperfecto', 'si + imperfecto de subjuntivo', 'if … (hypothetical)', 'B2', r'\bsi [^,.?!]*\b(?:tuviera|pudiera|fuera|supiera|hiciera|viviera|estuviera|tuviese|fuese)\b', [
        ('Si tuviera dinero, viajaría más.', 'If I had money, I would travel more.'),
        ('Si fuera tú, no iría.', "If I were you, I wouldn't go."),
        ('Si supiera la respuesta, te la diría.', 'If I knew the answer, I would tell you.')]),
    ('ojala', 'ojalá + subjuntivo', 'I hope / if only', 'B2', r'\bojalá\b', [
        ('Ojalá llueva mañana.', 'I hope it rains tomorrow.'),
        ('Ojalá pudiera ir contigo.', 'I wish I could go with you.'),
        ('¡Ojalá!', 'Hopefully!')]),
    ('lo-que', 'lo que …', 'what / the thing that', 'B1', r'\blo que\b', [
        ('No entiendo lo que dices.', "I don't understand what you're saying."),
        ('Lo que más me gusta es el mar.', 'What I like most is the sea.'),
        ('Haz lo que quieras.', 'Do what you want.')]),
]
