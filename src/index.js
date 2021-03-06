var Alexa = require('alexa-sdk');
var request = require('request');
var api = require('./api.js');

var APP_ID = undefined;
var QUESTION_TOTAL = 5;
var GOLD_MEDAL = QUESTION_TOTAL;
var SILVER_MEDAL = 4;
var BRONZE_MEDAL = 3;
var LEVEL_PROMPT = 'Say level one for beginner. Say level two for intermediate, or <break time="0.05s"/>say exit to close <phoneme alphabet="ipa" ph="kwɪz.bɒt">Quizbot</phoneme>.';
var WELCOME_MESSAGE = 'Welcome to <emphasis level="reduced">quiz bot</emphasis>! ' + LEVEL_PROMPT ;
var INSTRUCTIONS_MESSAGE = 'Alright, Let\'s begin. I will give an algebraic equation and your task is to find the value of x.';
var GENERAL_UNHANDLED_MESSAGE = 'Sorry, I didn\'t catch that, please repeat.';
var MENU_UNHANDLED_MESSAGE = 'Sorry, I didn\'t catch that. ' + LEVEL_PROMPT;
var MENU_HELP_MESSAGE = LEVEL_PROMPT;
var TRIVIA_HELP_MESSAGE = 'Your answer must be a number. If you didn\'t hear the question, say repeat. To go back to the main menu, say stop. To quit the game say exit.';
var EXIT_MESSAGE = 'Goodbye!';
var questionNumber;
var states = {
  TRIVIA: "_TRIVIAMODE",
  MENU: "_MENUMODE"
};
var requestUri = 'http://api-a70.mangahigh.com';
var sessionKey = 'session_a70';
var questions = require('./questions1');
var currentQuestion;
var score;
var usedKeys = [];
var levelId = 1
var correctAnswerMessages = ['Right!','Correct!', 'That is the right answer!', 'Woohoo!', 'Awesome!', 'Great job!', 'Well done!'];
var incorrectAnswerMessages = ['Wrong!','Incorrect!','That is not the right answer!', 'That is incorrect!'];


function getQuestion() {
  var keys = Object.keys(questions);
  var rnd = Math.floor(Math.random() * keys.length);
  for ( i = 0; i < usedKeys.length; i++ ){
    if (rnd == usedKeys[i]) {
      return getQuestion();
    }
  }
  var key = keys[rnd];
  usedKeys.push(rnd);
  return key;
}

function getMedal(score) {
  if (score === GOLD_MEDAL) {
    return 'G';
  } else if (score >= SILVER_MEDAL) {
    return 'S';
  } else if (score >= BRONZE_MEDAL) {
    return 'B';
  } else {
    return null;
  }
}

function getAnswerReply(answerMessages) {
  return answerMessages[Math.floor(Math.random() * answerMessages.length)];
}

exports.handler = function(event, context, callback){
  var alexa_one = Alexa.handler(event, context);
  alexa_one.registerHandlers(handlers, menuHandlers, triviaModeHandlers);
  alexa_one.appId = APP_ID;
  alexa_one.execute();
};

var userId;
var userSessionId;
var gameSessionId;

var handlers =  {

  "LaunchRequest": function() {
    var alexa = this;
    this.handler.state = states.MENU;
    api.login(10, 1, "gorilla652", function (playerId, sessionId) {
        userId = playerId;
        userSessionId = sessionId;
        alexa.emitWithState('NewSession');
      }
    );
  },

  "UnhandledIntent": function() {
    this.emit(':ask', GENERAL_UNHANDLED_MESSAGE);
  },

  "Unhandled": function() {
    this.emit(':ask', GENERAL_UNHANDLED_MESSAGE);
  }
};

