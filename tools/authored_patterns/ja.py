# Japanese sentence patterns written for Shoresh (not from a corpus; not native-reviewed).
PATTERNS = [
    ('wa-desu', 'A は B です', 'A is B', 'A1', r'は.+です', [
        ('私は学生です。', 'I am a student.'),
        ('これは本です。', 'This is a book.'),
        ('田中さんは先生です。', 'Mr. Tanaka is a teacher.')]),
    ('wo', '〜を + 動詞', 'object marker', 'A1', r'を', [
        ('水を飲みます。', 'I drink water.'),
        ('本を読みます。', 'I read a book.'),
        ('テレビを見ました。', 'I watched TV.')]),
    ('ka', '〜ですか / 〜ますか', 'question', 'A1', r'(?:です|ます)か', [
        ('学生ですか。', 'Are you a student?'),
        ('コーヒーを飲みますか。', 'Do you drink coffee?'),
        ('これはいくらですか。', 'How much is this?')]),
    ('masu', '〜ます / 〜ません', 'polite present (affirmative / negative)', 'A1', r'ます|ません', [
        ('毎日、学校に行きます。', 'I go to school every day.'),
        ('肉は食べません。', "I don't eat meat."),
        ('朝ご飯を食べます。', 'I eat breakfast.')]),
    ('mashita', '〜ました / 〜ませんでした', 'polite past', 'A1', r'ました|ませんでした', [
        ('昨日、映画を見ました。', 'I saw a movie yesterday.'),
        ('朝ご飯を食べませんでした。', "I didn't eat breakfast."),
        ('友達に会いました。', 'I met a friend.')]),
    ('ni-iku', '場所に行く / 来る / 帰る', 'go / come / return to a place (に)', 'A1', r'に(?:行|来|帰)', [
        ('明日、東京に行きます。', "I'm going to Tokyo tomorrow."),
        ('六時に家に帰ります。', 'I return home at six.'),
        ('友達が日本に来ました。', 'A friend came to Japan.')]),
    ('de-place', '場所で + 動詞', 'place of action (で)', 'A1', r'で[^、。]{0,10}(?:食べ|飲み|勉強|働|買い|会い|遊び|見|読み|します|する)', [
        ('図書館で勉強します。', 'I study at the library.'),
        ('レストランで昼ご飯を食べました。', 'I ate lunch at a restaurant.'),
        ('公園で友達と遊びました。', 'I played with friends in the park.')]),
    ('ga-aru', '〜がある / いる', 'there is (inanimate / animate)', 'A1', r'が(?:あ(?:る|ります|りません|った|りました)|い(?:る|ます|ません|た|ました))', [
        ('机の上に本があります。', 'There is a book on the desk.'),
        ('庭に犬がいます。', 'There is a dog in the garden.'),
        ('時間がありません。', "I don't have time.")]),
    ('tai', '〜たい', 'want to do', 'A2', r'たい', [
        ('日本に行きたいです。', 'I want to go to Japan.'),
        ('水が飲みたい。', 'I want to drink water.'),
        ('何を食べたいですか。', 'What do you want to eat?')]),
    ('te-iru', '〜ている', 'doing (progressive) / state', 'A2', r'(?:て|で)(?:い|お)(?:る|ます|ません|た|ない)', [
        ('今、勉強しています。', "I'm studying now."),
        ('彼は東京に住んでいます。', 'He lives in Tokyo.'),
        ('雨が降っている。', "It's raining.")]),
    ('nai', '〜ない', 'plain negative', 'A2', r'ない', [
        ('私は肉を食べない。', "I don't eat meat."),
        ('今日は行かない。', "I'm not going today."),
        ('それは高くない。', "That isn't expensive.")]),
    ('te-kudasai', '〜てください', 'please do', 'A1', r'(?:て|で)ください', [
        ('ゆっくり話してください。', 'Please speak slowly.'),
        ('ここに名前を書いてください。', 'Please write your name here.'),
        ('もう一度言ってください。', 'Please say it once more.')]),
    ('kara', '〜から', 'because / since (reason)', 'A2', r'から', [
        ('雨が降っているから、行きません。', "It's raining, so I won't go."),
        ('疲れたから、早く寝ます。', "I'm tired, so I'll sleep early."),
        ('おいしいから、よく食べます。', "It's tasty, so I eat it often.")]),
    ('node', '〜ので', 'because (softer, explaining)', 'B1', r'ので', [
        ('忙しいので、行けません。', "I'm busy, so I can't go."),
        ('道が混んでいたので、遅れました。', 'I was late because the road was crowded.'),
        ('足が痛いので、休みます。', 'My foot hurts, so I will rest.')]),
    ('koto-ga-aru', '〜たことがある', 'have done before (experience)', 'A2', r'たことが(?:あ|な)(?:る|ります|い|りません)', [
        ('富士山に登ったことがあります。', 'I have climbed Mt. Fuji.'),
        ('寿司を食べたことがありますか。', 'Have you ever eaten sushi?'),
        ('日本へ行ったことがありません。', "I've never been to Japan.")]),
    ('to-omou', '〜と思う', 'I think that …', 'A2', r'と思(?:う|います|った|いました)', [
        ('明日は雨だと思います。', 'I think it will rain tomorrow.'),
        ('彼は来ると思う。', 'I think he will come.'),
        ('これはいいと思いました。', 'I thought this was good.')]),
    ('nakereba', '〜なければならない', 'must / have to', 'B1', r'なければなりません|なければならない|なくてはいけません|なくてはいけない|なきゃ', [
        ('もう帰らなければなりません。', 'I have to go home now.'),
        ('宿題をしなくてはいけない。', 'I must do my homework.'),
        ('早く寝なきゃ。', 'I have to go to bed early.')]),
    ('nagara', '〜ながら', 'while doing', 'B1', r'ながら', [
        ('音楽を聞きながら勉強します。', 'I study while listening to music.'),
        ('歩きながら話しましょう。', "Let's talk while walking."),
        ('ご飯を食べながらテレビを見る。', 'I watch TV while eating.')]),
    ('temo-ii', '〜てもいい', 'may / it is OK to', 'A2', r'(?:て|で)もいい', [
        ('ここに座ってもいいですか。', 'May I sit here?'),
        ('写真を撮ってもいいです。', 'You may take photos.'),
        ('もう帰ってもいい？', 'Can I go home now?')]),
    ('yori', 'A は B より〜', 'A is more … than B', 'A2', r'より', [
        ('今日は昨日より暑いです。', 'Today is hotter than yesterday.'),
        ('電車はバスより速いです。', 'Trains are faster than buses.'),
        ('私は兄より背が低いです。', 'I am shorter than my older brother.')]),
    ('tara', '〜たら', 'if / when (conditional)', 'B1', r'たら', [
        ('雨が降ったら、行きません。', "If it rains, I won't go."),
        ('家に着いたら、電話します。', "When I get home, I'll call."),
        ('安かったら、買います。', "If it's cheap, I'll buy it.")]),
    ('hou-ga-ii', '〜たほうがいい', 'you should', 'B1', r'(?:た|だ|ない)(?:ほう|方)がいい', [
        ('早く寝たほうがいいですよ。', 'You should go to bed early.'),
        ('薬を飲んだほうがいい。', 'You should take medicine.'),
        ('無理をしないほうがいいです。', "You shouldn't overdo it.")]),
    ('you-ni', '〜ように', 'so that / in order to', 'B2', r'ように', [
        ('忘れないように、メモします。', "I'll take notes so I don't forget."),
        ('よく聞こえるように、前に座りました。', 'I sat in front so I could hear well.'),
        ('風邪をひかないように気をつけてください。', "Take care so that you don't catch a cold.")]),
]
