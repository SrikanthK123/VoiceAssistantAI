import React, { useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash, faRedo } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import OpenExternalWebsite from './OpenExternalWebsite';
import { APIKey } from './Data';

const Home = () => {
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [visitPageMessage, setVisitPageMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  
  // Check for browser support
  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  // Function to start listening
  const handleStartVoice = () => {
    setIsVoiceActive(true);
    setProcessingMessage('');
    setVisitPageMessage('');
    SpeechRecognition.startListening({ continuous: true });
  };

  // Function to stop listening and process the command
  const handleStopVoices = () => {
    setIsVoiceActive(false);
    SpeechRecognition.stopListening();
    setTimeout(() => {
      processCommand(transcript);
      resetTranscript();
      setProcessingMessage('Processing your command... Please wait.');
    }, 1000);
  };

  const processCommand = async (command) => {
    const lowerCaseCommand = `${command.toLowerCase().trim()} in short`
    console.log('Processing command:', lowerCaseCommand);

    // Regex to match URLs in the command
    const urlMatch = lowerCaseCommand.match(/https?:\/\/[^\s]+/);
    
    if (urlMatch) {
      const urlToOpen = urlMatch[0]; // Get the matched URL
      setVisitPageMessage(`Opening ${urlToOpen}...`);
      speakOutLoud(`I will now open ${urlToOpen}.`);
      
      // Open the URL in a new tab
      window.open(urlToOpen, '_blank');
      return; // Return early to prevent further processing
    }

    // Check for specific command "Hello Bujji"
    if (lowerCaseCommand === 'hello bujji') {
      setVisitPageMessage("Hello Bujji!");
      speakOutLoud("Hello, how can I assist you today?");
      return; // Return early to prevent further processing
    }

    // Continue with general processing for other commands
    await generateAnswer(lowerCaseCommand);
  };

  const generateAnswer = async (question) => {
    if (question.trim() === '') {
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    setShowAlert(false);

    try {
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${APIKey}`,
        method: 'post',
        data: {
          contents: [{ parts: [{ text: question }] }]
        }
      });

      const receivedAnswer = response.data.candidates[0].content.parts[0].text;
      const modifiedAnswer = receivedAnswer
        .replace(/Gemini/g, 'Bujji')
        .replace(/developed by Google/g, 'developed by Srikanth')
        .replace(/trained by Google/g, 'trained by Srikanth');

      setAnswer(modifiedAnswer);
      setShowAnswer(true);

      // AI Voice Response with an explanation
      speakOutLoud(modifiedAnswer);

      // Check for URL in the answer and ask user if they want to visit the page
      const urlInAnswerMatch = modifiedAnswer.match(/https?:\/\/[^\s"]+/);
      if (urlInAnswerMatch) {
        speakOutLoud("I found a link. Do you want me to open it?");
        setVisitPageMessage("Do you want to visit this link?");
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle AI voice response using speech synthesis
  const speakOutLoud = (message) => {
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      console.error('Speech synthesis already in progress.');
      return;
    }

    if (message !== '') {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.onend = () => {
        console.log('Speech synthesis finished.');
      };
      utterance.onerror = (event) => {
        console.error('Speech synthesis error occurred:', event);
      };

      // Speak the message
      synth.speak(utterance);
    }
  };

  // Function to restart voice command
  const handleRestart = () => {
    handleStopVoices(); // Stop listening first
    resetTranscript(); // Reset the transcript
    setProcessingMessage(''); // Clear processing message
    setShowAlert(false); // Hide alert
    setIsVoiceActive(true); // Set voice active to true
    handleStartVoice(); // Restart listening
  };

  return (
    <div className="w-screen min-h-screen p-4 bg-slate-300">
      <h3 className="text-3xl text-center text-green-400 p-3 font-bold bg-slate-50 rounded-lg shadow-lg">
        Voice Assistant AI
      </h3>
      <div className="roboImage flex justify-center bg-slate-200 m-3 rounded-sm">
        <img
          src="https://i.pinimg.com/originals/79/04/42/7904424933cc535b666f2de669973530.gif"
          alt="robot"
          className="w-[500px]"
        />
      </div>
      <div className="flex justify-center p-4 bg-slate-800 m-3">
        <button
          className={` text-white px-3 py-1 rounded-md shadow-lg m-4 hover:bg-slate-700 transition duration-300 text-center ${isVoiceActive ? 'bg-red-700' : ''}`}
          onClick={isVoiceActive ? handleStopVoices : handleStartVoice}
        >
          <FontAwesomeIcon icon={isVoiceActive ? faMicrophoneSlash : faMicrophone} size="2x" />
        </button>
        <button
          className=" text-white px-3 py-2 rounded-md hover:bg-slate-700 transition duration-300 shadow-lg m-4 text-center "
          onClick={handleRestart}
        >
          <FontAwesomeIcon icon={faRedo} size="2x" />
        </button>
      </div>
      {isVoiceActive && (
        <div className="flex justify-center mt-4">
          <p className="text-slate-700">Transcript: <span className='text-green-700 font-bold'>{transcript || "🤖 Please say something!"}</span></p>
        </div>
      )}
      {processingMessage && (
        <div className="flex justify-center mt-4">
          <p className="text-black-400">{processingMessage}</p>
        </div>
      )}
      {!isVoiceActive && (
        <div className="flex justify-center m-4 ">
          <p className="text-black-400">Microphone is off. Please wait for the processing.</p>
        </div>
      )}
      {visitPageMessage && (
        <div className="flex justify-center mt-4">
          <p className="text-black-400">{visitPageMessage}</p>
        </div>
      )}
      {showAnswer && answer && (
        <div className="flex justify-center mt-4">
          <p className="text-black-400">{answer}</p>
        </div>
      )}
      <OpenExternalWebsite />
    </div>
  );
};

export default Home;
