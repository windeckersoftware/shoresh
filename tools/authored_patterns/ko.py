# Korean sentence patterns written for Shoresh (not from a corpus; not native-reviewed).
# every syllable ending in the batchim ㅆ (past-tense marker) except 있
PAST = ''.join(chr(0xAC00 + i * 28 + 20) for i in range(19 * 21)).replace('있', '')
PATTERNS = [
    ('imnida', '이에요 / 입니다', 'to be (copula)', 'A1', r'(?:이에요|예요|입니다)', [
        ('저는 학생입니다.', 'I am a student.'),
        ('이것은 책이에요.', 'This is a book.'),
        ('제 이름은 민수예요.', 'My name is Minsu.')]),
    ('eun-neun', '은 / 는', 'topic marker', 'A1', r'[가-힣](?:은|는) ', [
        ('저는 한국 사람이에요.', 'I am Korean.'),
        ('오늘은 날씨가 좋아요.', 'The weather is nice today.'),
        ('이 음식은 맛있어요.', 'This food is delicious.')]),
    ('i-ga', '이 / 가', 'subject marker', 'A1', r'[가-힣](?:이|가) ', [
        ('친구가 와요.', 'My friend is coming.'),
        ('비가 와요.', "It's raining."),
        ('날씨가 좋아요.', 'The weather is nice.')]),
    ('eul-reul', '을 / 를', 'object marker', 'A1', r'[가-힣](?:을|를) ', [
        ('커피를 마셔요.', 'I drink coffee.'),
        ('책을 읽어요.', 'I read a book.'),
        ('한국어를 공부해요.', 'I study Korean.')]),
    ('e-eseo', '에 / 에서', 'place or time (에), place of action (에서)', 'A1', r'[가-힣]에서? ', [
        ('학교에 가요.', 'I go to school.'),
        ('도서관에서 공부해요.', 'I study at the library.'),
        ('일곱 시에 일어나요.', 'I wake up at seven.')]),
    ('haeyo', '-아요 / -어요', 'polite present', 'A1', r'[가-힣]요[.?!]?$', [
        ('저는 매일 운동해요.', 'I exercise every day.'),
        ('지금 뭐 해요?', 'What are you doing now?'),
        ('밥을 먹어요.', 'I eat a meal.')]),
    ('seumnida', '-ㅂ니다 / -습니다', 'formal polite present', 'A1', r'니다[.?!]?$', [
        ('감사합니다.', 'Thank you.'),
        ('저는 회사에 다닙니다.', 'I work at a company.'),
        ('만나서 반갑습니다.', 'Nice to meet you.')]),
    ('go-sipda', '-고 싶다', 'want to', 'A2', r'고 싶', [
        ('한국에 가고 싶어요.', 'I want to go to Korea.'),
        ('물을 마시고 싶어요.', 'I want to drink water.'),
        ('뭐 먹고 싶어요?', 'What do you want to eat?')]),
    ('past', '-았/었/했-', 'past tense', 'A1', '[' + PAST + ']', [
        ('어제 영화를 봤어요.', 'I watched a movie yesterday.'),
        ('아침에 밥을 먹었어요.', 'I ate breakfast this morning.'),
        ('친구를 만났어요.', 'I met a friend.')]),
    ('an', '안 + 동사 / -지 않다', 'negation', 'A1', r'(?:^|\s)안 |지 않', [
        ('저는 고기를 안 먹어요.', "I don't eat meat."),
        ('오늘은 학교에 안 가요.', "I'm not going to school today."),
        ('그 영화는 재미있지 않아요.', "That movie isn't fun.")]),
    ('go-itda', '-고 있다', 'be doing (progressive)', 'A2', r'고 있', [
        ('지금 공부하고 있어요.', "I'm studying now."),
        ('친구를 기다리고 있어요.', "I'm waiting for a friend."),
        ('비가 오고 있어요.', "It's raining.")]),
    ('euro-ni-kka', '-(으)니까', 'because / since', 'A2', r'니까', [
        ('비가 오니까 우산을 가져가세요.', "It's raining, so take an umbrella."),
        ('피곤하니까 일찍 잘 거예요.', "I'm tired, so I'll sleep early."),
        ('시간이 없으니까 빨리 가요.', "We have no time, so let's hurry.")]),
    ('jiman', '-지만', 'but / although', 'A2', r'지만', [
        ('비싸지만 맛있어요.', "It's expensive, but delicious."),
        ('한국어는 어렵지만 재미있어요.', 'Korean is hard, but fun.'),
        ('피곤하지만 일해야 해요.', "I'm tired, but I have to work.")]),
    ('myeon', '-(으)면', 'if / when', 'A2', r'면 ', [
        ('시간이 있으면 같이 가요.', "If you have time, let's go together."),
        ('비가 오면 집에 있을 거예요.', "If it rains, I'll stay home."),
        ('피곤하면 쉬세요.', "If you're tired, rest.")]),
    ('eoya-hada', '-아/어야 하다', 'must / have to', 'A2', r'야 (?:해|합니다|하다|돼|됩니다)', [
        ('내일 일찍 일어나야 해요.', 'I have to get up early tomorrow.'),
        ('숙제를 해야 합니다.', 'I must do my homework.'),
        ('지금 가야 돼요.', 'I have to go now.')]),
    ('su-itda', '-(으)ㄹ 수 있다 / 없다', 'can / cannot', 'A2', r'수 (?:있|없)', [
        ('한국어를 할 수 있어요.', 'I can speak Korean.'),
        ('오늘은 갈 수 없어요.', "I can't go today."),
        ('여기에서 사진을 찍을 수 있어요?', 'Can I take photos here?')]),
    ('ttaemune', '때문에', 'because of', 'B1', r'때문에', [
        ('비 때문에 못 갔어요.', "I couldn't go because of the rain."),
        ('일 때문에 바빠요.', "I'm busy because of work."),
        ('감기 때문에 학교에 안 갔어요.', "I didn't go to school because of a cold.")]),
    ('ryeogo', '-(으)려고', 'in order to / intending to', 'B1', r'려고', [
        ('한국어를 배우려고 한국에 왔어요.', 'I came to Korea to learn Korean.'),
        ('친구를 만나려고 나가요.', "I'm going out to meet a friend."),
        ('살을 빼려고 운동해요.', 'I exercise to lose weight.')]),
    ('hante', '한테 / 에게', 'to someone (indirect object)', 'A2', r'(?:한테|에게)', [
        ('친구한테 선물을 줬어요.', 'I gave a present to my friend.'),
        ('동생에게 전화했어요.', 'I called my younger sibling.'),
        ('선생님한테 물어보세요.', 'Ask the teacher.')]),
    ('boda', '보다', 'more than (comparison)', 'A2', r'보다', [
        ('이것이 저것보다 비싸요.', 'This is more expensive than that.'),
        ('오늘은 어제보다 추워요.', 'Today is colder than yesterday.'),
        ('형이 저보다 키가 커요.', 'My older brother is taller than me.')]),
    ('jeok-i-itda', '-(으)ㄴ 적이 있다', 'have done before (experience)', 'B1', r'적이 (?:있|없)', [
        ('한국에 간 적이 있어요.', 'I have been to Korea.'),
        ('김치를 먹어 본 적이 있어요?', 'Have you ever tried kimchi?'),
        ('그 사람을 만난 적이 없어요.', "I've never met that person.")]),
    ('seyo', '-(으)세요', 'polite request / honorific', 'A1', r'세요', [
        ('앉으세요.', 'Please sit down.'),
        ('어서 오세요.', 'Welcome.'),
        ('잠깐만 기다리세요.', 'Please wait a moment.')]),
    ('neyo', '-네요', 'realising something (oh, …!)', 'B1', r'네요', [
        ('한국어를 잘하시네요.', 'You speak Korean well!'),
        ('벌써 열두 시네요.', "It's already twelve o'clock!"),
        ('날씨가 좋네요.', 'The weather is nice, isn’t it.'.replace('’', "'"))]),
]
