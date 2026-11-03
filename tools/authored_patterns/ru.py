# Russian sentence patterns written for Shoresh (not from a corpus; not native-reviewed).
PATTERNS = [
    ('ne', 'не', 'not', 'A1', r'\bне\b', [
        ('Я не знаю.', "I don't know."),
        ('Он не работает сегодня.', "He isn't working today."),
        ('Это не дорого.', "It's not expensive.")]),
    ('u-menya', 'у меня есть …', 'I have … (У + genitive)', 'A1', r'\bу (?:меня|тебя|него|неё|нас|вас|них)\b', [
        ('У меня есть брат.', 'I have a brother.'),
        ('У тебя есть время?', 'Do you have time?'),
        ('У нас нет машины.', "We don't have a car.")]),
    ('nravitsya', 'мне нравится …', 'I like … (it pleases me)', 'A1', r'\b(?:мне|тебе|ему|ей|нам|вам|им) нрав(?:ится|ятся)\b', [
        ('Мне нравится кофе.', 'I like coffee.'),
        ('Ей нравятся кошки.', 'She likes cats.'),
        ('Тебе нравится этот город?', 'Do you like this city?')]),
    ('hotet', 'хотеть + инфинитив', 'to want to', 'A1', r'\b(?:хочу|хочешь|хочет|хотим|хотите|хотят) [а-яё]+(?:ть|ти|чь)\b', [
        ('Я хочу учить русский.', 'I want to study Russian.'),
        ('Ты хочешь пойти с нами?'.replace('пойти', 'идти'), 'Do you want to go with us?'),
        ('Они хотят купить дом.', 'They want to buy a house.')]),
    ('moch', 'мочь + инфинитив', 'can / to be able to', 'A2', r'\b(?:могу|можешь|может|можем|можете|могут) (?:[а-яё]+ )?[а-яё]+(?:ть|ти|чь)\b', [
        ('Я могу говорить по-русски.', 'I can speak Russian.'),
        ('Ты можешь мне помочь?', 'Can you help me?'),
        ('Мы не можем прийти.', "We can't come.")]),
    ('byl', 'был / была / было / были', 'past of "to be"', 'A1', r'\b(?:был|была|было|были)\b', [
        ('Вчера я был дома.', 'Yesterday I was at home.'),
        ('Она была в Москве.', 'She was in Moscow.'),
        ('Там было много людей.', 'There were many people there.')]),
    ('budu', 'буду + инфинитив', 'future (imperfective)', 'A2', r'\b(?:буду|будешь|будет|будем|будете|будут)\b', [
        ('Завтра я буду работать.', 'Tomorrow I will be working.'),
        ('Мы будем ужинать дома.', 'We will have dinner at home.'),
        ('Что ты будешь делать?', 'What will you be doing?')]),
    ('nuzhno', 'нужно / надо / можно / нельзя', 'it is necessary / allowed / forbidden', 'A2', r'\b(?:нужно|надо|можно|нельзя)\b', [
        ('Мне надо идти.', 'I have to go.'),
        ('Здесь можно курить?', 'Is smoking allowed here?'),
        ('Нельзя опаздывать.', 'One must not be late.')]),
    ('potomu-chto', 'потому что / поэтому', 'because / therefore', 'A2', r'\bпотому что\b|\bпоэтому\b', [
        ('Я дома, потому что я болен.', "I'm at home because I'm ill."),
        ('Шёл дождь, поэтому мы остались.', 'It was raining, so we stayed.'),
        ('Почему? – Потому что я устал.', 'Why? – Because I am tired.')]),
    ('chtoby', 'чтобы', 'in order to / so that', 'B1', r'\bчтобы\b', [
        ('Я учу русский, чтобы читать книги.', 'I study Russian in order to read books.'),
        ('Он пришёл, чтобы помочь.', 'He came to help.'),
        ('Я хочу, чтобы ты пришёл.', 'I want you to come.')]),
    ('esli', 'если', 'if', 'A2', r'\bесли\b', [
        ('Если будет дождь, я останусь дома.', "If it rains, I'll stay home."),
        ('Позвони мне, если хочешь.', 'Call me if you want.'),
        ('Если ты устал, отдохни.', "If you're tired, rest.")]),
    ('kotoryj', 'который', 'relative clause (who / which)', 'B1', r'\bкотор(?:ый|ая|ое|ые|ого|ому|ым|ой|ую|ых|ыми|ом)\b', [
        ('Человек, который там стоит, мой отец.', 'The man who is standing there is my father.'),
        ('Книга, которую я читаю, интересная.', 'The book I am reading is interesting.'),
        ('Это дом, в котором я живу.', 'This is the house I live in.')]),
    ('v-na-prep', 'в / на + предложный падеж', 'in / on + prepositional case (location)', 'A1', r'\b(?:в|на) [а-яё]+(?:е|и|ии)\b', [
        ('Я живу в Москве.', 'I live in Moscow.'),
        ('Книга лежит на столе.', 'The book is lying on the table.'),
        ('Мы были в школе.', 'We were at school.')]),
    ('sravnenie', 'больше / меньше / лучше / хуже', 'comparatives', 'A2', r'\b(?:больше|меньше|лучше|хуже)\b', [
        ('Сегодня лучше, чем вчера.', 'Today is better than yesterday.'),
        ('У меня меньше времени.', 'I have less time.'),
        ('Он говорит больше, чем я.', 'He talks more than I do.')]),
    ('sya', 'возвратные глаголы -ся', 'reflexive verbs', 'B1', r'\b[а-яё]+(?:ся|сь)\b', [
        ('Меня зовут Анна.'.replace('Меня зовут', 'Я учусь'), 'I am studying.'),
        ('Мы встретились в кафе.', 'We met in a café.'),
        ('Он вернулся домой.', 'He returned home.')]),
]
