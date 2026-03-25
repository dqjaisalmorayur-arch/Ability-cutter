import { Module } from './types';

export const MODULES: Module[] = [
  {
    id: 'computer-basics-blind',
    category: 'basic',
    level: 'basic',
    title: {
      en: 'Introduction to Computer for Blind Students',
      ml: 'കാഴ്ചാപരിമിതിയുള്ളവർക്കായി കമ്പ്യൂട്ടർ പരിചയം'
    },
    order: 0,
    lessons: [
      {
        id: 'what-is-computer',
        title: {
          en: 'Feeling the Computer',
          ml: 'കമ്പ്യൂട്ടറിനെ തൊട്ടറിയാം'
        },
        content: {
          en: "Hello children! Today we are going to learn about the computer. Imagine a smart box that helps you read, write, and listen to music. For us, the most important part is the Keyboard. It's like a musical instrument with many keys. We also have the CPU, which is the brain, and the Speakers, which are the computer's mouth. Don't worry about the screen; our screen reader will tell us everything that happens there.",
          ml: "പ്രിയപ്പെട്ട കുട്ടികളെ, ഇന്ന് നമ്മൾ കമ്പ്യൂട്ടറിനെക്കുറിച്ചാണ് പഠിക്കുന്നത്. നിങ്ങൾക്ക് വായിക്കാനും എഴുതാനും പാട്ടു കേൾക്കാനും സഹായിക്കുന്ന ഒരു മിടുക്കൻ പെട്ടിയാണിത്. നമുക്ക് ഏറ്റവും പ്രധാനം കീബോർഡ് ആണ്. ഒരു സംഗീത ഉപകരണം പോലെ ഒരുപാട് കീകൾ ഇതിലുണ്ട്. കമ്പ്യൂട്ടറിന്റെ തലച്ചോറായ സി.പി.യുവും, കമ്പ്യൂട്ടറിന്റെ വായയായ സ്പീക്കറുകളും നമുക്ക് പ്രധാനമാണ്. സ്ക്രീനിനെക്കുറിച്ച് നിങ്ങൾ വിഷമിക്കേണ്ട, അവിടെ നടക്കുന്നത് എന്താണെന്ന് നമ്മുടെ സ്ക്രീൻ റീഡർ നമുക്ക് പറഞ്ഞുതരും."
        }
      },
      {
        id: 'keyboard-layout',
        title: {
          en: 'The Home Row Secret',
          ml: 'ഹോം റോയുടെ രഹസ്യം'
        },
        content: {
          en: "Now, place your hands on the keyboard. Can you feel small bumps on the letters F and J? Those are your guide marks. Your left index finger goes on F and right index finger on J. This middle row is called the Home Row. From here, you can reach any key easily. Remember, the keyboard is your eyes in the digital world.",
          ml: "ഇനി നിങ്ങളുടെ കൈകൾ കീബോർഡിൽ വെക്കൂ. F, J എന്നീ അക്ഷരങ്ങളിൽ ചെറിയ തടിപ്പുകൾ നിങ്ങൾക്ക് തൊട്ടറിയാൻ കഴിയുന്നില്ലേ? അവയാണ് നമ്മുടെ അടയാളങ്ങൾ. ഇടതുകൈയിലെ ചൂണ്ടുവിരൽ F ലും വലതുകൈയിലേത് J ലും വെക്കുക. ഈ വരിയെയാണ് 'ഹോം റോ' എന്ന് വിളിക്കുന്നത്. ഇവിടെ നിന്നാൽ നിങ്ങൾക്ക് എല്ലാ കീകളിലേക്കും എളുപ്പത്തിൽ എത്താം. ഓർക്കുക, ഡിജിറ്റൽ ലോകത്ത് കീബോർഡ് ആണ് നിങ്ങളുടെ കണ്ണുകൾ."
        }
      }
    ],
    quiz: [
      {
        id: 'q1',
        text: {
          en: 'Which keys have small bumps to guide your fingers?',
          ml: 'വിരലുകൾ വെക്കാൻ അടയാളമായി ചെറിയ തടിപ്പുകൾ ഉള്ള കീകൾ ഏവ?'
        },
        options: {
          en: ['A and L', 'F and J', 'S and D', 'G and H'],
          ml: ['A യും L ഉം', 'F ഉം J ഉം', 'S ഉം D യും', 'G യും H ഉം']
        },
        correctIndex: 1
      }
    ]
  },
  {
    id: 'screen-reader-basics',
    category: 'basic',
    level: 'basic',
    title: {
      en: 'Your Talking Friend: The Screen Reader',
      ml: 'സംസാരിക്കുന്ന കൂട്ടുകാരൻ: സ്ക്രീൻ റീഡർ'
    },
    order: 1,
    lessons: [
      {
        id: 'what-is-sr',
        title: {
          en: 'Meet NVDA and JAWS',
          ml: 'NVDA യും JAWS ഉം പരിചയപ്പെടാം'
        },
        content: {
          en: "A screen reader is a software that reads out everything on the screen. NVDA and JAWS are our best friends here. When you press a key, the screen reader tells you what it is. It's like having a teacher sitting next to you, reading out the textbook. Today, we will learn how to listen to its voice and understand the instructions.",
          ml: "സ്ക്രീനിൽ കാണുന്ന കാര്യങ്ങൾ വായിച്ചുതരുന്ന സോഫ്റ്റ്‌വെയറാണ് സ്ക്രീൻ റീഡർ. NVDA, JAWS എന്നിവയാണ് നമ്മുടെ പ്രധാന കൂട്ടുകാർ. നിങ്ങൾ ഒരു കീ അമർത്തുമ്പോൾ അത് എന്താണെന്ന് സ്ക്രീൻ റീഡർ പറഞ്ഞുതരും. ഒരു അധ്യാപകൻ അടുത്തുരുന്ന് പുസ്തകം വായിച്ചുതരുന്നത് പോലെയാണിത്. ഇന്ന് നമ്മൾ അതിന്റെ ശബ്ദം ശ്രദ്ധിക്കാനും നിർദ്ദേശങ്ങൾ മനസ്സിലാക്കാനും പഠിക്കും."
        }
      },
      {
        id: 'sr-navigation',
        title: {
          en: 'Moving Around with Tab Key',
          ml: 'ടാബ് കീ ഉപയോഗിച്ച് സഞ്ചരിക്കാം'
        },
        content: {
          en: "To move from one button to another, we use the Tab key. It's located on the left side of the keyboard. Every time you press Tab, the screen reader jumps to the next item. If you want to go back, hold the Shift key and press Tab. Try it now, it's like walking step by step through a room.",
          ml: "ഒരു ബട്ടണിൽ നിന്ന് അടുത്തതിലേക്ക് പോകാൻ നമ്മൾ 'ടാബ്' (Tab) കീ ഉപയോഗിക്കുന്നു. കീബോർഡിന്റെ ഇടതുവശത്താണ് ഇത്. ഓരോ തവണ ടാബ് അമർത്തുമ്പോഴും സ്ക്രീൻ റീഡർ അടുത്ത കാര്യത്തിലേക്ക് പോകും. തിരികെ വരണമെങ്കിൽ 'ഷിഫ്റ്റ്' (Shift) കീ അമർത്തിപ്പിടിച്ച് ടാബ് അമർത്തുക. ഒരു മുറിയിലൂടെ ഓരോ ചുവടായി നടക്കുന്നത് പോലെയാണിത്."
        }
      }
    ],
    quiz: [
      {
        id: 'q2',
        text: {
          en: 'Which key is used to move to the next item?',
          ml: 'അടുത്ത കാര്യത്തിലേക്ക് പോകാൻ ഏത് കീ ആണ് ഉപയോഗിക്കുന്നത്?'
        },
        options: {
          en: ['Enter', 'Space', 'Tab', 'Escape'],
          ml: ['എന്റർ', 'സ്പേസ്', 'ടാബ്', 'എസ്കേപ്പ്']
        },
        correctIndex: 2
      }
    ]
  },
  {
    id: 'typing-mastery',
    category: 'basic',
    level: 'basic',
    title: {
      en: 'Mastering the Keys',
      ml: 'ടൈപ്പിംഗ് പഠിക്കാം'
    },
    order: 2,
    lessons: [
      {
        id: 'typing-intro',
        title: {
          en: 'The Magic of Typing',
          ml: 'ടൈപ്പിംഗിന്റെ മാന്ത്രികത'
        },
        content: {
          en: "Typing is like talking with your fingers. We don't need to see the keys; we just need to remember where they are. Start with the Home Row: A, S, D, F for the left hand and J, K, L, Semicolon for the right hand. Keep your back straight and your fingers curved like you are holding an orange. Let's practice making words without looking!",
          ml: "വിരലുകൾ കൊണ്ട് സംസാരിക്കുന്നതുപോലെയാണ് ടൈപ്പിംഗ്. കീകൾ കാണേണ്ടതില്ല, അവ എവിടെയാണെന്ന് ഓർത്തുവെച്ചാൽ മതി. ഹോം റോയിൽ തുടങ്ങാം: A, S, D, F ഉം വലതുകൈക്ക് J, K, L, സെമികോളനും. നിവർന്നിരുന്ന് വിരലുകൾ ഒരു ഓറഞ്ച് പിടിക്കുന്നത് പോലെ വളച്ചു വെക്കുക. നോക്കാതെ വാക്കുകൾ എഴുതാൻ നമുക്ക് ശീലിക്കാം!"
        }
      }
    ],
    quiz: [
      {
        id: 'q3',
        text: {
          en: 'How should your fingers be positioned while typing?',
          ml: 'ടൈപ്പ് ചെയ്യുമ്പോൾ വിരലുകൾ എങ്ങനെ വെക്കണം?'
        },
        options: {
          en: ['Flat on keys', 'Curved like holding an orange', 'Only use index fingers', 'Keep hands in pockets'],
          ml: ['കീകളിൽ പരത്തി വെക്കണം', 'ഓറഞ്ച് പിടിക്കുന്നത് പോലെ വളച്ചു വെക്കണം', 'ചൂണ്ടുവിരൽ മാത്രം ഉപയോഗിക്കണം', 'കൈകൾ പോക്കറ്റിൽ വെക്കണം']
        },
        correctIndex: 1
      }
    ]
  },
  {
    id: 'internet-browsing-blind',
    category: 'internet',
    level: 'basic',
    title: {
      en: 'Surfing the Web with Your Ears',
      ml: 'ഇന്റർനെറ്റ് ലോകം കാതുകൾ കൊണ്ട് അറിയാം'
    },
    order: 3,
    lessons: [
      {
        id: 'web-intro',
        title: {
          en: 'What is the Internet?',
          ml: 'എന്താണ് ഇന്റർനെറ്റ്?'
        },
        content: {
          en: "The internet is a giant library that talks to you. We use a 'Browser' like Google Chrome to visit websites. For us, websites are like lists of information. We use headings to jump from one section to another. Pressing the letter 'H' on your keyboard will take you to the next heading. It's like skipping chapters in an audio book.",
          ml: "നമ്മളോട് സംസാരിക്കുന്ന ഒരു വലിയ ലൈബ്രറിയാണ് ഇന്റർനെറ്റ്. വെബ്സൈറ്റുകൾ സന്ദർശിക്കാൻ നമ്മൾ ഗൂഗിൾ ക്രോം പോലുള്ള 'ബ്രൗസറുകൾ' ഉപയോഗിക്കുന്നു. നമുക്ക് വെബ്സൈറ്റുകൾ വിവരങ്ങളുടെ ഒരു പട്ടിക പോലെയാണ്. ഒരു ഭാഗത്തുനിന്ന് മറ്റൊന്നിലേക്ക് ചാടാൻ നമ്മൾ ഹെഡിംഗുകൾ ഉപയോഗിക്കുന്നു. കീബോർഡിലെ 'H' അമർത്തിയാൽ അടുത്ത ഹെഡിംഗിലേക്ക് പോകാം. ഒരു ഓഡിയോ ബുക്കിലെ അധ്യായങ്ങൾ മാറ്റുന്നത് പോലെയാണിത്."
        }
      }
    ],
    quiz: [
      {
        id: 'q4',
        text: {
          en: 'Which key helps you jump to the next heading on a website?',
          ml: 'വെബ്സൈറ്റുകളിൽ അടുത്ത ഹെഡിംഗിലേക്ക് പോകാൻ ഏത് കീ സഹായിക്കുന്നു?'
        },
        options: {
          en: ['Enter', 'H', 'B', 'L'],
          ml: ['എന്റർ', 'H', 'B', 'L']
        },
        correctIndex: 1
      }
    ]
  }
];
