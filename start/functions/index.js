/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const functions = require('firebase-functions');
const {dialogflow, HtmlResponse} = require('actions-on-google');
const Dictionary = require('./util/dictionary.js');

const app = dialogflow({debug: true});

const MAX_INCORRECT_GUESSES = 5;

const DETAILED_INSTRUCTIONS =
`Try to figure out the word by guessing letters that you think are in the word. ` +
`Figure out the word before the snowman melts to win the game! After 5 ` +
`incorrect guesses, the snowman melts and the game is over. ` +
`If you know the word, you can say, for instance, “The word is penguin.” ` +
`You can try another word, or ask for help.`;

const BRIEF_INSTRUCTIONS = [
  `Try guessing a letter in the word, or guess the entire word if you think you know what it is.`,
  `Try guessing a letter in the word, or guess the entire word if you're feeling confident!`,
  `Try guessing a letter in the word or guessing the word.`,
  `Try guessing a letter in the word or guessing the word.`
];

const DICTIONARY = new Dictionary();

/**
 * Pick a random item from an array. This is to make
 * responses more conversational.
 *
 * @param  {array} array representing a list of elements.
 * @return  {string} item from an array.
 */
const randomArrayItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
* Updates the string to display to the user with the guessed
* letter or word.
*
* @param  {object} conv an object representing the current conversation.
* @param  {string} letterOrWord the letter or word used to update the display string.
*/
const updateWordToDisplay = (conv, letterOrWord) => {
  if(letterOrWord === conv.data.correctWord) {
    conv.data.wordToDisplay = conv.data.correctWord;
  } else {
    conv.data.correctWord.split('').forEach((character, index) => {
      if (letterOrWord === character) {
        conv.data.wordToDisplay = conv.data.wordToDisplay.substr(0, index) +
        letterOrWord + conv.data.wordToDisplay.substr(index + letterOrWord.length)
      }
    });
  }
 }

app.intent('Fallback', (conv) => {
  conv.ask(`I don’t understand. Try guessing a letter!`);
  conv.ask(new HtmlResponse());
});

/**
 * Provide standard instructions about the game.
 *
 * @param  {conv} standard Actions on Google conversation object.
 */
app.intent('Instructions', (conv) => {
  conv.ask(`${DETAILED_INSTRUCTIONS}`);
  conv.ask(new HtmlResponse());
});

/**
 * Trigger to re-play the game again at anytime.
 *
 * @param  {conv} standard Actions on Google conversation object.
 */
app.intent('Play Again', (conv) => {
  conv.ask(`Okay, here’s another game!`);
  conv.data.incorrectGuesses = 0;
  conv.data.correctWord = DICTIONARY.getWord().toLocaleUpperCase();
  conv.data.wordToDisplay = '_'.repeat(conv.data.correctWord.length);
  conv.ask(new HtmlResponse({
    data: {
      state: 'NEW_GAME',
      wordToDisplay: conv.data.wordToDisplay
    },
  }));
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
