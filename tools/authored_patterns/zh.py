# Mandarin (simplified) sentence patterns written for Shoresh, in the order a learner meets them.
# (id, pattern, English gloss, CEFR, regex, [(sentence, English), ...])
PATTERNS = [
    ('shi', 'A 是 B', 'A is B', 'A1', r'(?<![但可还就于])是', [
        ('我是学生。', 'I am a student.'),
        ('这是我的书。', 'This is my book.'),
        ('他不是老师，他是医生。', 'He is not a teacher; he is a doctor.')]),
    ('bu', '不 + 动词/形容词', 'not (negating verbs and adjectives)', 'A1', r'不', [
        ('我不喝咖啡。', "I don't drink coffee."),
        ('今天天气不好。', 'The weather is not good today.'),
        ('他不想去。', "He doesn't want to go.")]),
    ('mei-you', '没（有）+ 动词', "didn't / haven't (negating the past) ; don't have", 'A1', r'没', [
        ('我昨天没去学校。', "I didn't go to school yesterday."),
        ('她还没吃饭。', "She hasn't eaten yet."),
        ('我没有钱。', "I don't have any money.")]),
    ('you', '有', 'to have; there is / there are', 'A1', r'有', [
        ('我有两个哥哥。', 'I have two older brothers.'),
        ('桌子上有一本书。', 'There is a book on the table.'),
        ('你有时间吗？', 'Do you have time?')]),
    ('ma', '……吗？', 'yes/no question particle', 'A1', r'吗', [
        ('你是中国人吗？', 'Are you Chinese?'),
        ('你喜欢茶吗？', 'Do you like tea?'),
        ('他在家吗？', 'Is he at home?')]),
    ('ne', '……呢？', '"and what about …?" / follow-up question', 'A1', r'呢', [
        ('我很好，你呢？', "I'm fine, and you?"),
        ('我喝茶，你呢？', "I'm having tea; what about you?"),
        ('我的书呢？', 'Where is my book?')]),
    ('hen', '很 + 形容词', 'very + adjective (links subject and adjective)', 'A1', r'很', [
        ('今天很热。', "It's very hot today."),
        ('她很高兴。', 'She is very happy.'),
        ('这个菜很好吃。', 'This dish is delicious.')]),
    ('zai-place', '在 + 地点', 'to be at / in a place', 'A1', r'在[^，。！？]{0,6}(?:里|上|下|外|前|后|家|学校|公司|这儿|那儿|这里|那里|北京|中国|房间)', [
        ('我在家。', "I'm at home."),
        ('他在学校学习。', 'He studies at school.'),
        ('书在桌子上。', 'The book is on the table.')]),
    ('xiang', '想 + 动词', 'to want to / would like to', 'A1', r'想', [
        ('我想喝水。', 'I want to drink water.'),
        ('你想去哪儿？', 'Where do you want to go?'),
        ('她想学中文。', 'She wants to learn Chinese.')]),
    ('de-possess', '名词 + 的 + 名词', 'possession / modification with 的', 'A1', r'的', [
        ('这是我朋友的书。', "This is my friend's book."),
        ('他是我的老师。', 'He is my teacher.'),
        ('她买了一件漂亮的衣服。', 'She bought a pretty piece of clothing.')]),
    ('hui', '会 + 动词', 'can (learned skill) / will (future, likely)', 'A1', r'会', [
        ('我会说一点儿中文。', 'I can speak a little Chinese.'),
        ('明天会下雨。', 'It will rain tomorrow.'),
        ('他不会开车。', "He can't drive.")]),
    ('neng-keyi', '能 / 可以 + 动词', 'can / may (ability, permission)', 'A2', r'能|可以', [
        ('你能帮我吗？', 'Can you help me?'),
        ('这里可以拍照吗？', 'May one take photos here?'),
        ('我今天不能来。', "I can't come today.")]),
    ('le-done', '动词 + 了', 'completed action', 'A1', r'[吃喝看买去来做写读说学见听]了', [
        ('我吃了早饭。', 'I ate breakfast.'),
        ('她买了一本书。', 'She bought a book.'),
        ('他昨天去了北京。', 'He went to Beijing yesterday.')]),
    ('le-change', '……了 (change of state)', 'a new situation has come about', 'A2', r'(?:天黑|下雨|下雪|长大|晚|冷|热|好|大|高|累|饿|懂|会|是|有|不用|不去|不想)了[。！]?$', [
        ('天黑了。', "It's gotten dark."),
        ('我饿了。', "I'm hungry now."),
        ('他不去了。', "He's not going after all.")]),
    ('guo', '动词 + 过', 'to have done something before (experience)', 'A2', r'[去吃看学见听来做用]过', [
        ('我去过中国。', 'I have been to China.'),
        ('你吃过北京烤鸭吗？', 'Have you ever eaten Peking duck?'),
        ('我没见过他。', "I've never met him.")]),
    ('zhengzai', '正在 / 在 + 动词', 'in the middle of doing (progressive)', 'A2', r'正在|(?:^|[，。！？])(?:我|你|他|她|它|我们|你们|他们|妈妈|爸爸)在(?:吃|喝|看|写|读|做|说|听|玩|学|睡|找|等|工作|洗|打)', [
        ('他正在看电视。', 'He is watching TV right now.'),
        ('妈妈在做饭。', 'Mom is cooking.'),
        ('我们正在开会。', 'We are in a meeting.')]),
    ('zhe', '动词 + 着', 'continuing state (-ing / being in a state)', 'B1', r'[坐站躺拿穿戴开关带背看笑说]着', [
        ('他坐着看书。', 'He sits reading.'),
        ('门开着。', 'The door is open.'),
        ('她笑着说：“你好。”', 'She said with a smile: "Hello."')]),
    ('tai-le', '太 + 形容词 + 了', 'too / so (very) …', 'A2', r'太.{1,4}了', [
        ('这个太贵了。', 'This is too expensive.'),
        ('太好了！', 'Great!'),
        ('今天太冷了。', "It's so cold today.")]),
    ('bi', 'A 比 B + 形容词', 'A is more … than B', 'A2', r'比', [
        ('他比我高。', 'He is taller than me.'),
        ('今天比昨天冷。', 'Today is colder than yesterday.'),
        ('哥哥比弟弟大三岁。', 'The older brother is three years older than the younger one.')]),
    ('gen-yiyang', 'A 跟 B 一样', 'A is the same as B', 'A2', r'(?:跟|和|同).+一样', [
        ('我的书跟你的一样。', 'My book is the same as yours.'),
        ('他和他爸爸一样高。', 'He is as tall as his father.'),
        ('这个跟那个一样好吃。', 'This one tastes as good as that one.')]),
    ('de-complement', '动词 + 得 + 程度', 'complement of degree (does it well/fast…)', 'B1', r'得(?:很|好|快|慢|多|太|非常|不错|真)', [
        ('他跑得很快。', 'He runs very fast.'),
        ('她说汉语说得很好。', 'She speaks Chinese very well.'),
        ('你来得真早。', 'You came really early.')]),
    ('ba', '把 + 宾语 + 动词', 'handle/dispose of an object (the 把 construction)', 'B1', r'把.{1,8}[放拿给送带关开买卖写做洗吃喝看带].{0,4}', [
        ('请把门关上。', 'Please close the door.'),
        ('我把书放在桌子上了。', 'I put the book on the table.'),
        ('他把作业做完了。', 'He finished his homework.')]),
    ('bei', 'A 被 B + 动词', 'passive: A was … by B', 'B1', r'被', [
        ('我的手机被偷了。', 'My phone was stolen.'),
        ('杯子被他打破了。', 'The cup was broken by him.'),
        ('这本书被很多人喜欢。', 'This book is liked by many people.')]),
    ('shi-de', '是……的', 'emphasising how/when/where something happened', 'B1', r'是[^，。！？]{1,10}的[。！？]?$', [
        ('我是昨天来的。', 'I came yesterday (it was yesterday that I came).'),
        ('他是坐飞机去的。', 'He went by plane.'),
        ('这是我妈妈做的。', 'My mom made this.')]),
    ('yinwei-suoyi', '因为……所以……', 'because … therefore …', 'A2', r'因为.+所以', [
        ('因为下雨，所以我们没去公园。', "Because it rained, we didn't go to the park."),
        ('因为他生病了，所以没来上班。', "Because he was ill, he didn't come to work."),
        ('因为很累，所以我早点儿睡了。', 'Because I was tired, I went to bed early.')]),
    ('suiran-danshi', '虽然……但是……', 'although … (but) …', 'B1', r'虽然.+(?:但是|但|可是|却)', [
        ('虽然很贵，但是我还是买了。', 'Although it was expensive, I bought it anyway.'),
        ('虽然他很忙，可是他常常帮助我们。', 'Although he is busy, he often helps us.'),
        ('虽然天气不好，但我们玩得很开心。', 'Although the weather was bad, we had a great time.')]),
    ('ruguo-jiu', '如果 / 要是……就……', 'if … then …', 'A2', r'(?:如果|要是|假如).+就', [
        ('如果明天下雨，我就不去了。', "If it rains tomorrow, I won't go."),
        ('要是你有时间，就来看我吧。', 'If you have time, come see me.'),
        ('如果你不懂，就问老师。', "If you don't understand, ask the teacher.")]),
    ('budan-erqie', '不但……而且……', 'not only … but also …', 'B1', r'不但.+(?:而且|还|也)', [
        ('她不但聪明，而且很努力。', 'She is not only smart but also hardworking.'),
        ('这家店不但便宜，而且东西好。', "This shop is not only cheap, but its goods are good."),
        ('他不但会唱歌，还会跳舞。', 'He can not only sing but also dance.')]),
    ('yibian-yibian', '一边……一边……', 'doing two things at the same time', 'B1', r'一边.+一边', [
        ('他一边吃饭一边看电视。', 'He watches TV while eating.'),
        ('我们一边走一边聊天。', 'We chat as we walk.'),
        ('她一边听音乐一边做作业。', 'She does her homework while listening to music.')]),
    ('yuelaiyue', '越来越 + 形容词', 'more and more …', 'B1', r'越来越', [
        ('天气越来越冷了。', 'The weather is getting colder and colder.'),
        ('他的中文越来越好。', 'His Chinese is getting better and better.'),
        ('这里的人越来越多。', 'There are more and more people here.')]),
    ('yue-yue', '越……越……', 'the more … the more …', 'B1', r'越.+越', [
        ('他越说越快。', 'The more he talks, the faster he gets.'),
        ('这本书我越看越喜欢。', 'The more I read this book, the more I like it.'),
        ('雨越下越大。', 'The rain is falling harder and harder.')]),
    ('lian-dou', '连……都 / 也……', 'even … (even X)', 'B2', r'连.+(?:都|也)', [
        ('他连饭都没吃就走了。', 'He left without even eating.'),
        ('我连他的名字都不知道。', "I don't even know his name."),
        ('这个问题连老师也不会。', "Even the teacher can't do this question.")]),
    ('xian-ranhou', '先……然后 / 再……', 'first … then …', 'A2', r'先.+(?:然后|再|接着)', [
        ('我们先吃饭，然后去看电影。', "Let's eat first and then go to a movie."),
        ('你先想一想，再回答。', 'Think first, then answer.'),
        ('先洗手，再吃东西。', 'Wash your hands first, then eat.')]),
    ('zhiyou-cai', '只有……才……', 'only if … (then) …', 'B2', r'只有.+才', [
        ('只有努力学习，才能考好。', 'Only by studying hard can you do well on the exam.'),
        ('只有你去，他才会同意。', 'Only if you go will he agree.'),
        ('只有多听多说，才能学好中文。', 'Only by listening and speaking a lot can you learn Chinese well.')]),
    ('zhiyao-jiu', '只要……就……', 'as long as … then …', 'B1', r'只要.+就', [
        ('只要你努力，就一定能成功。', 'As long as you work hard, you will succeed.'),
        ('只要有时间，我就去看你。', "As long as I have time, I'll come to see you."),
        ('只要天晴，我们就去爬山。', "As long as it's sunny, we'll go hiking.")]),
    ('chule-yiwai', '除了……（以外），还 / 都……', 'apart from … ; except …', 'B1', r'除了.+(?:以外|之外|外)?[，,]?.*(?:还|也|都)', [
        ('除了中文，他还会说日语。', 'Besides Chinese, he also speaks Japanese.'),
        ('除了我以外，大家都去了。', 'Everyone went except me.'),
        ('除了苹果，我还买了香蕉。', 'Besides apples, I also bought bananas.')]),
    ('yi-jiu', '一……就……', 'as soon as … then …', 'B1', r'一[^，。！？]{1,8}就', [
        ('他一回家就睡觉。', 'As soon as he gets home he goes to sleep.'),
        ('我一看就懂了。', 'I understood the moment I looked.'),
        ('她一紧张就说不出话。', "As soon as she gets nervous she can't speak.")]),
    ('haishi', 'A 还是 B？', 'or (in questions)', 'A2', r'还是', [
        ('你喝茶还是喝咖啡？', 'Do you want tea or coffee?'),
        ('我们今天去还是明天去？', 'Shall we go today or tomorrow?'),
        ('他是老师还是学生？', 'Is he a teacher or a student?')]),
    ('kuaiyao-le', '快（要）/ 就要 + ……了', 'about to … (soon)', 'B1', r'(?:快要?|就要).+了', [
        ('火车快要开了。', 'The train is about to leave.'),
        ('我们就要放假了。', 'Our holiday is about to start.'),
        ('天快黑了。', "It's about to get dark.")]),
    ('cong-dao', '从……到……', 'from … to …', 'A2', r'从.+到', [
        ('我从八点到五点工作。', 'I work from eight to five.'),
        ('从我家到学校很近。', 'It is close from my home to school.'),
        ('他从北京到上海坐火车。', 'He went from Beijing to Shanghai by train.')]),
    ('li', 'A 离 B + 远/近', 'A is far from / close to B', 'A2', r'离.+(?:很|不|太|比较)?[远近]', [
        ('我家离学校很近。', 'My home is close to school.'),
        ('这里离机场不远。', "It's not far from here to the airport."),
        ('银行离这儿太远了。', 'The bank is too far from here.')]),
    ('gei', '给 + 人 + 动词', 'do something for / give someone', 'A2', r'给.{1,6}(?:打|写|买|做|讲|发|寄|看|介绍|送)', [
        ('我给妈妈打电话。', 'I call my mom.'),
        ('他给我买了一本书。', 'He bought me a book.'),
        ('请给我介绍一下。', 'Please introduce it to me.')]),
    ('you-you', '又……又……', 'both … and … (describing qualities)', 'B1', r'又.+又', [
        ('这个菜又便宜又好吃。', 'This dish is both cheap and delicious.'),
        ('她又高又瘦。', 'She is tall and thin.'),
        ('他又累又饿。', 'He is both tired and hungry.')]),
    ('dui-ganxingqu', '对……感兴趣', 'be interested in …', 'B1', r'对.+感兴趣', [
        ('我对历史很感兴趣。', "I'm very interested in history."),
        ('他对音乐不感兴趣。', "He isn't interested in music."),
        ('你对什么感兴趣？', 'What are you interested in?')]),
    ('youdianr', '有点儿 + 形容词', 'a bit … (usually undesirable)', 'A2', r'有点儿?', [
        ('今天有点儿冷。', "It's a bit cold today."),
        ('我有点儿累。', "I'm a little tired."),
        ('这个菜有点儿咸。', 'This dish is a bit salty.')]),
    ('qing', '请 + 动词', 'please … / polite request', 'A1', r'请', [
        ('请坐。', 'Please sit down.'),
        ('请问，洗手间在哪儿？', 'Excuse me, where is the restroom?'),
        ('请你再说一遍。', 'Please say it once more.')]),
    ('rang', '让 + 人 + 动词', 'let / make someone do', 'B1', r'让.{1,4}[^，。！？]', [
        ('妈妈让我早点儿睡觉。', 'Mom told me to go to bed early.'),
        ('这件事让他很生气。', 'This made him very angry.'),
        ('请让我想一想。', 'Please let me think.')]),
    ('dou', '都', 'all / both / even already', 'A2', r'都', [
        ('我们都是学生。', 'We are all students.'),
        ('大家都来了。', 'Everyone came.'),
        ('他每天都跑步。', 'He runs every day.')]),
    ('ye', '也', 'also / too', 'A1', r'也', [
        ('我也喜欢这个。', 'I like this too.'),
        ('他也不知道。', "He doesn't know either."),
        ('你也来吗？', 'Are you coming too?')]),
]
