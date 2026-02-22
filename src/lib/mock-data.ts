import type { Question } from "./types";

// A larger, more structured set of questions for the adaptive test
export const mockAdaptiveQuestions: Question[] = [
  // Verbal Questions (Difficulty 1-5)
  { id: 'v1_1', aptitude_category: 'Verbal', difficulty_level: 1, text: 'Which word is a synonym for "happy"?', options: ['Sad', 'Joyful', 'Angry', 'Tired'], answer: 'Joyful' },
  { id: 'v1_2', aptitude_category: 'Verbal', difficulty_level: 1, text: 'What is the opposite of "hot"?', options: ['Warm', 'Cold', 'Spicy', 'Loud'], answer: 'Cold' },
  { id: 'v2_1', aptitude_category: 'Verbal', difficulty_level: 2, text: 'Complete the analogy: Day is to Night as Light is to...', options: ['Sun', 'Moon', 'Darkness', 'Star'], answer: 'Darkness' },
  { id: 'v2_2', aptitude_category: 'Verbal', difficulty_level: 2, text: 'Choose the word that does not belong: Apple, Banana, Carrot, Orange.', options: ['Apple', 'Banana', 'Carrot', 'Orange'], answer: 'Carrot' },
  { id: 'v3_1', aptitude_category: 'Verbal', difficulty_level: 3, text: 'The word "ephemeral" means:', options: ['Long-lasting', 'Transparent', 'Short-lived', 'Beautiful'], answer: 'Short-lived' },
  { id: 'v3_2', aptitude_category: 'Verbal', difficulty_level: 3, text: 'Identify the figure of speech: "The wind whispered through the trees."', options: ['Metaphor', 'Simile', 'Personification', 'Hyperbole'], answer: 'Personification' },
  { id: 'v4_1', aptitude_category: 'Verbal', difficulty_level: 4, text: 'What does the idiom "bite the bullet" mean?', options: ['To eat something quickly', 'To get injured', 'To face a difficult situation with courage', 'To stop talking'], answer: 'To face a difficult situation with courage' },
  { id: 'v4_2', aptitude_category: 'Verbal', difficulty_level: 4, text: 'Which word is closest in meaning to "ubiquitous"?', options: ['Rare', 'Present everywhere', 'Hidden', 'Powerful'], answer: 'Present everywhere' },
  { id: 'v5_1', aptitude_category: 'Verbal', difficulty_level: 5, text: 'A "Pyrrhic victory" is one that:', options: ['Is won easily', 'Is achieved at too great a cost', 'Is celebrated by all', 'Leads to peace'], answer: 'Is achieved at too great a cost' },
  { id: 'v5_2', aptitude_category: 'Verbal', difficulty_level: 5, text: '"Laconic" describes someone who is:', options: ['Talkative and verbose', 'Friendly and outgoing', 'Using very few words', 'Intelligent and witty'], answer: 'Using very few words' },

  // Numerical Questions (Difficulty 1-5)
  { id: 'n1_1', aptitude_category: 'Numerical', difficulty_level: 1, text: 'What is 5 + 7?', options: ['10', '12', '14', '8'], answer: '12' },
  { id: 'n1_2', aptitude_category: 'Numerical', difficulty_level: 1, text: 'Which number is largest: 25, 15, 30, 20?', options: ['25', '15', '30', '20'], answer: '30' },
  { id: 'n2_1', aptitude_category: 'Numerical', difficulty_level: 2, text: 'If a pen costs $2 and you buy 3, what is the total cost?', options: ['$5', '$6', '$8', '$3'], answer: '$6' },
  { id: 'n2_2', aptitude_category: 'Numerical', difficulty_level: 2, text: 'Continue the sequence: 2, 4, 6, 8, ...', options: ['9', '10', '12', '14'], answer: '10' },
  { id: 'n3_1', aptitude_category: 'Numerical', difficulty_level: 3, text: 'A car travels at 60 km/h. How far does it travel in 45 minutes?', options: ['30 km', '45 km', '60 km', '50 km'], answer: '45 km' },
  { id: 'n3_2', aptitude_category: 'Numerical', difficulty_level: 3, text: 'What is 15% of 200?', options: ['15', '20', '30', '40'], answer: '30' },
  { id: 'n4_1', aptitude_category: 'Numerical', difficulty_level: 4, text: 'If a shirt is discounted by 20% from its original price of $50, what is the new price?', options: ['$30', '$40', '$45', '$10'], answer: '$40' },
  { id: 'n4_2', aptitude_category: 'Numerical', difficulty_level: 4, text: 'Solve for x: 3x - 7 = 14', options: ['5', '6', '7', '8'], answer: '7' },
  { id: 'n5_1', aptitude_category: 'Numerical', difficulty_level: 5, text: 'A factory produces 250 units in 8 hours. How many units can it produce in 24 hours?', options: ['500', '750', '800', '1000'], answer: '750' },
  { id: 'n5_2', aptitude_category: 'Numerical', difficulty_level: 5, text: 'What is the next number in the series: 1, 4, 9, 16, 25, ...?', options: ['30', '36', '42', '49'], answer: '36' },

  // Spatial Questions (Difficulty 1-5)
  { id: 's1_1', aptitude_category: 'Spatial', difficulty_level: 1, text: 'Which shape is a circle?', options: ['A', 'B', 'C', 'D'], answer: 'A' }, // Assume A is a circle image
  { id: 's1_2', aptitude_category: 'Spatial', difficulty_level: 1, text: 'Which arrow points up?', options: ['^', 'v', '<', '>'], answer: '^' },
  { id: 's2_1', aptitude_category: 'Spatial', difficulty_level: 2, text: 'If you fold a piece of paper in half, what shape do you get?', options: ['Triangle', 'Rectangle', 'Circle', 'Square'], answer: 'Rectangle' },
  { id: 's2_2', aptitude_category: 'Spatial', difficulty_level: 2, text: 'How many sides does a pentagon have?', options: ['4', '5', '6', '7'], answer: '5' },
  { id: 's3_1', aptitude_category: 'Spatial', difficulty_level: 3, text: 'Which 3D shape can be made from folding a net of 6 identical squares?', options: ['Pyramid', 'Sphere', 'Cube', 'Cylinder'], answer: 'Cube' },
  { id: 's3_2', aptitude_category: 'Spatial', difficulty_level: 3, text: 'If you rotate a square 90 degrees clockwise, what does it look like?', options: ['A diamond', 'The same', 'A rectangle', 'A triangle'], answer: 'The same' },
  { id: 's4_1', aptitude_category: 'Spatial', difficulty_level: 4, text: 'Imagine a 3x3 cube made of smaller cubes. How many small cubes are NOT visible from the outside?', options: ['1', '8', '9', '27'], answer: '1' },
  { id: 's4_2', aptitude_category: 'Spatial', difficulty_level: 4, text: 'Which of the following is a 2D representation of a tetrahedron?', options: ['A square', 'A circle', 'A triangle', 'Four connected triangles'], answer: 'Four connected triangles' },
  { id: 's5_1', aptitude_category: 'Spatial', difficulty_level: 5, text: 'If a shape is reflected across the y-axis, which coordinate changes?', options: ['The x-coordinate', 'The y-coordinate', 'Both', 'Neither'], answer: 'The x-coordinate' },
  { id: 's5_2', aptitude_category: 'Spatial', difficulty_level: 5, text: 'Which pattern completes the sequence? (Visual question)', options: ['A', 'B', 'C', 'D'], answer: 'B' }, // Placeholder for a visual question

  // Abstract Questions (Difficulty 1-5)
  { id: 'a1_1', aptitude_category: 'Abstract', difficulty_level: 1, text: 'Find the next shape in the pattern: O, X, O, X, ...', options: ['X', 'O', 'XX', 'OO'], answer: 'O' },
  { id: 'a1_2', aptitude_category: 'Abstract', difficulty_level: 1, text: 'Which one is different: Red, Blue, Green, Chair?', options: ['Red', 'Blue', 'Green', 'Chair'], answer: 'Chair' },
  { id: 'a2_1', aptitude_category: 'Abstract', difficulty_level: 2, text: 'Pattern: 1A, 2B, 3C, ... What comes next?', options: ['4D', '4A', '3D', '4C'], answer: '4D' },
  { id: 'a2_2', aptitude_category: 'Abstract', difficulty_level: 2, text: 'Analogy: Dog is to Bark as Cat is to ...', options: ['Moo', 'Chirp', 'Meow', 'Roar'], answer: 'Meow' },
  { id: 'a3_1', aptitude_category: 'Abstract', difficulty_level: 3, text: 'Which number does not belong: 2, 3, 5, 7, 9, 11?', options: ['2', '3', '7', '9'], answer: '9' },
  { id: 'a3_2', aptitude_category: 'Abstract', difficulty_level: 3, text: 'Book is to Reading as Fork is to...', options: ['Writing', 'Eating', 'Drawing', 'Sleeping'], answer: 'Eating' },
  { id: 'a4_1', aptitude_category: 'Abstract', difficulty_level: 4, text: 'Look at the series: 8, 6, 7, 5, 6, 4, ... What number comes next?', options: ['2', '3', '5', '6'], answer: '5' },
  { id: 'a4_2', aptitude_category: 'Abstract', difficulty_level: 4, text: 'Which word is the odd one out? Elated, Ecstatic, Joyful, Somber.', options: ['Elated', 'Ecstatic', 'Joyful', 'Somber'], answer: 'Somber' },
  { id: 'a5_1', aptitude_category: 'Abstract', difficulty_level: 5, text: 'BEH is to EHK as FIL is to ...?', options: ['HJL', 'ILO', 'IKL', 'JLO'], answer: 'ILO' },
  { id: 'a5_2', aptitude_category: 'Abstract', difficulty_level: 5, text: 'If Triangle means 3 and Square means 4, what does Pentagon mean?', options: ['Shape', 'Figure', '5', 'Side'], answer: '5' },
];
