/* Language catalogue. Hebrew is first-class; the rest share the same pack format. */
window.NER_LANGS = [
  {id:'he', he:'עברית', en:'Hebrew', code:'HE', dir:'rtl', script:'Hebrew', status:'installed'},
  {id:'en', he:'אנגלית', en:'English', code:'EN', dir:'ltr', script:'Latin', status:'online'},
  {id:'hu', he:'הונגרית', en:'Hungarian', code:'HU', dir:'ltr', script:'Latin', status:'online'},
  {id:'ar', he:'ערבית', en:'Arabic', code:'AR', dir:'rtl', script:'Arabic', status:'online'},
  {id:'es', he:'ספרדית', en:'Spanish', code:'ES', dir:'ltr', script:'Latin', status:'online'},
  {id:'fr', he:'צרפתית', en:'French', code:'FR', dir:'ltr', script:'Latin', status:'online'},
  {id:'de', he:'גרמנית', en:'German', code:'DE', dir:'ltr', script:'Latin', status:'online'},
  {id:'it', he:'איטלקית', en:'Italian', code:'IT', dir:'ltr', script:'Latin', status:'online'},
  {id:'pt', he:'פורטוגזית', en:'Portuguese', code:'PT', dir:'ltr', script:'Latin', status:'online'},
  {id:'nl', he:'הולנדית', en:'Dutch', code:'NL', dir:'ltr', script:'Latin', status:'online'},
  {id:'sv', he:'שוודית', en:'Swedish', code:'SV', dir:'ltr', script:'Latin', status:'online'},
  {id:'da', he:'דנית', en:'Danish', code:'DA', dir:'ltr', script:'Latin', status:'online'},
  {id:'no', he:'נורווגית', en:'Norwegian', code:'NO', dir:'ltr', script:'Latin', status:'online'},
  {id:'fi', he:'פינית', en:'Finnish', code:'FI', dir:'ltr', script:'Latin', status:'online'},
  {id:'pl', he:'פולנית', en:'Polish', code:'PL', dir:'ltr', script:'Latin', status:'online'},
  {id:'ru', he:'רוסית', en:'Russian', code:'RU', dir:'ltr', script:'Cyrillic', status:'online'},
  {id:'uk', he:'אוקראינית', en:'Ukrainian', code:'UK', dir:'ltr', script:'Cyrillic', status:'online'},
  {id:'el', he:'יוונית', en:'Greek', code:'EL', dir:'ltr', script:'Greek', status:'online'},
  {id:'tr', he:'טורקית', en:'Turkish', code:'TR', dir:'ltr', script:'Latin', status:'online'},
  {id:'zh', he:'סינית', en:'Chinese', code:'ZH', dir:'ltr', script:'Han', status:'online'},
  {id:'yue', he:'קנטונזית', en:'Cantonese', code:'YU', dir:'ltr', script:'Han', status:'online'},
  {id:'ja', he:'יפנית', en:'Japanese', code:'JA', dir:'ltr', script:'Kana + Kanji', status:'online'},
  {id:'ko', he:'קוריאנית', en:'Korean', code:'KO', dir:'ltr', script:'Hangul', status:'online'},
  {id:'vi', he:'וייטנאמית', en:'Vietnamese', code:'VI', dir:'ltr', script:'Latin', status:'online'},
  {id:'id', he:'אינדונזית', en:'Indonesian', code:'ID', dir:'ltr', script:'Latin', status:'online'},
  {id:'th', he:'תאית', en:'Thai', code:'TH', dir:'ltr', script:'Thai', status:'online'}
];

window.NER_SAMPLE = {
  title: 'השורש שבמילה',
  text: `לפעמים מילה אחת מספיקה כדי לשנות את כל המשמעות של משפט. אנחנו קוראים מהר, מדלגים על מה שנראה מוכר, וממשיכים הלאה. אבל לפעמים דווקא המילה הקטנה שנשארה בצד היא המפתח.

שורש אינו מלמד את כל העץ בבת אחת. הוא מתחיל במילה אחת, ובמה שבוחרים להסתכל עליו. כך גם קריאה בשפה חדשה: לא צריך להבין הכול. צריך רק לזהות את המילה הבאה, לשאול מה היא אומרת, ולהמשיך.

המילים שאנחנו פוגשים שוב ושוב הופכות להיות שלנו. לא מפני ששיננו אותן, אלא מפני שפגשנו אותן בתוך סיפור אמיתי. זה הכלל היחיד: לקרוא עוד קצת, כל יום.`
};

window.NER_LANG_HU = {he:'héber',en:'angol',hu:'magyar',ar:'arab',es:'spanyol',fr:'francia',de:'német',it:'olasz',pt:'portugál',nl:'holland',sv:'svéd',da:'dán',no:'norvég',fi:'finn',pl:'lengyel',ru:'orosz',uk:'ukrán',el:'görög',tr:'török',zh:'kínai',yue:'kantoni',ja:'japán',ko:'koreai',vi:'vietnámi',id:'indonéz',th:'thai'};
