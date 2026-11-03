# Portuguese sentence patterns written for Shoresh (not from a corpus; not native-reviewed).
V = r'[a-záâãçéêíóôõú]'
PATTERNS = [
    ('ser', 'ser', 'to be (identity, characteristics)', 'A1', r'\b(?:sou|és|é|somos|são|era|foi)\b', [
        ('Eu sou estudante.', 'I am a student.'),
        ('Ela é do Brasil.', 'She is from Brazil.'),
        ('Os meus pais são simpáticos.', 'My parents are nice.')]),
    ('estar', 'estar', 'to be (location, state)', 'A1', r'\b(?:estou|estás|está|estamos|estão|estava)\b', [
        ('Estou em casa.', "I'm at home."),
        ('Como está?', 'How are you?'),
        ('O livro está na mesa.', 'The book is on the table.')]),
    ('ter', 'ter', 'to have', 'A1', r'\b(?:tenho|tens|tem|temos|têm)\b', [
        ('Tenho dois irmãos.', 'I have two siblings.'),
        ('Tens fome?', 'Are you hungry?'),
        ('Ela tem vinte anos.', 'She is twenty years old.')]),
    ('ha', 'há', 'there is / there are; ago', 'A1', r'\bhá\b', [
        ('Há um café perto daqui.', 'There is a café near here.'),
        ('Não há problema.', 'No problem.'),
        ('Cheguei há duas horas.', 'I arrived two hours ago.')]),
    ('gostar-de', 'gostar de', 'to like', 'A1', r'\b(?:gosto|gostas|gosta|gostamos|gostam) d[eoa]s?\b', [
        ('Gosto de café.', 'I like coffee.'),
        ('Ela gosta de dançar.', 'She likes dancing.'),
        ('Gostamos do Porto.', 'We like Porto.')]),
    ('ir-inf', 'ir + infinitivo', 'going to (near future)', 'A1', rf'\b(?:vou|vais|vai|vamos|vão) {V}+(?:ar|er|ir|or)\b', [
        ('Vou comer agora.', "I'm going to eat now."),
        ('Amanhã vamos viajar.', "Tomorrow we're going to travel."),
        ('O que vais fazer?', 'What are you going to do?')]),
    ('querer-poder', 'querer / poder + infinitivo', 'want to / can', 'A1', rf'\b(?:quero|queres|quer|queremos|querem|posso|podes|pode|podemos|podem) {V}+(?:ar|er|ir|or)\b', [
        ('Quero aprender português.', 'I want to learn Portuguese.'),
        ('Posso entrar?', 'May I come in?'),
        ('Eles não podem vir hoje.', "They can't come today.")]),
    ('ter-que', 'ter que / ter de', 'to have to / must', 'A2', r'\b(?:tenho|tens|tem|temos|têm) (?:de|que)\b', [
        ('Tenho que trabalhar amanhã.', 'I have to work tomorrow.'),
        ('Temos de sair agora.', 'We have to leave now.'),
        ('Tens de estudar mais.', 'You have to study more.')]),
    ('estar-gerundio', 'estar a + infinitivo / gerúndio', 'to be doing (right now)', 'A2', rf'\b(?:estou|estás|está|estamos|estão) (?:a {V}+(?:ar|er|ir|or)|{V}+(?:ando|endo|indo))\b', [
        ('Estou a ler um livro.', "I'm reading a book."),
        ('Os meninos estão brincando.', 'The children are playing.'),
        ('O que estás a fazer?', 'What are you doing?')]),
    ('acabar-de', 'acabar de + infinitivo', 'to have just done', 'A2', r'\b(?:acabo|acabas|acaba|acabamos|acabam) de\b', [
        ('Acabo de chegar.', 'I have just arrived.'),
        ('Ela acabou de sair.'.replace('acabou', 'acaba'), 'She has just left.'),
        ('Acabamos de comer.', 'We have just eaten.')]),
    ('porque', 'porque / por que', 'because / why', 'A1', r'\bporque\b|\bpor que\b', [
        ('Por que estudas português?', 'Why do you study Portuguese?'),
        ('Não vou porque estou cansado.', "I'm not going because I'm tired."),
        ('Porque gosto.', 'Because I like it.')]),
    ('mais-que', 'mais … (do) que', 'more … than', 'A2', rf'\bmais {V}+ (?:do )?que\b', [
        ('O meu irmão é mais alto do que eu.', 'My brother is taller than me.'),
        ('Este livro é mais interessante que aquele.', 'This book is more interesting than that one.'),
        ('Hoje está mais frio do que ontem.', "It's colder today than yesterday.")]),
    ('querer-que', 'querer que + conjuntivo', 'want someone to … (subjunctive)', 'B1', r'\b(?:quero|queres|quer|queremos|querem|espero|preciso) que\b', [
        ('Quero que venhas.', 'I want you to come.'),
        ('Espero que tenhas um bom dia.', 'I hope you have a nice day.'),
        ('Preciso que me ajudes.', 'I need you to help me.')]),
    ('se-imperfeito', 'se + conjuntivo imperfeito', 'if … (hypothetical)', 'B2', r'\bse\b[^.?!]*\b(?:tivesse|pudesse|fosse|soubesse|fizesse|morasse|estivesse)s?\b', [
        ('Se eu tivesse dinheiro, viajava mais.', 'If I had money, I would travel more.'),
        ('Se fosses tu, não ia.', "If I were you, I wouldn't go."),
        ('Se eu soubesse, dizia-te.', 'If I knew, I would tell you.')]),
]