var menuHandlers = Alexa.CreateStateHandler(states.MENU, {

  "NewSession": function () {
    this.emit(':ask', WELCOME_MESSAGE);
  },

  "LevelIntent": function() {
    level = this.event.request.intent.slots.Level.value
    if (level === '1') {
      questions = require('./questions1')
      levelId = 1
    } else if (level === '2') {
      questions = require('./questions2')
      levelId = 2
    } else {
      this.emitWithState('AMAZON.HelpIntent')
    }
    this.emitWithState('AMAZON.StartOverIntent')
  },

  "AMAZON.StartOverIntent": function() {
    var alexa = this;
    questionNumber = 1;
    score = 0;
    this.handler.state = states.TRIVIA;
    api.getGameSessionId(levelId, userSessionId, userId, function(gameSessionId2) {
          gameSessionId = gameSessionId2;
          usedKeys = []
          alexa.emitWithState('QuestionIntent', INSTRUCTIONS_MESSAGE);
      }
    );
  },

  "AMAZON.HelpIntent": function() {
    this.emit(':ask', MENU_HELP_MESSAGE);
  },

  "MenuIntent": function(message) {
    var alexa = this;
    var cardTitle = 'Quizbot Results Card';
    var cardContent = 'This will be sent to the user';
    var repromptSpeech = 'To play a new quiz, ' + LEVEL_PROMPT ;

    if (questionNumber > QUESTION_TOTAL) {
      api.sendResults(levelId, userSessionId, userId, score, gameSessionId, getMedal(score), function() {
        alexa.emit(':askWithCard', message + '! We have just saved your results to mangahigh.', repromptSpeech, cardTitle, cardContent);
      });
    } else {
      alexa.emit(':ask', MENU_HELP_MESSAGE);
    }
  },

  "AMAZON.CancelIntent": function() {
    this.emit(':tell', EXIT_MESSAGE);
  },

  "UnhandledIntent": function() {
    this.emit(':ask', MENU_UNHANDLED_MESSAGE);
  },

  "Unhandled": function() {
    this.emit(':ask', MENU_UNHANDLED_MESSAGE);
  }
});

var triviaModeHandlers = Alexa.CreateStateHandler(states.TRIVIA, {
  "QuestionIntent": function(lastQuestionResult) {
    currentQuestion = getQuestion();
    this.emit(':ask', lastQuestionResult + ' Question ' + questionNumber + '. <break time="0.35s"/>' + currentQuestion);
    questionNumber++;
  },

  "AnswerIntent": function() {
    var guessAnswer = this.event.request.intent.slots.Answer.value;
    var correctAnswer = questions[currentQuestion][0];
    if (guessAnswer === correctAnswer) {
      score++;
      if (questionNumber > QUESTION_TOTAL) {
        this.handler.state = states.MENU;
        this.emitWithState('MenuIntent', getAnswerReply(correctAnswerMessages) + ' You have scored ' + score + ' out of ' + QUESTION_TOTAL);
      } else {
        this.emitWithState('QuestionIntent', getAnswerReply(correctAnswerMessages));
      }

    } else {
      if (questionNumber > QUESTION_TOTAL) {
        this.handler.state = states.MENU;
        this.emitWithState('MenuIntent', getAnswerReply(incorrectAnswerMessages) + ' You have scored ' + score + ' out of ' + QUESTION_TOTAL);
      } else {
        this.emitWithState('QuestionIntent', getAnswerReply(incorrectAnswerMessages));
      }
    }
  },

  "AMAZON.RepeatIntent": function() {
    this.emit(':ask', currentQuestion);
  },

  "AMAZON.HelpIntent": function() {
    this.emit(':ask', TRIVIA_HELP_MESSAGE);
  },

  "AMAZON.StopIntent": function() {
    this.handler.state = states.MENU;
    this.emitWithState('MenuIntent', "");
  },

  "AMAZON.CancelIntent": function() {
    this.emit(':tell', EXIT_MESSAGE);
  },

  "UnhandledIntent": function() {
    this.emit(':ask', GENERAL_UNHANDLED_MESSAGE);
  },

  "Unhandled": function() {
    this.emit(':ask', GENERAL_UNHANDLED_MESSAGE);
  }

});
